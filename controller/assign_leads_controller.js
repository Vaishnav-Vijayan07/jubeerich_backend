const { validationResult, check } = require("express-validator");
const db = require("../models");
const { checkIfEntityExists } = require("../utils/helper");
const UserPrimaryInfo = db.userPrimaryInfo;
const Status = db.status;
const StatusAccessRole = db.statusAccessRoles;
const AccessRole = db.accessRoles;
const AdminUsers = db.adminUsers;
const sequelize = db.sequelize;
const { Op, Sequelize, where } = require("sequelize");

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

        // Process each user_id
        await Promise.all(
            user_ids.map(async (user_id) => {
                // Step 1: Fetch user info with associated countries
                const userInfo = await db.userPrimaryInfo.findOne({
                    where: { id: user_id },
                    include: {
                        model: db.country,
                        as: 'preferredCountries',
                    },
                    transaction
                });

                if (!userInfo) {
                    throw new Error(`UserPrimaryInfo with ID ${user_id} not found`);
                }

                // Handle multiple preferred countries
                const countries = userInfo.preferredCountries.map(c => c.country_name).join(', ') || 'Unknown Country';

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
                            userId: cre_id,
                            title: `${userInfo.full_name} - ${countries} - ${userInfo.phone}`,
                            dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
                            updatedBy: userId,
                        },
                        { transaction }
                    );
                } else {
                    // Create new task
                    await db.tasks.create(
                        {
                            studentId: user_id,
                            userId: cre_id,
                            title: `${userInfo.full_name} - ${countries} - ${userInfo.phone}`,
                            dueDate: new Date(new Date().setDate(new Date().getDate() + 1)),
                            updatedBy: userId,
                        },
                        { transaction }
                    );
                }

                // Update assigned_cre for the user
                await db.userPrimaryInfo.update(
                    { assigned_cre: cre_id, updated_by: userId },
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
            message: "Internal server error",
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
                where: id, include: {
                    model: db.country,
                    as: 'preferredCountries',
                },
            });
            const countries = userInfo.preferredCountries.map(c => c.country_name).join(', ') || 'Unknown Country';
            const currentCre = leastCre[index % leastCre.length].user_id;

            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 1);

            const task = await db.tasks.upsert(
                {
                    studentId: id,
                    userId: currentCre,
                    title: `${userInfo.full_name} - ${countries} - ${userInfo.phone}`,
                    dueDate: dueDate,
                    updatedBy: userId,
                },
                { transaction }
            );
            return UserPrimaryInfo.update(
                { assigned_cre: currentCre },
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
            message: "Internal server error",
        });
    }
};


// round robin method
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
                role_id: 3, // Assuming role_id 3 is for CREs
                // status: true, // Uncomment to include only active users
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