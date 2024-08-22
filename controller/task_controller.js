const { Sequelize } = require("sequelize");
const db = require("../models");

exports.getTasks = async (req, res) => {
  try {
    const userId = req.userDecodeId;
    const tasks = await db.tasks.findAll({
      where: { userId: userId },
    });

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
  try {
    const { isCompleted, id } = req.body;
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

    // Fetch preferred countries from the join table
    const preferredCountries = await db.userContries.findAll({
      where: { user_primary_info_id: studentId },
      attributes: ['country_id'],
    });

    const countryIds = preferredCountries.map(entry => entry.country_id);

    // Fetch least assigned users for each country
    let leastAssignedUsers = [];
    for (const countryId of countryIds) {

      const users = await getLeastAssignedUsers(countryId);
      if(users?.leastAssignedUserId){
        leastAssignedUsers = leastAssignedUsers.concat(users.leastAssignedUserId);
      }
      console.log("users ==========>", users.leastAssignedUserId);
    }


    if (leastAssignedUsers.length > 0) {
      // Remove existing counselors for the student
      await db.userCounselors.destroy({
        where: { user_id: studentId },
      });

      // Add new counselors
      const userCounselorsData = leastAssignedUsers.map(userId => ({
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
            attributes: ['country_name'],
          });
      
          if (countries) {
            countryName = countries.map(country => country.country_name).join(', ');
          }
        }

        // Create tasks for each least assigned user
        for (const userId of leastAssignedUsers) {
          await db.tasks.create({
            studentId: student.id,
            userId: userId,
            title: `${student.full_name} - ${countryName} - ${student.phone}`,
            dueDate: dueDate,
            updatedBy: req.userDecodeId,
          });
        }
      }
    }

    // Update the original task as completed
    task.isCompleted = isCompleted;
    await task.save();

    // Send success response
    return res.status(200).json({
      status: true,
      message: "Task successfully updated and assigned.",
      task,
      leastAssignedUsers,
    });

  } catch (error) {
    console.error(`Error finishing task: ${error}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.assignNewCountry = async (req, res) => {
  try {
    const { id, newCountryId } = req.body;
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

    if (newCountryId) {
      // Check if the new country is already assigned to the student
      const existingCountry = await db.userContries.findOne({
        where: {
          user_primary_info_id: studentId,
          country_id: newCountryId,
        },
      });

      if (existingCountry) {
        return res.status(400).json({
          status: false,
          message: "The country is already assigned to the student.",
        });
      }

      // Find the least assigned user for the new country
      const users = await getLeastAssignedUsers(newCountryId);
      if (users?.leastAssignedUserId) {
        const leastAssignedUserId = users.leastAssignedUserId;

        // Assign the new counselor to the student
        await db.userCounselors.create({
          user_id: studentId,
          counselor_id: leastAssignedUserId,
        });

        // Add the new country to the student's preferred countries
        await db.userContries.create({
          user_primary_info_id: studentId,
          country_id: newCountryId,
        });

        // Create a task for the least assigned user
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);

        const country = await db.country.findByPk(newCountryId, {
          attributes: ['country_name'],
        });

        const countryName = country ? country.country_name : "Unknown";

        await db.tasks.create({
          studentId: student.id,
          userId: leastAssignedUserId,
          title: `${student.full_name} - ${countryName} - ${student.phone}`,
          dueDate: dueDate,
          updatedBy: req.userDecodeId,
        });
      }
    }

    // Send success response
    return res.status(200).json({
      status: true,
      message: "Task successfully updated and assigned.",
      task,
    });

  } catch (error) {
    console.error(`Error finishing task: ${error}`);
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
        "lead_received_date"
      ],
      include: [
        {
          model: db.country,
          as: "preferredCountries",  // Adjusted alias to match Sequelize associations
          attributes: ["id", "country_name"],  // Only include ID and name
          through: {
            attributes: [], // Exclude attributes from the join table
          },
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
      ],
      nest: true,
    });

    // Extract data values or use default empty object if no data
    const basicInfoData = basicInfo ? basicInfo.dataValues : {};
    const primaryInfoData = primaryInfo ? primaryInfo.dataValues : {};

    // Combine primaryInfoData with filtered preferredCountries
    const combinedInfo = {
      ...primaryInfoData,
      country_ids: primaryInfo?.preferredCountries?.map(country => country.id) || [],
      country_names: primaryInfo?.preferredCountries?.map(country => country.country_name) || [],
      source_name: primaryInfo?.source_name?.source_name,
      channel_name: primaryInfo?.channel_name?.channel_name,
      ...basicInfoData,
    };

    console.log("Combined info:", combinedInfo);

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

exports.getStudentAcademicInfoById = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log("Fetching info for studentId:", studentId);

    // Fetch basic information for the student
    const academicInfo = await db.userAcademicInfo.findOne({
      where: { user_id: studentId }
    });
    console.log('academicInfo',academicInfo.dataValues);

      // const examInfo = await db.userPrimaryInfo.findAll({
      //   where: { id: studentId },
      //   include:[
      //     {
      //       model: db.userExams,
      //       as: "exams",
      //       attributes: ["exam_name","marks", "document"],
      //       required: false,
      //     },
      //   ]
      // });

      const examInfo = await db.userExams.findAll({ where: { student_id: studentId }});

      console.log('examInfo',examInfo.map(exam => exam.dataValues));
    
    // const acadmicInfoData = academicInfo ? academicInfo.dataValues : {};
    let acadmicInfoData;
    acadmicInfoData = academicInfo ? academicInfo.dataValues : {};

    if (examInfo && examInfo.length > 0) {
      acadmicInfoData = { 
        ...acadmicInfoData, 
        exam_details: examInfo.map((exam) => {
          return {
            exam_name: exam.dataValues.exam_name,
            marks: exam.dataValues.marks
          };
        }),
        exam_documents: examInfo.map((exam) => {
          return {
            exam_documents: exam.dataValues.document
          }
        })
      };
    }
    

    console.log('acadmicInfoData',acadmicInfoData);
    

    // Send the response with combined information
    res.status(200).json({
      status: true,
      message: "Student info retrieved successfully",
      data: acadmicInfoData,
    });
  } catch (error) {
    console.error(`Error fetching student info: ${error}`);
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

const getLeastAssignedUsers = async (countryId) => {
  const roleId = process.env.COUNSELLOR_ROLE_ID;
  try {
    // Use raw SQL to execute the query
    const [results] = await db.sequelize.query(`
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
    `, {
      replacements: { roleId, countryId },
      type: db.Sequelize.QueryTypes.SELECT
    });

    console.log("results ===>", results);

    // Check if results is defined and not null
    if (!results || Object.keys(results).length === 0) {
      return {
        leastAssignedUserId: null
      };
    }

    // Extract user_id if results has user_id
    const leastAssignedUserId = results.user_id;


    // If user_id is undefined, return an error response
    if (leastAssignedUserId === undefined) {
      return {
        leastAssignedUserId: null
      };
    }

    return {
      leastAssignedUserId
    };
  } catch (error) {
    console.error(`Error finding least assigned users: ${error}`);
    return {
      leastAssignedUserId: null
    };
  }
};
