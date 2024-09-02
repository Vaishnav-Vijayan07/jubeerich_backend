const { where } = require("sequelize");
const db = require("../models");
const UserExams = db.userExams;
const path = require('path')

exports.getAllDocuments = async (req, res) => {
    try {
        const studentId = req.params.id;

        const examDocs = await UserExams.findAll({
            where: {
                student_id: studentId,
            },
            attributes: ['id', 'exam_name', 'document'],
        });

        // Add the full download URL to each document
        const examDocsWithUrls = examDocs.map(doc => ({
            ...doc.dataValues,
            downloadUrl: `${process.env.BASE_URL}/uploads/examDocuments/${doc.document}`, // Construct the full URL
            extension: path.extname(doc.document).slice(1)
        }));

        res.status(200).json({
            status: true,
            data: examDocsWithUrls,
        });
    } catch (error) {
        console.error(`Error retrieving documents: ${error}`);
        res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};