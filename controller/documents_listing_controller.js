const { where } = require("sequelize");
const db = require("../models");
const UserExams = db.userExams;

exports.getAllDocuments = async (req, res) => {
    try {
        const studentId = req.params.id;

        const examDocs = await UserExams.findAll({
            where: {
                student_id: studentId,
            },
            attributes: ['id', 'exam_name', 'document'],
        });

        res.status(200).json({
            status: true,
            data: examDocs,
        });
    } catch (error) {
        console.error(`Error retrieving documents: ${error}`);
        res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};