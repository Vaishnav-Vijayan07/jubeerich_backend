const { Sequelize, where, Op } = require("sequelize");
const db = require("../models");
const path = require("path");
const fs = require("fs");
const { deleteFile, deleteUnwantedFiles } = require("../utils/upsert_helpers");
const { addLeadHistory } = require("../utils/academic_query_helper");

exports.getTasks = async (req, res) => {
  try {
    const userId = req.userDecodeId;
    const tasks = await db.tasks.findAll({
      include: [
        {
          model: db.userPrimaryInfo,
          as: "student_name",
          attributes: ["flag_id"],
          required: false,
          include: [
            {
              model: db.flag,
              as: "user_primary_flags",
              attributes: ["flag_name", "color"],
              required: false,
            },
            {
              model: db.country,
              as: "preferredCountries",
              attributes: ["country_name", "id"],
              through: { attributes: [] },
              required: false,
            },
          ],
        },
      ],
      where: { userId: userId },
    });

    console.log("tasks ===>", tasks);

    res.status(200).json({
      status: true,
      message: "Tasks retrieved successfully",
      data: tasks,
    });
  } catch (error) {
    console.error(`Error fetching tasks: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params; // Get task ID from URL parameters
    const userId = req.userDecodeId; // Get user ID from decoded JWT or session

    // Fetch the task by ID and ensure it belongs to the authenticated user
    const task = await db.tasks.findOne({
      where: { id: id, userId: userId },
    });

    if (!task) {
      return res.status(404).json({
        status: false,
        message: "Task not found or does not belong to the user.",
      });
    }

    res.status(200).json({
      status: true,
      message: "Task retrieved successfully",
      data: task,
    });
  } catch (error) {
    console.error(`Error fetching task by ID: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.finishTask = async (req, res) => {
  const { isCompleted, id } = req.body;

  const { role_name, userDecodeId: userId } = req;

  const task = await db.tasks.findByPk(id);

  if (!task) {
    return res.status(404).json({
      status: false,
      message: "Task not found.",
    });
  }

  const studentId = task.studentId;
  const student = await db.userPrimaryInfo.findByPk(studentId);

  if (!student) {
    return res.status(404).json({
      status: false,
      message: "Student not found.",
    });
  }

  // start the transaction
  const transaction = await db.sequelize.transaction();

  try {
    // Fetch preferred countries from the join table
    const preferredCountries = await db.userContries.findAll({
      where: { user_primary_info_id: studentId },
      attributes: ["country_id"],
    });

    const countryIds = preferredCountries.map((entry) => entry.country_id);

    // Fetch least assigned users for each country
    let leastAssignedUsers = [];
    for (const countryId of countryIds) {
      const users = await getLeastAssignedUsers(countryId);
      if (users?.leastAssignedUserId) {
        leastAssignedUsers = leastAssignedUsers.concat(
          users.leastAssignedUserId
        );
      }
      console.log("users ==========>", users.leastAssignedUserId);
    }

    if (leastAssignedUsers.length > 0) {
      // Remove existing counselors for the student
      await db.userCounselors.destroy({
        where: { user_id: studentId },
      });

      // Add new counselors
      const userCounselorsData = leastAssignedUsers.map((userId) => ({
        user_id: studentId,
        counselor_id: userId,
      }));

      await db.userCounselors.bulkCreate(userCounselorsData);

      if (isCompleted) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);

        let countryName = "Unknown";
        if (countryIds.length > 0) {
          // const country = await db.country.findByPk(countryIds[0]);
          const countries = await db.country.findAll({
            where: { id: countryIds },
            attributes: ["country_name"],
          });

          if (countries) {
            countryName = countries
              .map((country) => country.country_name)
              .join(", ");
          }
        }

        // Create tasks for each least assigned user
        for (const userId of leastAssignedUsers) {
          await db.tasks.create({
            studentId: student.id,
            userId: userId,
            title: `${student.full_name} - ${countryName} - ${student.phone}`,
            description: `${student.full_name} from ${student?.city}, has applied for admission in ${countryName}`,
            dueDate: dueDate,
            updatedBy: req.userDecodeId,
          });
        }
      }
    }

    // Update the original task as completed
    task.isCompleted = isCompleted;
    await task.save();

    await addLeadHistory(
      studentId,
      `Task finished by ${role_name}`,
      userId,
      null,
      transaction
    );

    //commit the transaction
    await transaction.commit();

    // Send success response
    return res.status(200).json({
      status: true,
      message: "Task successfully updated and assigned.",
      task,
      leastAssignedUsers,
    });
  } catch (error) {
    console.error(`Error finishing task: ${error}`);
    //rollback the transaction
    await transaction.rollback();
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.assignNewCountry = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id, newCountryId } = req.body;
    const { role_id, userDecodeId: userId, role_name } = req;

    // Find task by primary key
    const task = await db.tasks.findByPk(id);
    if (!task) {
      return res.status(404).json({
        status: false,
        message: "Task not found.",
      });
    }

    const studentId = task.studentId;
    // Find student by primary key
    const student = await db.userPrimaryInfo.findByPk(studentId);
    if (!student) {
      return res.status(404).json({
        status: false,
        message: "Student not found.",
      });
    }

    if (newCountryId) {
      // Check if the new country is already assigned to the student
      const existingCountry = await db.userContries.findOne({
        where: {
          user_primary_info_id: studentId,
          country_id: newCountryId,
        },
        transaction,
      });

      if (existingCountry) {
        return res.status(409).json({
          status: false,
          message: "The country is already assigned to the student.",
        });
      }

      // Assign the new country to student's preferred countries
      await student.addPreferredCountry(newCountryId, { transaction });

      // Create study preference for the student
      await db.studyPreference.create(
        {
          userPrimaryInfoId: studentId,
          countryId: newCountryId,
        },
        { transaction }
      );
      // Fetch country name for the task title
      const country = await db.country.findByPk(newCountryId, {
        attributes: ["country_name"],
        transaction,
      });
      const countryName = country ? country.country_name : "Unknown";

      const users = await getLeastAssignedUsers(newCountryId);
      if (users?.leastAssignedUserId) {
        const leastAssignedUserId = users.leastAssignedUserId;

        // Assign the new counselor to the student
        await db.userCounselors.create(
          {
            user_id: studentId,
            counselor_id: leastAssignedUserId,
          },
          { transaction }
        );

        // Prepare due date and task creation details
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);

        // Create task for the least assigned user
        await db.tasks.create(
          {
            studentId: student.id,
            userId: leastAssignedUserId,
            title: `${student.full_name} - ${countryName} - ${student.phone}`,
            description: `${student.full_name} from ${student?.city}, has applied for admission in ${countryName}`,
            dueDate: dueDate,
            updatedBy: req.userDecodeId,
          },
          { transaction }
        );
      }

      if (role_id == process.env.COUNSELLOR_ROLE_ID) {
        const { country_id } = await db.adminUsers.findByPk(userId);

        await addLeadHistory(
          studentId,
          `Country ${countryName} added by ${role_name}`,
          userId,
          country_id,
          transaction
        );
      } else {
        await addLeadHistory(
          studentId,
          `Country ${countryName} added by ${role_name}`,
          userId,
          null,
          transaction
        );
      }
    }

    // Commit transaction after successful operations
    await transaction.commit();

    // Send success response
    return res.status(200).json({
      status: true,
      message: "Task successfully updated and assigned.",
      task,
    });
  } catch (error) {
    // Rollback transaction in case of errors
    if (transaction) await transaction.rollback();

    console.error(`Error assigning new country: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getStudentBasicInfoById = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log("Fetching info for studentId:", studentId);

    // Fetch basic information for the student
    const basicInfo = await db.userBasicInfo.findOne({
      where: { user_id: studentId },
    });

    // Fetch primary information for the student
    const primaryInfo = await db.userPrimaryInfo.findOne({
      where: { id: studentId },
      attributes: [
        "id",
        "full_name",
        "email",
        "phone",
        "city",
        "office_type",
        "remarks",
        "source_id",
        "channel_id",
        "lead_received_date",
        "status_id",
        "followup_date",
        "lead_received_date",
      ],
      include: [
        {
          model: db.country,
          as: "preferredCountries", // Adjusted alias to match Sequelize associations
          attributes: ["id", "country_name"], // Only include ID and name
          through: {
            attributes: [], // Exclude attributes from the join table
          },
        },
        {
          model: db.studyPreference,
          as: "studyPreferences",
          attributes: ["id"], // Include the country name
        },
        {
          model: db.leadSource,
          as: "source_name",
          attributes: ["source_name"],
        },
        {
          model: db.leadChannel,
          as: "channel_name",
          attributes: ["channel_name"],
        },
        {
          model: db.status,
          as: "status",
          attributes: ["status_name"],
        },
        {
          model: db.academicInfos,
          as: "userAcademicInfos", // The alias you defined in the association
        },
        {
          model: db.flag,
          as: "user_primary_flags",
          attributes: ["flag_name", "color"],
          required: false,
        },
        {
          model: db.workInfos,
          as: "userWorkInfos", // The alias you defined in the association
        },
      ],
      nest: true,
    });

    // Extract data values or use default empty object if no data
    const basicInfoData = basicInfo ? basicInfo.dataValues : {};
    const primaryInfoData = primaryInfo ? primaryInfo.dataValues : {};

    // Combine primaryInfoData with filtered preferredCountries
    const combinedInfo = {
      ...primaryInfoData,
      country_ids:
        primaryInfo?.preferredCountries?.map((country) => country.id) || [],
      country_names:
        primaryInfo?.preferredCountries?.map(
          (country) => country.country_name
        ) || [],
      source_name: primaryInfo?.source_name?.source_name,
      channel_name: primaryInfo?.channel_name?.channel_name,
      flag_name: primaryInfo?.user_primary_flags?.flag_name,
      flag_color: primaryInfo?.user_primary_flags?.color,
      ...basicInfoData,
    };

    // Send the response with combined information
    res.status(200).json({
      status: true,
      message: "Student info retrieved successfully",
      data: combinedInfo,
    });
  } catch (error) {
    console.error(`Error fetching student info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
exports.getBasicInfoById = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log("Fetching info for studentId:", studentId);

    // Fetch basic information for the student
    const basicInfo = await db.userBasicInfo.findOne({
      where: { user_id: studentId },
    });

    // Fetch primary information for the student
    const primaryInfo = await db.userPrimaryInfo.findOne({
      where: { id: studentId },
      attributes: [
        "id",
        "full_name",
        "email",
        "phone",
        "city",
        "office_type",
        "remarks",
        "branch_id",
        "franchise_id",
        "region_id",
      ],
      include: [
        {
          model: db.country,
          as: "preferredCountries", // Adjusted alias to match Sequelize associations
          attributes: ["id", "country_name"], // Only include ID and name
          through: {
            attributes: [], // Exclude attributes from the join table
          },
        },
      ],
    });

    // Send the response with combined information
    res.status(200).json({
      status: true,
      message: "Student info retrieved successfully",
      data: {
        basicInfo: basicInfo,
        primaryInfo: primaryInfo,
      },
    });
  } catch (error) {
    console.error(`Error fetching student info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.saveBasicInfo = async (req, res) => {
  try {
    const { basicInfo, primaryInfo, student_id } = req.body;

    const policeDocs = [];

    // Fetch existing data from the database
    const existingPrimaryData = await db.userPrimaryInfo.findByPk(student_id);
    const existingBasicData = await db.userBasicInfo.findOne({
      where: { user_id: Number(student_id) },
    });

    // Loop through the documents received from the frontend
    req.body.police_clearance_docs?.forEach(async (doc, index) => {
      let certificatePath;
      const certificateFile = req.files.find(
        (file) =>
          file.fieldname === `police_clearance_docs[${index}][certificate]`
      );

      // Check if there's a new file for this document
      if (certificateFile) {
        certificatePath = certificateFile.filename;

        // Check if there was a previous file saved and delete it
        const previousCertificatePath =
          existingBasicData && existingBasicData.police_clearance_docs
            ? existingBasicData.police_clearance_docs[index]?.certificate
            : null;

        if (previousCertificatePath) {
          console.log(previousCertificatePath);

          await deleteFile("policeClearenceDocuments", previousCertificatePath);
        }
      } else {
        // No new file, get the existing path from the body
        certificatePath =
          req.body.police_clearance_docs[index].certificate_path;
      }

      policeDocs.push({
        id: Number(doc.id),
        certificate: certificatePath,
        country_name: req.body.police_clearance_docs[index].country_name,
      });
    });

    console.log(policeDocs);

    const parsedPrimaryInfo = {
      ...primaryInfo,
      id: parseInt(primaryInfo.id, 10), // Convert ID to an integer
      office_type: parseInt(primaryInfo.office_type, 10), // Convert office_type to an integer
      branch_id:
        primaryInfo.branch_id !== "null"
          ? parseInt(primaryInfo.branch_id, 10)
          : null, // Convert branch_id or set to null
      franchise_id:
        primaryInfo.franchise_id !== "null"
          ? parseInt(primaryInfo.franchise_id, 10)
          : null, // Convert franchise_id or set to null
      region_id:
        primaryInfo.region_id !== "null"
          ? parseInt(primaryInfo.region_id, 10)
          : null, // Convert region_id or set to null
    };

    const parsedBasicInfo = {
      passport_no: basicInfo.passport_no,
      dob: basicInfo.dob !== "null" ? new Date(basicInfo.dob) : null, // Convert to Date or null
      gender: basicInfo.gender, // Assuming gender is already correct
      marital_status:
        basicInfo.marital_status !== "null"
          ? parseInt(basicInfo.marital_status, 10)
          : null, // Convert to integer or null
      nationality: basicInfo.nationality,
      secondary_number: basicInfo.secondary_number,
      state: basicInfo.state,
      country: basicInfo.country,
      address: basicInfo.address,
      emergency_contact_name: basicInfo.emergency_contact_name,
      emergency_contact_relationship: basicInfo.emergency_contact_relationship,
      emergency_contact_phone: basicInfo.emergency_contact_phone,
      concern_on_medical_condition:
        basicInfo.concern_on_medical_condition === "true", // Convert string to boolean
      concern_on_medical_condition_details:
        basicInfo.concern_on_medical_condition_details,
      criminal_offence: basicInfo.criminal_offence === "true", // Convert string to boolean
      criminal_offence_details: basicInfo.criminal_offence_details,
      police_clearance_docs: [], // Initialize as an empty array
    };

    // Update or create primary information

    if (existingPrimaryData) {
      await existingPrimaryData.update(parsedPrimaryInfo);
    } else {
      await db.userPrimaryInfo.create({
        ...parsedPrimaryInfo,
        user_id: Number(student_id),
      });
    }

    // Update or create basic information
    parsedBasicInfo.police_clearance_docs = policeDocs;
    if (existingBasicData) {
      await existingBasicData.update(parsedBasicInfo);
    } else {
      await db.userBasicInfo.create({
        user_id: Number(student_id),
        ...parsedBasicInfo,
      });
    }

    // Send a success response
    res.status(200).json({
      status: true,
      message: "Basic information saved successfully",
    });
  } catch (error) {
    console.error(`Error saving basic info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.deletePoliceClearenceDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId } = req.body;

    console.log(id);
    console.log(itemId);

    const basicInfo = await db.userBasicInfo.findByPk(id);

    if (!basicInfo) {
      return res.status(404).json({
        status: false,
        message: "Info not found",
      });
    }

    const policeDocs = basicInfo.police_clearance_docs;

    const itemToDelete = policeDocs.find((item) => item.id === itemId);

    const certificatePath = itemToDelete.certificate;

    await deleteFile("policeClearenceDocuments", certificatePath);

    const updatedDocs = policeDocs.filter((item) => item.id !== itemId);

    await basicInfo.update({ police_clearance_docs: updatedDocs });
    res.status(200).json({
      status: true,
      message: "Info deleted successfully",
    });
  } catch (error) {
    console.error(`Error fetching student info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getStudentAcademicInfoById = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await db.userPrimaryInfo.findByPk(id);
    if (!student) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const academicInfos = await student.getUserAcademicInfos();
    const modifiedData = academicInfos.map((item) => {
      return {
        id: item.id,
        qualification: item.qualification,
        place: item.place,
        percentage: item.percentage,
        year_of_passing: item.year_of_passing,
        backlogs: item.backlogs,
      };
    });

    res.status(200).json({
      status: true,
      message: "Student info retrieved successfully",
      data: modifiedData,
    });
  } catch (error) {
    console.error(`Error fetching student academic info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getStudentExamInfoById = async (req, res) => {
  const { id } = req.params;

  try {
    const student = await db.userPrimaryInfo.findByPk(id);
    if (!student) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const examInfos = await student.getExams();
    const modifiedData = examInfos.map((item) => {
      return {
        id: item.id,
        exam_type: item.exam_type,
        listening_score: item.listening_score,
        speaking_score: item.speaking_score,
        reading_score: item.reading_score,
        writing_score: item.writing_score,
        overall_score: item.overall_score,
        exam_date: item.exam_date,
        score_card: item.score_card || null,
      };
    });

    res.status(200).json({
      status: true,
      message: "Student info retrieved successfully",
      data: modifiedData,
    });
  } catch (error) {
    console.error(`Error fetching student exam info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getStudentWorkInfoById = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log("Fetching info for studentId:", studentId);

    // Find the user by their primary key (studentId)
    const user = await db.userPrimaryInfo.findByPk(studentId);

    // If user is not found, return an error response
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Retrieve the associated workInfos using the magic method
    const workInfos = await user.getUserWorkInfos();

    const workDataFormatted = workInfos.map((work) => {
      return {
        id: work?.id,
        years: work?.years,
        company: work?.company,
        designation: work?.designation,
        from: work?.from,
        to: work?.to,
        bank_statement: work?.bank_statement || null,
        job_offer_document: work?.job_offer_document || null,
        appointment_document: work?.appointment_document || null,
        payslip_document: work?.payslip_document || null,
        experience_certificate: work?.experience_certificate || null,
      };
    });

    // Return the work information in the response
    res.status(200).json({
      status: true,
      message: "Student Work info retrieved successfully",
      data: workDataFormatted, // Include the fetched workInfos in the response
    });
  } catch (error) {
    console.error(`Error fetching student Work info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getStudentStudyPreferenceInfoById = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log("Fetching info for studentId:", studentId);

    // Fetch basic information for the student
    const studyPreferenceInfo = await db.userStudyPreference.findOne({
      where: { user_id: studentId },
    });

    // Extract data values, or use default empty object if no data
    const studyPreferenceInfoData = studyPreferenceInfo
      ? studyPreferenceInfo.dataValues
      : {};

    // Send the response with combined information
    res.status(200).json({
      status: true,
      message: "Student info retrieved successfully",
      data: studyPreferenceInfoData,
    });
  } catch (error) {
    console.error(`Error fetching student info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

const getLeastAssignedUsers = async (countryId) => {
  const roleId = process.env.COUNSELLOR_ROLE_ID;
  try {
    // Use raw SQL to execute the query
    const [results] = await db.sequelize.query(
      `
      WITH user_assignments AS (
        SELECT 
          "admin_users"."id" AS "user_id", 
          COUNT("user_counselors"."counselor_id") AS "assignment_count"
        FROM "admin_users"
        LEFT JOIN "user_counselors" 
          ON "admin_users"."id" = "user_counselors"."counselor_id"
        WHERE "admin_users"."role_id" = :roleId 
          AND "admin_users"."country_id" = :countryId
        GROUP BY "admin_users"."id"
      )
      SELECT "user_id"
      FROM user_assignments
      ORDER BY "assignment_count" ASC, "user_id" ASC
      LIMIT 1;
    `,
      {
        replacements: { roleId, countryId },
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    console.log("results ===>", results);

    // Check if results is defined and not null
    if (!results || Object.keys(results).length === 0) {
      return {
        leastAssignedUserId: null,
      };
    }

    // Extract user_id if results has user_id
    const leastAssignedUserId = results.user_id;

    // If user_id is undefined, return an error response
    if (leastAssignedUserId === undefined) {
      return {
        leastAssignedUserId: null,
      };
    }

    return {
      leastAssignedUserId,
    };
  } catch (error) {
    console.error(`Error finding least assigned users: ${error}`);
    return {
      leastAssignedUserId: null,
    };
  }
};
