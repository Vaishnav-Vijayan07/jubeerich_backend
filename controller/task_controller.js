const { where, Op, fn, col, Sequelize } = require("sequelize");
const db = require("../models");
const path = require("path");
const fs = require("fs");
const { deleteFile, deleteUnwantedFiles } = require("../utils/upsert_helpers");
const { addLeadHistory, getRoleForUserHistory, getRegionDataForHistory } = require("../utils/academic_query_helper");
const moment = require("moment");
const { createTaskDesc, updateTaskDesc } = require("../utils/task_description");
const stageDatas = require("../constants/stage_data");
const IdsFromEnv = require("../constants/ids");

exports.getTasks = async (req, res) => {
  const { date } = req.query;

  try {
    const userId = req.userDecodeId;

    const adminUser = await db.adminUsers.findByPk(userId, {
      include: [
        {
          model: db.country,
          attributes: ["country_name", "id"],
          through: { attributes: [] },
        },
      ],
    });

    let countryIds = adminUser?.countries?.map((data) => data?.id);

    if (!adminUser) {
      return res.status(404).json({
        status: false,
        message: "Admin user not found",
      });
    }

    let countryFilter;

    if (adminUser?.role_id == process.env.COUNSELLOR_ROLE_ID || adminUser?.role_id == process.env.COUNTRY_MANAGER_ID) {
      countryFilter = {
        model: db.country,
        as: "preferredCountries",
        attributes: ["id", "country_name"],
        through: {
          model: db.userContries,
          attributes: ["country_id", "followup_date", "status_id"],
          where: { country_id: { [Op.in]: countryIds }, status_id: { [Op.ne]: process.env.SPAM_LEAD_STATUS_ID } },
        },
        required: true,
        include: [
          {
            model: db.status,
            as: "country_status",
            attributes: ["id", "status_name", "color"],
            required: false,
            through: {
              model: db.userContries,
              attributes: [],
            },
            where: { id: { [Op.eq]: db.sequelize.col("student_name.preferredCountries.user_countries.status_id") } },
          },
        ],
      };
    } else {
      countryFilter = {
        model: db.country,
        as: "preferredCountries",
        attributes: ["id", "country_name"],
        through: {
          model: db.userContries,
          attributes: ["country_id", "followup_date", "status_id"],
          where: { status_id: { [Op.ne]: process.env.SPAM_LEAD_STATUS_ID } },
        },
        required: true,
        include: [
          {
            model: db.status,
            as: "country_status",
            attributes: ["id", "status_name", "color"],
            required: false,
            through: {
              model: db.userContries,
              attributes: [],
            },
            where: { id: { [Op.eq]: db.sequelize.col("student_name.preferredCountries.user_countries.status_id") } },
          },
        ],
      };
    }

    const mainInclude = {
      model: db.userPrimaryInfo,
      as: "student_name",
      attributes: [
        "id",
        "flag_id",
        [
          db.Sequelize.literal(
            `( SELECT COALESCE(json_agg(row_to_json(f)), '[]'::json) FROM flags AS f WHERE f.id = ANY("student_name"."flag_id") )`
          ),
          "flag_details_rows",
        ],
      ],
      required: true,
      include: [countryFilter],
    };

    const tasks = await db.tasks.findAll({
      include: [mainInclude],
      where: {
        userId: userId,
        [Op.and]: Sequelize.where(fn("DATE", col("dueDate")), "=", date),
      },
      order: [["createdAt", "DESC"]],
    });

    const pendingTasks = await db.tasks.findAll({
      include: [mainInclude],
      where: {
        userId: userId,
        [Op.and]: Sequelize.where(fn("DATE", col("dueDate")), "<", date),
        isCompleted: false,
      },
      order: [["createdAt", "DESC"]],
    });

    console.log("Tasks", JSON.stringify(tasks, null, 2));

    res.status(200).json({
      status: true,
      message: "Tasks retrieved successfully",
      data: tasks,
      pendingTasks: pendingTasks,
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
    const userId = req.userDecodeId;

    const adminUser = await db.adminUsers.findByPk(userId); // Await the promise to get the admin user data

    if (!adminUser) {
      return res.status(404).json({
        status: false,
        message: "Admin user not found",
      });
    }

    let countryFilter;

    if (adminUser?.role_id == process.env.COUNSELLOR_ROLE_ID || adminUser?.role_id == process.env.COUNTRY_MANAGER_ID) {
      countryFilter = {
        model: db.country,
        as: "preferredCountries",
        attributes: ["id", "country_name"],
        through: {
          model: db.userContries,
          attributes: ["country_id", "followup_date", "status_id"],
          // where: { country_id: adminUser?.country_id },
          where: {
            country_id: {
              [db.Sequelize.Op.in]: db.sequelize.literal(
                `(SELECT country_id FROM admin_user_countries WHERE admin_user_id = ${userId})`
              ),
            },
          },
        },
        required: false,
        include: [
          {
            model: db.status,
            as: "country_status",
            attributes: ["id", "status_name", "color"],
            required: false,
            through: {
              model: db.userContries,
              attributes: [],
            },
            where: { id: { [Op.eq]: db.sequelize.col("student_name.preferredCountries.user_countries.status_id") } },
          },
        ],
      };
    } else {
      countryFilter = {
        model: db.country,
        as: "preferredCountries",
        attributes: ["id", "country_name"],
        through: {
          model: db.userContries,
          attributes: ["country_id", "followup_date", "status_id"],
        },
        required: false,
        include: [
          {
            model: db.status,
            as: "country_status",
            attributes: ["id", "status_name", "color"],
            required: false,
            through: {
              model: db.userContries,
              attributes: [],
            },
            where: { id: { [Op.eq]: db.sequelize.col("student_name.preferredCountries.user_countries.status_id") } },
          },
        ],
      };
    }

    // Fetch the task by ID and ensure it belongs to the authenticated user
    const task = await db.tasks.findOne({
      where: { id: id, userId: userId },
      include: [
        {
          model: db.userPrimaryInfo,
          as: "student_name",
          attributes: ["flag_id"],
          required: true,
          include: [countryFilter],
        },
      ],
    });

    const flagDetails = await task?.student_name?.flag_details;

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
      flags: flagDetails,
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

    console.log("countryIds ===>", countryIds);

    // Fetch least assigned users for each country
    let leastAssignedUsers = [];
    for (const countryId of countryIds) {
      const users = await getLeastAssignedUsers(countryId);
      if (users?.leastAssignedUserId) {
        leastAssignedUsers = leastAssignedUsers.concat(users.leastAssignedUserId);
      }
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
        const statusRes = await updateStatus(studentId, preferredCountries?.[0]?.country_id);

        if (!statusRes) {
          return res.status(404).json({
            status: false,
            message: "Status not updated",
          });
        }
        const dueDate = new Date();

        let countryName = "Unknown";
        if (countryIds.length > 0) {
          // const country = await db.country.findByPk(countryIds[0]);
          const countries = await db.country.findAll({
            where: { id: countryIds },
            attributes: ["country_name", "country_code"],
          });

          if (countries) {
            // countryName = countries.map((country) => country.country_name).join(", ");
            countryName = countries?.map((country) => country.country_code).join(", ");
          }
        }

        let formattedDesc = await createTaskDesc(student, student.id);

        if (!formattedDesc) {
          return res.status(500).json({
            status: false,
            message: "Description error",
          });
        }

        // Create tasks for each least assigned user
        for (const userId of leastAssignedUsers) {
          await db.tasks.create({
            studentId: student.id,
            userId: userId,
            title: `${student.full_name} - ${countryName}`,
            // description: `${student.full_name} from ${student?.city}, has applied for admission in ${countryName}`,
            description: formattedDesc,
            dueDate: dueDate,
            updatedBy: req.userDecodeId,
            assigned_country: preferredCountries?.[0]?.country_id,
          });
        }
        const { role_name: role } = await getRoleForUserHistory(leastAssignedUsers[0]);
        await addLeadHistory(studentId, `Task finished by ${role_name}`, userId, null, transaction);
        await addLeadHistory(studentId, `Task assigned to ${countryName}'s ${role}`, userId, null, transaction);
      }
    }

    // Update the original task as completed
    task.isCompleted = isCompleted;
    await task.save();

    await student.update({
      stage: stageDatas.counsellor,
    });

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

exports.completeTask = async (req, res) => {
  // start the transaction
  const transaction = await db.sequelize.transaction();

  try {
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

    task.isCompleted = isCompleted;
    await task.save();

    await addLeadHistory(studentId, `Task Completed by ${role_name}`, userId, null, transaction);

    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "Task successfully comleted.",
      task,
    });
  } catch (error) {
    console.error(`Error completing task: ${error}`);
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
    const { role_id, userDecodeId: userId, role_name: current_user_role } = req;

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
      // await student.addPreferredCountry(newCountryId, { transaction });

      // Assign the new lead status to student's preferred countries
      // await student.addPreferredStatus(IdsFromEnv.NEW_LEAD_STATUS_ID, { transaction });

      // Assign the new country to student's preferred countries with status
      await db.userContries.create(
        { user_primary_info_id: student.id, country_id: newCountryId, status_id: IdsFromEnv.NEW_LEAD_STATUS_ID },
        { transaction }
      );

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
        attributes: ["country_name", "country_code"],
        transaction,
      });
      // const countryName = country ? country.country_name : "Unknown";
      const countryName = country ? country.country_code : "Unknown";

      const users = await getLeastAssignedUsers(newCountryId);

      if (users?.leastAssignedUserId) {
        const leastAssignedUserId = users.leastAssignedUserId;

        // Assign the new counselor to the student
        if (userId != leastAssignedUserId) {
          await db.userCounselors.create(
            {
              user_id: studentId,
              counselor_id: leastAssignedUserId,
            },
            { transaction }
          );
        }
        // Prepare due date and task creation details
        const dueDate = new Date();

        let formattedDesc = await createTaskDesc(student, student.id);

        if (!formattedDesc) {
          return res.status(500).json({
            status: false,
            message: "Description error",
          });
        }

        // Create task for the least assigned user
        if (role_id == process.env.BRANCH_COUNSELLOR_ID || role_id == process.env.FRANCHISE_COUNSELLOR_ID) {
          await db.tasks.create(
            {
              studentId: student.id,
              userId: req.userDecodeId,
              title: `${student.full_name} - ${countryName}`,
              // description: `${student.full_name} from ${student?.city}, has applied for admission in ${countryName}`,
              description: formattedDesc,
              dueDate: dueDate,
              updatedBy: req.userDecodeId,
              assigned_country: newCountryId,
            },
            { transaction }
          );
        } else {
          await db.tasks.create(
            {
              studentId: student.id,
              userId: leastAssignedUserId,
              title: `${student.full_name} - ${countryName}`,
              // description: `${student.full_name} from ${student?.city}, has applied for admission in ${countryName}`,
              description: formattedDesc,
              dueDate: dueDate,
              updatedBy: req.userDecodeId,
              assigned_country: newCountryId,
            },
            { transaction }
          );
        }

        const { role_name } = await getRoleForUserHistory(leastAssignedUserId);
        const { branch_id } = await db.adminUsers.findByPk(userId);

        let region_name = null;

        if (role_id == process.env.COUNSELLOR_ROLE_ID) {
          await addLeadHistory(studentId, `Country ${countryName} added by ${current_user_role}`, userId, null, transaction);
        } else if (role_id == IdsFromEnv.BRANCH_COUNSELLOR_ID) {
          const region = await getRegionDataForHistory(branch_id);
          region_name = region.region_name;
          await addLeadHistory(
            studentId,
            `Country ${countryName} added by ${current_user_role} - ${region_name}`,
            userId,
            null,
            transaction
          );
        } else {
          await addLeadHistory(studentId, `Country ${countryName} added by ${current_user_role}`, userId, null, transaction);
        }

        if (role_id == IdsFromEnv.BRANCH_COUNSELLOR_ID) {
          await addLeadHistory(studentId, `Task assigned to ${current_user_role} - ${region_name}`, userId, null, transaction);
        } else {
          await addLeadHistory(studentId, `Task assigned to ${countryName}'s ${role_name}`, userId, null, transaction);
        }
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

    console.error(`Error assigning new country: ${error}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getStudentBasicInfoById = async (req, res) => {
  try {
    const studentId = req.params.id;
    const userId = req.userDecodeId;

    const adminUser = await db.adminUsers.findByPk(userId); // Await the promise to get the admin user data

    if (!adminUser) {
      return res.status(404).json({
        status: false,
        message: "Admin user not found",
      });
    }

    let countryFilter;

    let unfilteredCountries = await db.userPrimaryInfo.findOne({
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
        "flag_id",
      ],
      include: [
        {
          model: db.country,
          as: "preferredCountries",
          attributes: ["id", "country_name", "country_code"],
          through: {
            model: db.userContries,
            attributes: [],
          },
        },
      ],
    });

    if (adminUser?.role_id == process.env.COUNSELLOR_ROLE_ID || adminUser?.role_id == process.env.COUNTRY_MANAGER_ID) {
      countryFilter = {
        model: db.country,
        as: "preferredCountries",
        attributes: ["id", "country_name", "country_code"],
        through: {
          model: db.userContries,
          attributes: ["country_id", "followup_date", "status_id"],
          // where: { country_id: adminUser?.country_id },
          where: {
            country_id: {
              [db.Sequelize.Op.in]: db.sequelize.literal(
                `(SELECT country_id FROM admin_user_countries WHERE admin_user_id = ${userId})`
              ),
            },
          },
        },
        required: false,
        include: [
          {
            model: db.status,
            as: "country_status",
            attributes: ["id", "status_name", "color"],
            required: false,
            through: {
              model: db.userContries,
              attributes: [],
            },
            where: { id: { [Op.eq]: db.sequelize.col("preferredCountries.user_countries.status_id") } },
          },
        ],
      };
    } else {
      countryFilter = {
        model: db.country,
        as: "preferredCountries",
        attributes: ["id", "country_name", "country_code"],
        through: {
          model: db.userContries,
          attributes: ["country_id", "followup_date", "status_id"],
        },
        required: false,
        include: [
          {
            model: db.status,
            as: "country_status",
            attributes: ["id", "status_name", "color"],
            required: false,
            through: {
              model: db.userContries,
              attributes: [],
            },
            where: { id: { [Op.eq]: db.sequelize.col("preferredCountries.user_countries.status_id") } },
          },
        ],
      };
    }

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
        "flag_id",
      ],
      include: [
        countryFilter,
        // {
        //   model: db.country,
        //   as: "preferredCountries", // Adjusted alias to match Sequelize associations
        //   attributes: ["id", "country_name"], // Only include ID and name
        //   through: {
        //     attributes: [], // Exclude attributes from the join table
        //   },
        // },
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
        // {
        //   model: db.flag,
        //   as: "user_primary_flags",
        //   attributes: ["flag_name", "color"],
        //   required: false,
        // },
        {
          model: db.workInfos,
          as: "userWorkInfos", // The alias you defined in the association
        },
        {
          model: db.passportDetails,
          as: "passportDetails",
          attributes: ["passports"],
        },
      ],
      nest: true,
    });

    const flagDetails = await primaryInfo?.flag_details;

    // Extract data values or use default empty object if no data
    const basicInfoData = basicInfo ? basicInfo.dataValues : {};
    const primaryInfoData = primaryInfo ? primaryInfo.dataValues : {};

    const passportNumber = primaryInfo?.passportDetails?.[0]?.passports?.sort((a, b) => {
      const dateA = new Date(a.date_of_expiry);
      const dateB = new Date(b.date_of_expiry);
      return dateB - dateA;
    });

    // Combine primaryInfoData with filtered preferredCountries
    const combinedInfo = {
      ...primaryInfoData,
      country_ids: primaryInfo?.preferredCountries?.map((country) => country.id) || [],
      // country_names: primaryInfo?.preferredCountries?.map((country) => country.country_name) || [],
      country_names: unfilteredCountries?.preferredCountries?.map((country) => country.country_code) || [],
      source_name: primaryInfo?.source_name?.source_name,
      channel_name: primaryInfo?.channel_name?.channel_name,
      flag_name: primaryInfo?.user_primary_flags?.flag_name,
      flag_color: primaryInfo?.user_primary_flags?.color,
      flags: flagDetails,
      passportNumber:
        moment(passportNumber?.[0]?.date_of_expiry).format("YYYY-MM-DD") > moment().format("YYYY-MM-DD")
          ? passportNumber?.[0]?.passport_number
          : "N/A",
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
    const userId = req.userDecodeId;
    const { role_id } = req;

    const policeDocs = [];

    if (role_id != process.env.IT_TEAM_ID && role_id != process.env.CRE_TL_ID) {
      const updatedTask = await updateTaskDesc(primaryInfo, basicInfo, student_id, userId, role_id);

      if (!updatedTask) {
        return res.status(500).json({
          status: false,
          message: "Error Updating Task",
        });
      }
    }
    // Fetch existing data from the database
    const existingPrimaryData = await db.userPrimaryInfo.findByPk(student_id);
    const existingBasicData = await db.userBasicInfo.findOne({
      where: { user_id: Number(student_id) },
    });

    // Loop through the documents received from the frontend
    req.body.police_clearance_docs?.forEach(async (doc, index) => {
      let certificatePath;
      const certificateFile = req.files.find((file) => file.fieldname === `police_clearance_docs[${index}][certificate]`);

      // Check if there's a new file for this document
      if (certificateFile) {
        certificatePath = certificateFile.filename;

        // Check if there was a previous file saved and delete it
        const previousCertificatePath =
          existingBasicData && existingBasicData.police_clearance_docs
            ? existingBasicData.police_clearance_docs[index]?.certificate
            : null;

        if (previousCertificatePath) {
          await deleteFile("policeClearenceDocuments", previousCertificatePath);
        }
      } else {
        // No new file, get the existing path from the body
        certificatePath = req.body.police_clearance_docs[index].certificate_path;
      }

      policeDocs.push({
        id: Number(doc.id),
        certificate: certificatePath,
        country_name: req.body.police_clearance_docs[index].country_name,
      });
    });

    const parsedPrimaryInfo = {
      ...primaryInfo,
      id: parseInt(primaryInfo.id, 10), // Convert ID to an integer
      office_type: parseInt(primaryInfo.office_type, 10), // Convert office_type to an integer
      branch_id: primaryInfo.branch_id !== "null" ? parseInt(primaryInfo.branch_id, 10) : null, // Convert branch_id or set to null
      franchise_id: primaryInfo.franchise_id !== "null" ? parseInt(primaryInfo.franchise_id, 10) : null, // Convert franchise_id or set to null
      region_id: primaryInfo.region_id !== "null" ? parseInt(primaryInfo.region_id, 10) : null, // Convert region_id or set to null
    };

    const parsedBasicInfo = {
      passport_no: basicInfo.passport_no != "null" ? basicInfo.passport_no : null,
      dob: basicInfo.dob !== "null" ? new Date(basicInfo.dob) : null, // Convert to Date or null
      gender: basicInfo.gender, // Assuming gender is already correct
      marital_status: basicInfo.marital_status !== "null" ? parseInt(basicInfo.marital_status, 10) : null, // Convert to integer or null
      nationality: basicInfo.nationality,
      secondary_number: basicInfo.secondary_number,
      state: basicInfo.state,
      country: basicInfo.country,
      address: basicInfo.address,
      emergency_contact_name: basicInfo.emergency_contact_name,
      emergency_contact_relationship: basicInfo.emergency_contact_relationship,
      emergency_contact_phone: basicInfo.emergency_contact_phone,
      concern_on_medical_condition: basicInfo.concern_on_medical_condition === "true", // Convert string to boolean
      concern_on_medical_condition_details: basicInfo.concern_on_medical_condition_details,
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

    // Fetch basic information for the student
    const studyPreferenceInfo = await db.userStudyPreference.findOne({
      where: { user_id: studentId },
    });

    // Extract data values, or use default empty object if no data
    const studyPreferenceInfoData = studyPreferenceInfo ? studyPreferenceInfo.dataValues : {};

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

// const getLeastAssignedUsers = async (countryId) => {
//   const roleId = process.env.COUNSELLOR_ROLE_ID;
//   try {
//     // Use raw SQL to execute the query
//     const [results] = await db.sequelize.query(
//       `
//       WITH user_assignments AS (
//         SELECT
//           "admin_users"."id" AS "user_id",
//           COUNT("user_counselors"."counselor_id") AS "assignment_count"
//         FROM "admin_users"
//         LEFT JOIN "user_counselors"
//           ON "admin_users"."id" = "user_counselors"."counselor_id"
//         WHERE "admin_users"."role_id" = :roleId
//           AND "admin_users"."country_id" = :countryId
//         GROUP BY "admin_users"."id"
//       )
//       SELECT "user_id"
//       FROM user_assignments
//       ORDER BY "assignment_count" ASC, "user_id" ASC
//       LIMIT 1;
//     `,
//       {
//         replacements: { roleId, countryId },
//         type: db.Sequelize.QueryTypes.SELECT,
//       }
//     );

//     console.log("results ===>", results);

//     // Check if results is defined and not null
//     if (!results || Object.keys(results).length === 0) {
//       return {
//         leastAssignedUserId: null,
//       };
//     }

//     // Extract user_id if results has user_id
//     const leastAssignedUserId = results.user_id;

//     // If user_id is undefined, return an error response
//     if (leastAssignedUserId === undefined) {
//       return {
//         leastAssignedUserId: null,
//       };
//     }

//     return {
//       leastAssignedUserId,
//     };
//   } catch (error) {
//     console.error(`Error finding least assigned users: ${error}`);
//     return {
//       leastAssignedUserId: null,
//     };
//   }
// };

const getLeastAssignedUsers = async (countryId) => {
  const roleId = process.env.COUNSELLOR_ROLE_ID;
  const country_manager_id = process.env.COUNTRY_MANAGER_ID;

  try {
    const [results] = await db.sequelize.query(
      `
      WITH user_assignments AS (
        SELECT 
          "admin_users"."id" AS "user_id", 
          COUNT("user_counselors"."counselor_id") AS "assignment_count"
        FROM "admin_users"
        -- Join the admin_user_countries table to filter users by country
        INNER JOIN "admin_user_countries" 
          ON "admin_users"."id" = "admin_user_countries"."admin_user_id"
        LEFT JOIN "user_counselors" 
          ON "admin_users"."id" = "user_counselors"."counselor_id"
        WHERE "admin_users"."role_id" = :roleId OR "admin_users"."role_id" = :country_manager_id
          AND "admin_user_countries"."country_id" = :countryId
        GROUP BY "admin_users"."id"
      )
      SELECT "user_id" AS "least_assigned_user_id"
      FROM user_assignments
      ORDER BY "assignment_count" ASC, "user_id" ASC
      LIMIT 1;
      `,
      {
        replacements: { roleId, countryId, country_manager_id },
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    // Extract least assigned user ID
    const leastAssignedUserId = results?.least_assigned_user_id || null;

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

const updateStatus = async (studentId, countryId) => {
  const date = new Date();
  const [updatedStatus] = await db.userContries.update(
    {
      status_id: process.env.FOLLOWUP_ID,
      followup_date: date,
    },
    {
      where: { user_primary_info_id: studentId, country_id: countryId },
    }
  );

  return updatedStatus != 0;
};
