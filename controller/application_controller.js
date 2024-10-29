const db = require("../models");
const sequelize = db.sequelize;
const { Sequelize } = require("sequelize");

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

        console.log('assignUser', assignUser);

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

exports.autoAssignApplication = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { application_id } = req.body;

        const leastAssignedUser = await getLeastAssignedApplicationMember();
        console.log('leastAssignedUser',leastAssignedUser);
        

        if (!leastAssignedUser) {
            throw new Error("No eligible team member found");
        }

        const [assignUser] = await db.application.update(
            { assigned_user: leastAssignedUser?.user_id },
            { where: { id: application_id }, transaction }
        );

        if (assignUser === 0) throw new Error("User not assigned");

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
                [Sequelize.Op.or]: [
                    { role_id: process.env.APPLICATION_TEAM_ID },
                    { role_id: process.env.APPLICATION_MANAGER_ID },
                ],
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
