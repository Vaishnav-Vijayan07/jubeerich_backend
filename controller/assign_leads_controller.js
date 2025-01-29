const db = require("../models");
const UserPrimaryInfo = db.userPrimaryInfo;
const sequelize = db.sequelize;
const { Sequelize } = require("sequelize");
const { addLeadHistory, getRegionDataForHistory } = require("../utils/academic_query_helper");
const { createTaskDesc } = require("../utils/task_description");

exports.assignCres = async (req, res) => {
  const { cre_id, user_ids } = req.body;
  const userId = req.userDecodeId;

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    // Validate cre_id
    if (!cre_id) {
      return res.status(400).json({
        status: false,
        message: "cre_id is required",
      });
    }

    // Validate user_ids
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "user_ids must be a non-empty array",
      });
    }

    // Validate each user_id
    for (const user_id of user_ids) {
      if (typeof user_id !== "number") {
        return res.status(400).json({
          status: false,
          message: "Each user_id must be a number",
        });
      }
    }

    const { "access_role.role_name": role_name } = await db.adminUsers.findByPk(cre_id, {
      include: [
        {
          model: db.accessRoles,
          attributes: ["role_name"],
        },
      ],
      attributes: [],
      raw: true, // Ensure it returns plain data, not a Sequelize instance
    });

    console.log(cre_id, role_name);

    // Process each user_id
    await Promise.all(
      user_ids.map(async (user_id) => {
        // Step 1: Fetch user info with associated countries
        const userInfo = await db.userPrimaryInfo.findOne({
          where: { id: user_id },
          include: {
            model: db.country,
            as: "preferredCountries",
          },
          transaction,
        });

        if (!userInfo) {
          throw new Error(`UserPrimaryInfo with ID ${user_id} not found`);
        }

        // Handle multiple preferred countries
        // const countries = userInfo.preferredCountries.map((c) => c.country_name).join(", ") || "Unknown Country";
        const countries = userInfo.preferredCountries.map((c) => c.country_code).join(", ") || "Unknown Country";

        let formattedDesc = await createTaskDesc(userInfo, user_id);

        if (!formattedDesc) {
          return res.status(500).json({
            status: false,
            message: "Description error",
          });
        }

        // Step 2: Check if the task with studentId exists
        const existingTask = await db.tasks.findOne({
          where: { studentId: user_id },
        });

        // Step 3: Create or update task
        if (existingTask) {
          // Update existing task
          await existingTask.update(
            {
              userId: cre_id,
              title: `${userInfo.full_name} - ${countries}`,
              // description: `${userInfo.full_name} from ${userInfo?.city}, has applied for admission in ${countries}`,
              description: formattedDesc,
              dueDate: new Date(),
              updatedBy: userId,
              assigned_country: userInfo.preferredCountries?.[0]?.id,
            },
            { transaction }
          );

          // add the details to lead history
          await addLeadHistory(user_id, `Task assigned to ${role_name}`, userId, null, transaction);
        } else {
          // Create new task
          await db.tasks.create(
            {
              studentId: user_id,
              userId: cre_id,
              title: `${userInfo.full_name} - ${countries}`,
              // description: `${userInfo.full_name} from ${userInfo?.city}, has applied for admission in ${countries}`,
              description: formattedDesc,
              dueDate: new Date(),
              updatedBy: userId,
              assigned_country: userInfo.preferredCountries?.[0]?.id,
            },
            { transaction }
          );

          await addLeadHistory(user_id, `Task assigned to ${role_name}`, userId, null, transaction);
        }

        // Update assigned_cre for the user
        await db.userPrimaryInfo.update(
          {
            assigned_cre: cre_id,
            updated_by: userId,
            assign_type: "direct_assign",
          },
          { where: { id: user_id }, transaction }
        );
      })
    );

    // Commit transaction
    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "CRE assigned successfully",
    });
  } catch (error) {
    // Rollback transaction
    await transaction.rollback();
    console.error(`Error assigning CRE: ${error}`);
    return res.status(500).json({
      status: false,
      message: error?.message || "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.assignCounselorTL = async (req, res) => {
  const { branch_id, user_ids } = req.body;

  const userId = req.userDecodeId;

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    // Validate branch_id
    if (!branch_id) {
      return res.status(400).json({
        status: false,
        message: "branch_id is required",
      });
    }

    // Validate user_ids
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "user_ids must be a non-empty array",
      });
    }

    // Validate each user_id
    for (const user_id of user_ids) {
      if (typeof user_id !== "number") {
        return res.status(400).json({
          status: false,
          message: "Each user_id must be a number",
        });
      }
    }

    // Find the counselor based on the branch_id
    const counsellor = await db.adminUsers.findOne({
      where: {
        branch_id,
        role_id: process.env.COUNSELLOR_TL_ID,
        status: "true",
      },
      transaction,
    });

    // Validate if a counselor is found
    if (!counsellor) {
      return res.status(400).json({
        status: false,
        message: "No active counselor tl found for the provided branch",
      });
    }

    // Extract the counselor's ID
    const counsellor_id = counsellor.id;

    // Process each user_id
    await Promise.all(
      user_ids.map(async (user_id) => {
        // Step 1: Fetch user info with associated countries
        const userInfo = await db.userPrimaryInfo.findOne({
          where: { id: user_id },
          transaction,
        });

        if (!userInfo) {
          throw new Error(`UserPrimaryInfo with ID ${user_id} not found`);
        }

        // Update assigned_counsellor for the user
        await db.userPrimaryInfo.update(
          {
            assigned_counsellor_tl: counsellor_id,
            updated_by: userId,
            branch_id: branch_id,
            assign_type: "direct_assign",
          },
          { where: { id: user_id }, transaction }
        );
        const { region_name } = await getRegionDataForHistory(branch_id);
        await addLeadHistory(user_id, `Lead assigned to Branch counsellor TL - ${region_name} `, userId, null, transaction);
      })
    );

    // Commit transaction
    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "Counselor tl assigned successfully",
    });
  } catch (error) {
    // Rollback transaction
    await transaction.rollback();
    console.error(`Error assigning counselor tl: ${error}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.assignBranchCounselors = async (req, res) => {
  const { counselor_id, user_ids } = req.body;
  const userId = req.userDecodeId;

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    // Validate counselor_id
    if (!counselor_id) {
      return res.status(400).json({
        status: false,
        message: "counselor_id is required",
      });
    }

    // Validate user_ids
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "user_ids must be a non-empty array",
      });
    }

    // Validate each user_id
    for (const user_id of user_ids) {
      if (typeof user_id !== "number") {
        return res.status(400).json({
          status: false,
          message: "Each user_id must be a number",
        });
      }
    }

    const { branch_id } = await db.adminUsers.findOne({
      where: { id: userId },
      transaction,
    });

    // Process each user_id
    await Promise.all(
      user_ids.map(async (user_id) => {
        // Step 1: Fetch user info with associated countries
        const userInfo = await db.userPrimaryInfo.findOne({
          where: { id: user_id },
          include: {
            model: db.country,
            as: "preferredCountries",
          },
          transaction,
        });

        if (!userInfo) {
          throw new Error(`UserPrimaryInfo with ID ${user_id} not found`);
        }

        // Handle multiple preferred countries
        // const countries = userInfo.preferredCountries.map((c) => c.country_name).join(", ") || "Unknown Country";
        const countries = userInfo.preferredCountries.map((c) => c.country_code).join(", ") || "Unknown Country";

        let formattedDesc = await createTaskDesc(userInfo, user_id);

        if (!formattedDesc) {
          return res.status(500).json({
            status: false,
            message: "Description error",
          });
        }

        // Step 2: Check if the task with studentId exists
        const existingTask = await db.tasks.findOne({
          where: { studentId: user_id },
          transaction,
        });

        // Step 3: Create or update task
        if (existingTask) {
          // Update existing task
          await existingTask.update(
            {
              userId: counselor_id,
              title: `${userInfo.full_name} - ${countries}`,
              dueDate: new Date(),
              updatedBy: userId,
              assigned_country: userInfo?.preferredCountries?.[0]?.id,
            },
            { transaction }
          );
        } else {
          // Create new task
          await db.tasks.create(
            {
              studentId: user_id,
              userId: counselor_id,
              title: `${userInfo.full_name} - ${countries}`,
              description: formattedDesc,
              dueDate: new Date(),
              updatedBy: userId,
              assigned_country: userInfo?.preferredCountries?.[0]?.id,
            },
            { transaction }
          );
        }

        // Update assigned_cre for the user
        await db.userPrimaryInfo.update(
          {
            assigned_branch_counselor: counselor_id,
            counsiler_id: counselor_id,
            updated_by: userId,
            assign_type: "direct_assign",
          },
          { where: { id: user_id }, transaction }
        );
      })
    );

    const { region_name } = await getRegionDataForHistory(branch_id);

    const historyPromisesLeadAssign = user_ids.map((user_id) =>
      addLeadHistory(user_id, `Lead assigned to Branch counsellor - ${region_name} `, userId, null, transaction)
    );

    const historyPromisesTaskAssign = user_ids.map((user_id) =>
      addLeadHistory(user_id, `Task assigned to Branch counsellor  - ${region_name} `, userId, null, transaction)
    );

    const combinedPromises = [...historyPromisesLeadAssign, ...historyPromisesTaskAssign];

    await Promise.all(combinedPromises);

    // Commit transaction
    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "Counselor assigned successfully",
    });
  } catch (error) {
    // Rollback transaction
    await transaction.rollback();
    console.error(`Error assigning counselor: ${error}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.autoAssignBranchCounselors = async (req, res) => {
  const { leads_ids } = req.body;
  const userId = req.userDecodeId;

  // Validate leads_ids
  if (!Array.isArray(leads_ids) || leads_ids.length === 0) {
    return res.status(400).json({
      status: false,
      message: "leads_ids must be a non-empty array",
    });
  }

  if (!leads_ids.every((id) => typeof id === "number")) {
    return res.status(400).json({
      status: false,
      message: "Each user_id must be a number",
    });
  }

  // Start a new transaction
  const transaction = await sequelize.transaction();

  try {
    // Fetch all CREs with their assignment counts
    const leastCounselor = await getLeastAssignedCounselors();

    if (leastCounselor.length === 0) {
      throw new Error("No available Counselors to assign leads");
    }

    // Prepare the bulk update data
    const updatePromises = leads_ids.map(async (id, index) => {
      const userInfo = await UserPrimaryInfo.findOne({
        where: id,
        include: {
          model: db.country,
          as: "preferredCountries",
        },
      });

      let formattedDesc = await createTaskDesc(userInfo, id);

      if (!formattedDesc) {
        return res.status(500).json({
          status: false,
          message: "Description error",
        });
      }

      // const countries = userInfo.preferredCountries.map((c) => c.country_name).join(", ") || "Unknown Country";
      const countries = userInfo.preferredCountries.map((c) => c.country_code).join(", ") || "Unknown Country";
      const currentCounselor = leastCounselor[index % leastCounselor.length].user_id;

      const dueDate = new Date();

      const task = await db.tasks.upsert(
        {
          studentId: id,
          userId: currentCounselor,
          title: `${userInfo.full_name} - ${countries}`,
          // description: `${userInfo.full_name} from ${userInfo?.city}, has applied for admission in ${countries}`,
          description: formattedDesc,
          dueDate: dueDate,
          updatedBy: userId,
          assigned_country: userInfo?.preferredCountries?.[0]?.id,
        },
        { transaction }
      );
      return UserPrimaryInfo.update(
        {
          assigned_branch_counselor: currentCounselor,
          updated_by: userId,
          assign_type: "auto_assign",
          assigned_country: userInfo?.preferredCountries?.[0]?.id,
        },
        { where: { id }, transaction }
      );
    });

    // Perform bulk update
    await Promise.all(updatePromises);

    // Commit the transaction
    await transaction.commit();

    res.status(200).json({
      status: true,
      message: "Leads assigned successfully",
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    await transaction.rollback();
    console.error("Error in autoAssign:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.listBranches = async (req, res) => {
  const transaction = await sequelize.transaction();
  const userId = req.userDecodeId;
  try {
    const adminUser = await db.adminUsers.findOne({
      where: { id: userId },
      attributes: ["region_id"], // Fetch only the region_id field
      transaction,
    });

    // Check if the admin user exists
    if (!adminUser) {
      return res.status(404).json({
        status: false,
        message: "Admin user not found",
      });
    }

    // Extract the branch_id
    const { region_id } = adminUser;

    // Fetch the branch details using the branch_id
    const branch = await db.branches.findAll({
      where: { region_id },
      attributes: ["id", "branch_name"],
      transaction,
    });

    // Check if the branch exists
    if (!branch) {
      return res.status(404).json({
        status: false,
        message: "Branch not found for the given region",
      });
    }

    const modifiedBranches = branch.map((branch) => ({
      label: branch.branch_name,
      value: branch.id,
      region_id: branch.region_id,
    }));

    // Commit transaction
    await transaction.commit();

    // Respond with the branch details
    return res.status(200).json({
      status: true,
      message: "Branch details retrieved successfully",
      data: modifiedBranches,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("Error in finding branches:", err);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.autoAssign = async (req, res) => {
  const { leads_ids } = req.body;
  const userId = req.userDecodeId;

  // Validate leads_ids
  if (!Array.isArray(leads_ids) || leads_ids.length === 0) {
    return res.status(400).json({
      status: false,
      message: "leads_ids must be a non-empty array",
    });
  }

  if (!leads_ids.every((id) => typeof id === "number")) {
    return res.status(400).json({
      status: false,
      message: "Each user_id must be a number",
    });
  }

  // Start a new transaction
  const transaction = await sequelize.transaction();

  try {
    // Fetch all CREs with their assignment counts
    const leastCre = await getLeastAssignedCre();

    if (leastCre.length === 0) {
      throw new Error("No available CREs to assign leads");
    }

    // Prepare the bulk update data
    const updatePromises = leads_ids.map(async (id, index) => {
      const userInfo = await UserPrimaryInfo.findOne({
        where: id,
        include: {
          model: db.country,
          as: "preferredCountries",
        },
      });

      let formattedDesc = await createTaskDesc(userInfo, id);

      if (!formattedDesc) {
        return res.status(500).json({
          status: false,
          message: "Description error",
        });
      }

      // const countries = userInfo.preferredCountries.map((c) => c.country_name).join(", ") || "Unknown Country";
      const countries = userInfo.preferredCountries.map((c) => c.country_code).join(", ") || "Unknown Country";

      const currentCre = leastCre[index % leastCre.length].user_id;

      const dueDate = new Date();

      const task = await db.tasks.upsert(
        {
          studentId: id,
          userId: currentCre,
          title: `${userInfo.full_name} - ${countries}`,
          // description: `${userInfo.full_name} from ${userInfo?.city}, has applied for admission in ${countries}`,
          description: formattedDesc,
          dueDate: dueDate,
          updatedBy: userId,
          assigned_country: userInfo.preferredCountries?.[0]?.id,
        },
        { transaction }
      );
      return UserPrimaryInfo.update(
        {
          assigned_cre: currentCre,
          assign_type: "auto_assign",
          updated_by: userId,
          assigned_country: userInfo.preferredCountries?.[0]?.i,
        },
        { where: { id }, transaction }
      );
    });

    // Perform bulk update
    await Promise.all(updatePromises);

    // Commit the transaction
    await transaction.commit();

    res.status(200).json({
      status: true,
      message: "Leads assigned successfully",
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    await transaction.rollback();
    console.error("Error in autoAssign:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.autoAssignValidation = async (req, res) => {
  const { leads_ids } = req.body;
  const userId = req.userDecodeId;

  if (!Array.isArray(leads_ids) || leads_ids.length === 0) {
    return res.status(400).json({
      status: false,
      message: "leads_ids must be a non-empty array",
    });
  }

  if (!leads_ids.every((id) => typeof id === "number")) {
    return res.status(400).json({
      status: false,
      message: "Each user_id must be a number",
    });
  }

  try {
    let validatedData = [];

    const creList = await db.adminUsers.findAll({
      attributes:
        ["id", "name"],
      where: {
        [Sequelize.Op.or]: [{ role_id: process.env.CRE_ID }, { role_id: process.env.CRE_TL_ID }],
        status: true,
      },
    });

    let leastCre = await getLeastAssignedCre();

    if (leastCre.length == 0) {
      throw new Error("No available CREs to assign leads");
    }

    console.log("Initial leastCre:", leastCre);

    for (const id of leads_ids) {
      const userInfo = await UserPrimaryInfo.findOne({
        where: { id },
        include: {
          model: db.country,
          as: "preferredCountries",
        },
      });

      const countries = userInfo.preferredCountries.map((c) => c.country_code).join(", ") || "Unknown Country";

      let currentCre = leastCre[0].user_id;

      const dueDate = new Date();

      const taskData = {
        studentId: id,
        full_name: userInfo.full_name,
        email: userInfo.email,
        phone: userInfo.phone,
        city: userInfo.city,
        country: countries,
        assigned_cre: currentCre,
        assign_type: "auto_assign",
        lead_recieved_date: dueDate,
        updatedBy: userId,
      };

      validatedData.push(taskData);

      leastCre[0].assignment_count += 1;

      leastCre.sort((a, b) => a.assignment_count - b.assignment_count);
    }

    res.status(200).json({
      status: true,
      message: "Leads assigned successfully",
      assignedData: validatedData,
      creList: creList
    });

  } catch (error) {
    console.error("Error in autoAssign:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.autoAssignValidData = async (req, res) => {
  const { lead_data } = req.body;
  const userId = req.userDecodeId;

  if (!Array.isArray(lead_data) || lead_data.length === 0) {
    return res.status(400).json({
      status: false,
      message: "No Leads Found",
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const updatePromises = lead_data.map(async (data, index) => {
      const { studentId, assigned_cre } = data;

      const userInfo = await UserPrimaryInfo.findOne({
        where: studentId,
        include: {
          model: db.country,
          as: "preferredCountries",
        },
      });

      let formattedDesc = await createTaskDesc(userInfo, studentId);

      if (!formattedDesc) {
        return res.status(500).json({
          status: false,
          message: "Description error",
        });
      }

      const countries = userInfo.preferredCountries.map((c) => c.country_code).join(", ") || "Unknown Country";

      const dueDate = new Date();

      const task = await db.tasks.upsert(
        {
          studentId: studentId,
          userId: assigned_cre,
          title: `${userInfo.full_name} - ${countries}`,
          description: formattedDesc,
          dueDate: dueDate,
          updatedBy: userId,
          assigned_country: userInfo.preferredCountries?.[0]?.id,
        },
        { transaction }
      );
      return UserPrimaryInfo.update(
        {
          assigned_cre: assigned_cre,
          assign_type: "auto_assign",
          updated_by: userId,
        },
        { where: { id: studentId }, transaction }
      );
    });

    await Promise.all(updatePromises);

    await transaction.commit();

    res.status(200).json({
      status: true,
      message: "Leads assigned successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error in autoAssign:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

const getLeastAssignedCre = async () => {
  try {
    // Fetch all CREs with their current assignment counts
    const creList = await db.adminUsers.findAll({
      attributes: [
        ["id", "user_id"],
        "username",
        [
          Sequelize.literal(`(
              SELECT COUNT(*)
              FROM "user_primary_info"
              WHERE "user_primary_info"."assigned_cre" = "admin_user"."id"
            )`),
          "assignment_count",
        ],
      ],
      where: {
        [Sequelize.Op.or]: [{ role_id: process.env.CRE_ID }, { role_id: process.env.CRE_TL_ID }],
        status: true,
      },
      order: [
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM "user_primary_info"
            WHERE "user_primary_info"."assigned_cre" = "admin_user"."id"
          )`),
          "ASC",
        ],
      ],
    });

    return creList.map((cre) => ({
      user_id: cre.dataValues.user_id,
      assignment_count: parseInt(cre.dataValues.assignment_count, 10),
    }));
  } catch (error) {
    console.error("Error fetching CREs with assignment counts:", error.message || error);
    throw error;
  }
};

// round robin method
// const getLeastAssignedCre = async () => {
//   try {
//     // Fetch all CREs with their current assignment counts
//     const creList = await db.adminUsers.findAll({
//       attributes: [
//         ["id", "user_id"],
//         "username",
//         [
//           Sequelize.literal(`(
//               SELECT COUNT(*)
//               FROM "user_primary_info"
//               WHERE "user_primary_info"."assigned_cre" = "admin_user"."id"
//             )`),
//           "assignment_count",
//         ],
//       ],
//       where: {
//         [Sequelize.Op.or]: [
//           { role_id: process.env.CRE_ID },
//           { role_id: process.env.CRE_TL_ID },
//         ],
//       },
//       order: [[Sequelize.literal("assignment_count"), "ASC"]],
//     });

//     return creList.map((cre) => ({
//       user_id: cre.dataValues.user_id,
//       assignment_count: parseInt(cre.dataValues.assignment_count, 10),
//     }));
//   } catch (error) {
//     console.error("Error fetching CREs with assignment counts:", error);
//     throw error;
//   }
// };

const getLeastAssignedCounselors = async () => {
  try {
    // Fetch all CREs with their current assignment counts
    const creList = await db.adminUsers.findAll({
      attributes: [
        ["id", "user_id"],
        "username",
        [
          Sequelize.literal(`(
              SELECT COUNT(*)
              FROM "user_primary_info"
              WHERE "user_primary_info"."assigned_branch_counselor" = "admin_user"."id"
            )`),
          "assignment_count",
        ],
      ],
      where: {
        [Sequelize.Op.or]: [{ role_id: process.env.BRANCH_COUNSELLOR_ID }],
        status: true,
      },
      order: [[Sequelize.literal("assignment_count"), "ASC"]], // Order by assignment count in ascending order
    });

    return creList.map((cre) => ({
      user_id: cre.dataValues.user_id,
      assignment_count: parseInt(cre.dataValues.assignment_count, 10),
    }));
  } catch (error) {
    console.error("Error fetching CREs with assignment counts:", error);
    throw error;
  }
};
