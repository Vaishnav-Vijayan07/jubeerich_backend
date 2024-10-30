const db = require("../models");
const sequelize = db.sequelize;
const { Sequelize } = require("sequelize");

exports.getApplicationById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const existApplication = await db.application.findByPk(id);

        if (!existApplication) {
            throw new Error("Application not found");
        }

        const [assigned_user, studyPreferDetails] = await Promise.all([
            existApplication.getApplication({ attributes: ["id", "name"] }),
            existApplication.getStudyPreferenceDetails(
                {
                    attributes: ["id", "intakeYear", "intakeMonth", "application_status", "streamId"],
                    include: [
                        {
                            model: db.course,
                            as: 'preferred_courses',
                            attributes: ["id", "course_name"],
                            include: [
                                {
                                    model: db.campus,
                                    through: "campus_course",
                                    as: "campuses",
                                    attributes: ["id","campus_name"],
                                    through: {
                                        attributes: ["course_link"]
                                    }
                                },
                            ],
                        },
                        {
                            model: db.stream,
                            as: "preferred_stream",
                            attributes: ["id", "stream_name"]
                        },
                        {
                            model: db.campus,
                            as: 'preferred_campus',
                            attributes: ["id", "campus_name"]
                        },
                        {
                            model: db.university,
                            as: 'preferred_university',
                            attributes: ["id", "university_name"]
                        },
                        {
                            model: db.studyPreference,
                            as: 'studyPreference',
                            include: [
                                {
                                    model: db.country,
                                    as: "country",
                                    attributes: ["id", "country_name"]
                                },
                                {
                                    model: db.userPrimaryInfo,
                                    as: "userPrimaryInfo",
                                    attributes: ["id", "full_name", "office_type", "source_id", "lead_received_date", "assign_type"],
                                    inlcude: [
                                        {
                                            model: db.leadSource,
                                            require: true,
                                            as: "source_name"
                                        },
                                        {
                                            model: db.officeType,
                                            require: true,
                                            as: "office_type"
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ),
        ])

        return res.status(200).json({
            status: true,
            data: {
                existApplication: existApplication,
                studyPreferDetails: studyPreferDetails,
                assigned_user: assigned_user
            },
            message: "Application Assigned to Team Member",
        });

    } catch (error) {
        console.error(`Error: ${error.message}`);
        return res.status(500).json({
            status: false,
            message: error.message || "Internal server error",
        });
    }
};

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
