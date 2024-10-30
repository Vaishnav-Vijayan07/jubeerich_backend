const db = require("../models");
const sequelize = db.sequelize;
const { Sequelize } = require("sequelize");

exports.assignApplication = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { application_ids, user_id } = req.body;

    // Find the admin user to whom applications will be assigned
    const adminUser = await db.adminUsers.findByPk(user_id, { transaction });
    if (!adminUser) {
      throw new Error("Admin user not found");
    }

    // Retrieve all applications by IDs
    const applications = await db.application.findAll({
      where: { id: application_ids },
      transaction,
    });

    if (applications.length !== application_ids.length) {
      throw new Error("One or more applications not found");
    }

    // Use the magic method to assign multiple applications
    await adminUser.addAssigned_applications(applications, { transaction });

    // Commit the transaction
    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "Applications successfully assigned to the members",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.autoAssignApplication = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { application_ids } = req.body;

    const leastAssignedUser = await getLeastAssignedApplicationMember();
    console.log("leastAssignedUser", leastAssignedUser);

    const { user_id } = leastAssignedUser;

    const adminUser = await db.adminUsers.findByPk(user_id, { transaction });
    if (!adminUser) {
      throw new Error("Admin user not found");
    }

    // Retrieve all applications by IDs
    const applications = await db.application.findAll({
      where: { id: application_ids },
      transaction,
    });

    if (applications.length !== application_ids.length) {
      throw new Error("One or more applications not found");
    }

    // Use the magic method to assign multiple applications
    await adminUser.addAssigned_applications(applications, { transaction });

    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "Application Assigned to Team Member",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

const getLeastAssignedApplicationMember = async () => {
  try {
    const [leastAssignedMember] = await db.adminUsers.findAll({
      attributes: [
        ["id", "user_id"],
        "username",
        [
          Sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM "application_details"
                        WHERE "application_details"."assigned_user" = "admin_user"."id"
                    )`),
          "assignment_count",
        ],
      ],
      where: {
        [Sequelize.Op.or]: [{ role_id: process.env.APPLICATION_TEAM_ID }, { role_id: process.env.APPLICATION_MANAGER_ID }],
      },
      order: [
        [
          Sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM "application_details"
                        WHERE "application_details"."assigned_user" = "admin_user"."id"
                    )`),
          "ASC",
        ],
      ],
      limit: 1,
    });

    if (!leastAssignedMember) return null;

    return {
      user_id: leastAssignedMember.dataValues.user_id,
      assignment_count: parseInt(leastAssignedMember.dataValues.assignment_count, 10),
    };
  } catch (error) {
    console.error("Error fetching least assigned member:", error.message || error);
    throw error;
  }
};
