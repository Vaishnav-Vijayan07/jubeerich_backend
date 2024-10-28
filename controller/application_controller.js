const db = require("../models");
const sequelize = db.sequelize;

exports.assignApplication = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { application_id, user_id } = req.body;

        const existApplication = await db.application.findByPk(application_id)

        if (!existApplication) {
            throw new Error("Application not found");
        }

        const [assignUser] = await db.application.update(
            { assigned_user: user_id },
            { where: { id: application_id } }
        )

        console.log('assignUser',assignUser);

        if(assignUser == 0) throw new Error("User not assigned");

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

exports.getAssignApplicationByUser = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { userDecodeId } = req;

        const existApplication = await db.application.findByPk(application_id)

        if (!existApplication) {
            throw new Error("Application not found");
        }

        const [assignUser] = await db.application.update(
            { assigned_user: user_id },
            { where: { id: application_id } }
        )

        console.log('assignUser',assignUser);

        if(assignUser == 0) throw new Error("User not assigned");

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