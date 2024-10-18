const db = require("../models");
const { Op } = require('sequelize');
const Task = db.ordinaryTasks;
const { validationResult, check } = require("express-validator");
const moment = require('moment-timezone');

// Validation rules for Task
const taskValidationRules = [
    check("title").not().isEmpty().withMessage("Title is required"),
    check("description").optional().isString().withMessage("Description must be a string"),
    check("status").optional().isIn(["pending", "in_progress", "completed"]).withMessage("Invalid status"),
    check("due_date").optional().isISO8601().toDate().withMessage("Due date must be a valid date"),
    check("priority").optional().isIn(["low", "medium", "high"]).withMessage("Invalid priority"),
];

exports.getAllTasks = async (req, res) => {
    try {
        const userId = req.userDecodeId;

        // Define your desired timezone, e.g., 'Asia/Kolkata'
        const timezone = 'Asia/Kolkata';

        // Define start and end of today using moment with timezone
        const todayStart = moment.tz(timezone).startOf('day').toDate();
        const todayEnd = moment.tz(timezone).endOf('day').toDate();
        const currentTime = moment.tz(timezone).toDate(); // Current time in your timezone

        // Fetch today's tasks using start and end of day for comparison
        const todaysTasks = await Task.findAll({
            where: {
                user_id: userId,
                due_date: {
                    [Op.and]: [
                        { [Op.gte]: todayStart }, // Tasks due after or at start of today
                        { [Op.lte]: todayEnd }, // Tasks due before or at end of today
                    ],
                },
                status: {
                    [Op.not]: 'completed', // Exclude completed tasks
                },
            },
        });

        // Fetch upcoming tasks (due after today)
        const upcomingTasks = await Task.findAll({
            where: {
                user_id: userId,
                due_date: {
                    [Op.gt]: todayEnd, // Tasks due after today
                },
                status: {
                    [Op.not]: 'completed', // Exclude completed tasks
                },
            },
        });

        // Fetch completed tasks
        const completedTasks = await Task.findAll({
            where: {
                user_id: userId,
                status: 'completed', // Completed tasks regardless of the due date
            },
        });

        // Fetch expired tasks (due before current time)
        const expiredTasks = await Task.findAll({
            where: {
                user_id: userId,
                due_date: {
                    [Op.lt]: currentTime, // Tasks due before current time
                },
                status: {
                    [Op.not]: 'completed', // Exclude completed tasks
                },
            },
        });

        const allTasks = await Task.findAll({
            where: {
                user_id: userId
            },
        });

        res.status(200).json({
            status: true,
            data: {
                todaysTasks,
                upcomingTasks,
                completedTasks,
                expiredTasks,
                allTasks
            },
        });
    } catch (error) {
        console.error(`Error retrieving tasks: ${error}`);
        res.status(500).json({
            status: false,
            message: 'Internal server error',
        });
    }
};
// Get task by ID
exports.getTaskById = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const task = await Task.findByPk(id);
        if (!task) {
            return res.status(404).json({
                status: false,
                message: "Task not found",
            });
        }
        res.status(200).json({
            status: true,
            data: task,
        });
    } catch (error) {
        console.error(`Error retrieving task: ${error}`);
        res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};

// Add a new task
// exports.addTask = [
//     // Validation middleware
//     ...taskValidationRules,
//     async (req, res) => {
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({
//                 status: false,
//                 message: "Validation failed",
//                 errors: errors.array(),
//             });
//         }

//         const { title, description, status, due_date, priority } = req.body;

//         try {
//             const userId = req.userDecodeId;
//             const newTask = await Task.create({
//                 title,
//                 description,
//                 status,
//                 due_date,
//                 priority,
//                 user_id: userId
//             });
//             res.status(201).json({
//                 status: true,
//                 message: "Task created successfully",
//                 data: newTask,
//             });
//         } catch (error) {
//             console.error(`Error creating task: ${error}`);
//             res.status(500).json({
//                 status: false,
//                 message: "Internal server error",
//             });
//         }
//     },
// ];

exports.addTask = async (req, res) => {

    const { title } = req.body;

    try {
        const userId = req.userDecodeId;
        const newTask = await Task.create({
            title,
            user_id: userId
        });
        res.status(201).json({
            status: true,
            message: "Task created successfully",
            data: newTask,
        });
    } catch (error) {
        console.error(`Error creating task: ${error}`);
        res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
},

// Update a task
// exports.updateTask = [
//     // Validation middleware
//     ...taskValidationRules,
//     async (req, res) => {
//         const id = parseInt(req.params.id);
//         const errors = validationResult(req);
//         if (!errors.isEmpty()) {
//             return res.status(400).json({
//                 status: false,
//                 message: "Validation failed",
//                 errors: errors.array(),
//             });
//         }

//         try {
//             const task = await Task.findByPk(id);
//             if (!task) {
//                 return res.status(404).json({
//                     status: false,
//                     message: "Task not found",
//                 });
//             }

//             const updatedData = {
//                 title: req.body.title ?? task.title,
//                 description: req.body.description ?? task.description,
//                 status: req.body.status ?? task.status,
//                 due_date: req.body.due_date ?? task.due_date,
//                 priority: req.body.priority ?? task.priority,
//             };

//             const updatedTask = await task.update(updatedData);

//             res.status(200).json({
//                 status: true,
//                 message: "Task updated successfully",
//                 data: updatedTask,
//             });
//         } catch (error) {
//             console.error(`Error updating task: ${error}`);
//             res.status(500).json({
//                 status: false,
//                 message: "Internal server error",
//             });
//         }
//     },
// ];

exports.updateTask = async (req, res) => {
        const id = parseInt(req.params.id);

        try {
            const task = await Task.findByPk(id);
            if (!task) {
                return res.status(404).json({
                    status: false,
                    message: "Task not found",
                });
            }

            const updatedData = {
                title: req?.body?.title || null,
                description: req?.body?.description || null,
                status: req?.body?.status || null,
                due_date: req?.body?.due_date || null,
                priority: req?.body?.priority || null,
            };

            console.log('updatedData',updatedData);
            

            const updatedTask = await task.update(updatedData);

            res.status(200).json({
                status: true,
                message: "Task updated successfully",
                data: updatedTask,
            });
        } catch (error) {
            console.error(`Error updating task: ${error}`);
            res.status(500).json({
                status: false,
                message: "Internal server error",
            });
        }
    },

// Delete a task
exports.deleteTask = async (req, res) => {
    const id = parseInt(req.params.id);
    console.log('id',id);

    try {
        const task = await Task.findByPk(id);
        if (!task) {
            return res.status(404).json({
                status: false,
                message: "Task not found",
            });
        }

        await task.destroy();
        res.status(200).json({
            status: true,
            message: "Task deleted successfully",
        });
    } catch (error) {
        console.error(`Error deleting task: ${error}`);
        res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
