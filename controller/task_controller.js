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


// exports.finishTask = async (req, res) => {
//   try {
//     const { isCompleted, id } = req.body;
//     const task = await db.tasks.findByPk(id);

//     if (!task) {
//       return res.status(404).json({
//         status: false,
//         message: "Task not found.",
//       });
//     }

//     const studentId = task.studentId;
//     const student = await db.userPrimaryInfo.findByPk(studentId);
//     const preferred_country = student.preferred_country;

//     let leastAssignedUser;

//     try {
//       leastAssignedUser = await getLeastAssignedUser(preferred_country);
//     } catch (error) {
//       console.error(`Error calling getLeastAssignedUser: ${error}`);
//       return res.status(500).json({
//         status: false,
//         message: "Internal server error",
//       });
//     }

//     console.log("Least assigned user:", leastAssignedUser);

//     // Update the userPrimaryInfo with the least assigned user
//     if (leastAssignedUser) {
//       await db.userPrimaryInfo.update(
//         { counsiler_id: leastAssignedUser },
//         { where: { id: studentId } }
//       );

//       if (leastAssignedUser && isCompleted) {
//         const dueDate = new Date();
//         dueDate.setDate(dueDate.getDate() + 1);

//         const country = await db.country.findByPk(preferred_country);
//         // Create a task for the new lead
//         const task = await db.tasks.create(
//           {
//             studentId: student.id,
//             userId: leastAssignedUser,
//             title: `${student.full_name} - ${country.country_name} - ${student.phone}`,
//             dueDate: dueDate,
//             updatedBy: req.userDecodeId,
//           }
//         );
//       }

//     }

//     // Update the task
//     task.isCompleted = isCompleted;
//     await task.save();

//     // Send success response
//     res.status(200).json({
//       status: true,
//       message: "Task Assigned to Counsellor.",
//       task,
//       leastAssignedUser,
//     });

//   } catch (error) {
//     console.error(`Error finishing task: ${error}`);
//     res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };

// exports.finishTask = async (req, res) => {
//   try {
//     const { isCompleted, id } = req.body;
//     const task = await db.tasks.findByPk(id);

//     if (!task) {
//       return res.status(404).json({
//         status: false,
//         message: "Task not found.",
//       });
//     }

//     const studentId = task.studentId;
//     const student = await db.userPrimaryInfo.findByPk(studentId);

//     if (!student) {
//       return res.status(404).json({
//         status: false,
//         message: "Student not found.",
//       });
//     }

//     // Fetch preferred countries from the join table
//     const preferredCountries = await db.userContries.findAll({
//       where: { user_primary_info_id: studentId },
//       attributes: ['country_id'],
//     });

//     const countryIds = preferredCountries.map(entry => entry.country_id);

//     // Fetch least assigned users for each country
//     let leastAssignedUsers = [];
//     for (const countryId of countryIds) {

//       const users = await getLeastAssignedUsers(countryId);
//       if(users?.leastAssignedUserId){
//         leastAssignedUsers = leastAssignedUsers.concat(users.leastAssignedUserId);
//       }
//       console.log("users ==========>", users.leastAssignedUserId);
//     }


//     if (leastAssignedUsers.length > 0) {
//       // Remove existing counselors for the student
//       await db.userCounselors.destroy({
//         where: { user_id: studentId },
//       });

//       // Add new counselors
//       const userCounselorsData = leastAssignedUsers.map(userId => ({
//         user_id: studentId,
//         counselor_id: userId,
//       }));

//       await db.userCounselors.bulkCreate(userCounselorsData);

//       if (isCompleted) {
//         const dueDate = new Date();
//         dueDate.setDate(dueDate.getDate() + 1);

//         let countryName = "Unknown";
//         if (countryIds.length > 0) {
//           const country = await db.country.findByPk(countryIds[0]);
//           if (country) {
//             countryName = country.country_name;
//           }
//         }

//         // Create tasks for each least assigned user
//         for (const userId of leastAssignedUsers) {
//           await db.tasks.create({
//             studentId: student.id,
//             userId: userId,
//             title: `${student.full_name} - ${countryName} - ${student.phone}`,
//             dueDate: dueDate,
//             updatedBy: req.userDecodeId,
//           });
//         }
//       }
//     }

//     // Update the original task as completed
//     task.isCompleted = isCompleted;
//     await task.save();

//     // Send success response
//     return res.status(200).json({
//       status: true,
//       message: "Task successfully updated and assigned.",
//       task,
//       leastAssignedUsers,
//     });

//   } catch (error) {
//     console.error(`Error finishing task: ${error}`);
//     return res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };


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
    const preferredCountries = await db.userCountries.findAll({
      where: { user_primary_info_id: studentId },
      attributes: ['country_id'],
    });

    const countryIds = preferredCountries.map(entry => entry.country_id);

    // Fetch country names
    const countries = await db.country.findAll({
      where: { id: countryIds },
      attributes: ['country_name'],
    });

    const countryNames = countries.map(country => country.country_name);

    // Fetch least assigned users for each country
    let leastAssignedUsers = [];
    for (const countryId of countryIds) {
      const user = await getLeastAssignedUsers(countryId);
      if (user?.user_id) {
        leastAssignedUsers.push(user.user_id);
      }
      console.log("users ==========>", user.user_id);
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

        // Create tasks for each least assigned user
        for (const userId of leastAssignedUsers) {
          await db.tasks.create({
            studentId: student.id,
            userId: userId,
            title: `${student.full_name} - ${countryNames.join(', ')} - ${student.phone}`,
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
      countryNames, // Include country names in the response
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
        "status_id"
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
      where: { user_id: studentId },
    });

    // Extract data values, or use default empty object if no data
    const acadmicInfoData = academicInfo ? academicInfo.dataValues : {};

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

const getLeastAssignedUser = async (country_id) => {
  try {
    const result = await db.adminUsers.findOne({
      attributes: [
        ["id", "user_id"],
        "username",
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM "user_primary_info"
            WHERE "user_primary_info"."counsiler_id" = "admin_user"."id"
          )`),
          "assignment_count",
        ],
      ],
      where: {
        role_id: process.env.COUNSELLOR_ROLE_ID,
        country_id: country_id
        // status: true,
      },
      order: [[Sequelize.literal("assignment_count"), "ASC"]],
    });

    console.log("result===>", result);

    if (result?.dataValues) {
      const leastAssignedUser = result.dataValues.user_id;

      console.log("User with the least assignments:", leastAssignedUser);
      return leastAssignedUser;
    } else {
      console.log('No matching users found or no assignments exist for the specified country.');
      return null;
    }
  } catch (error) {
    console.error(`Error finding least assigned user: ${error}`);
    throw new Error("Internal server error");
  }
};

// const getLeastAssignedUsers = async (countryIds) => {
//   try {
//     const result = await db.adminUsers.findAll({
//       attributes: [
//         ["id", "user_id"],
//         "username",
//         [
//           Sequelize.literal(`(
//             SELECT COUNT(*)
//             FROM "user_primary_info"
//             WHERE "user_primary_info"."counsiler_id" = "admin_users"."id"
//           )`),
//           "assignment_count",
//         ],
//       ],
//       where: {
//         role_id: process.env.COUNSELLOR_ROLE_ID,
//         country_id: countryIds,
//       },
//       order: [[Sequelize.literal("assignment_count"), "ASC"]],
//     });

//     console.log("result===>", result);

//     const leastAssignedUsers = result.map(user => user.user_id);

//     if (leastAssignedUsers.length > 0) {
//       console.log("Users with the least assignments:", leastAssignedUsers);
//       return leastAssignedUsers;
//     } else {
//       console.log('No matching users found or no assignments exist for the specified countries.');
//       return [];
//     }
//   } catch (error) {
//     console.error(`Error finding least assigned users: ${error}`);
//     throw new Error("Internal server error");
//   }
// };


const getLeastAssignedUsers = async (countryId) => {
  const roleId = 7;
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




