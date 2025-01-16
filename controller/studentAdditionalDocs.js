const db = require("../models");
const sequelize = db.sequelize;
const fs = require('fs');
const path = require('path');
const { Op, where } = require("sequelize");

const uploadsPath = path.join(__dirname, '../uploads/studentAdditionalDocs')

exports.saveAdditionalDocs = async (req, res, next) => {
    const { id } = req.params;
    
    const passportDoc = req?.files?.passport_doc?.[0] ?? null;
    const updatedCv = req?.files?.updated_cv?.[0] ?? null;
    const profileAssessmentDoc = req?.files?.profile_assessment_doc?.[0] ?? null;
    const pteCred = req?.files?.pte_cred?.[0] ?? null;
    const lorDoc = req?.files?.lor?.[0] ?? null;
    const sopDoc = req?.files?.sop?.[0] ?? null;
    const gteForm = req?.files?.gte_form?.[0] ?? null;

    const transaction = await sequelize.transaction();

    try {

        const existDocs = await db.studentAdditionalDocs.findOne({
            where: { student_id: id },
        })

        console.log('existDocs', existDocs);

        let result;
        if (!existDocs) {
            result = await db.studentAdditionalDocs.create({
                student_id: id,
                passport_doc: passportDoc?.filename,
                updated_cv: updatedCv?.filename,
                profile_assessment_doc: profileAssessmentDoc?.filename,
                pte_cred: pteCred?.filename,
                lor: lorDoc?.filename,
                sop: sopDoc?.filename,
                gte_form: gteForm?.filename
            }, { transaction: transaction })
        } else {

            const docsToCheck = [
                { newDoc: passportDoc, oldDoc: existDocs.passport_doc },
                { newDoc: updatedCv, oldDoc: existDocs.updated_cv },
                { newDoc: profileAssessmentDoc, oldDoc: existDocs.profile_assessment_doc },
                { newDoc: pteCred, oldDoc: existDocs.pte_cred },
                { newDoc: lorDoc, oldDoc: existDocs.lor },
                { newDoc: sopDoc, oldDoc: existDocs.sop },
                { newDoc: gteForm, oldDoc: existDocs.gte_form },
            ];

            for (const { newDoc, oldDoc } of docsToCheck) {
                if (newDoc && newDoc.filename !== oldDoc) {
                    await deleteFile(oldDoc).catch(err => console.error(`Failed to delete old file: ${err.message}`));
                }
            }

            result = await db.studentAdditionalDocs.update({
                passport_doc: passportDoc ? passportDoc?.filename : existDocs?.passport_doc,
                updated_cv: updatedCv ? updatedCv?.filename : existDocs?.updated_cv,
                profile_assessment_doc: profileAssessmentDoc ? profileAssessmentDoc?.filename : existDocs?.profileAssessmentDoc,
                pte_cred: pteCred ? pteCred?.filename : existDocs.pte_cred,
                lor: lorDoc ? lorDoc?.filename : existDocs.lor,
                sop: sopDoc ? sopDoc?.filename : existDocs.sop,
                gte_form: gteForm ? gteForm?.filename : existDocs.gte_form,
              }, {
                where: { student_id: id },
                transaction: transaction
              });
        }

        console.log('result ===>', result);

        await transaction.commit();

        return res.status(200).json({ status: true, message: "Documents saved successfully." });

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        console.error(`Error: ${error.message}`);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

exports.getAdditionalDocs = async (req, res, next) => {
    const { id } = req.params;
    console.log('ID', id);

    try {

        const existDocs = await db.studentAdditionalDocs.findOne({
            where: { student_id: id },
        })

        return res.status(200).json({ status: true, data: existDocs, message: "Documents fetched successfully." });

    } catch (error) {
        console.log(error);
        console.error(`Error: ${error.message}`);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

exports.deleteAdditionalDocs = async (req, res, next) => {
    const { id, name } = req.params;
    console.log('ID',id);
    console.log('name',name);

    const transaction = await sequelize.transaction();

    try {

        const existDocs =  await db.studentAdditionalDocs.findOne({
            where: { student_id: id },
        })

        console.log('existDocs', existDocs);
        console.log('existDocs', existDocs?.[name]);
        const deleteDocs = await db.studentAdditionalDocs.update(
            {
              [name]: null,
            },
            {
              where: {
                student_id: id,
              },
            })

        console.log('deleteDocs', deleteDocs);

        await deleteFile(existDocs?.[name]).catch(err => console.error(`Failed to delete file: ${err.message}`));

        await transaction.commit();

        return res.status(200).json({ status: true, message: "Documents saved successfully." });

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        console.error(`Error: ${error.message}`);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
}

const deleteFile = (filename) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(uploadsPath, filename);
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`Error deleting file ${filename}: ${err.message}`);
                reject(err); 
            } else {
                console.log(`Deleted file: ${filename}`);
                resolve();
            }
        });
    });
};
