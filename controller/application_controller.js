const db = require("../models");
const sequelize = db.sequelize;

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
      message: "Applications successfully assigned to the admin user",
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

exports.getAssignApplicationByUser = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { userDecodeId } = req;

    const existApplication = await db.application.findByPk(application_id);

    if (!existApplication) {
      throw new Error("Application not found");
    }

    const [assignUser] = await db.application.update({ assigned_user: user_id }, { where: { id: application_id } });

    console.log("assignUser", assignUser);

    if (assignUser == 0) throw new Error("User not assigned");

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
