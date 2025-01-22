const db = require("../models");
const fs = require('fs');
const path = require('path');
const uploadsPath = path.join(__dirname, '../uploads/experienceHistoryDocs');

exports.saveEmploymentHistory = async (req, res, next) => {
    try {
        const {
            served_notice_period,
            terminated_from_company,
            good_relation_with_employers,
            submitted_forged_documents,
            has_abroad_work_evidence,
            updated_by
        } = req.body;

        const { id } = req.params;
        const userId = req.userDecodeId;

        const {
            visaPage: [visaPage] = [],
            permitCard: [permitCard] = [],
            salaryAccountStatement: [salaryAccountStatement] = [],
            supportingDocuments: [supportingDocuments] = []
        } = req.files || {};

        const existData = await db.EmploymentHistory.findOne({ where: { student_id: id } });

        const newData = {
            served_notice_period,
            terminated_from_company,
            good_relation_with_employers,
            submitted_forged_documents,
            has_abroad_work_evidence,
            visa_page: visaPage?.filename || existData?.visa_page,
            permit_card: permitCard?.filename || existData?.permit_card,
            salary_account_statement: salaryAccountStatement?.filename || existData?.salary_account_statement,
            supporting_documents: supportingDocuments?.filename || existData?.supporting_documents,
            student_id: id,
            updated_by: userId
        };

        let result;
        if (existData) {
            result = await db.EmploymentHistory.update(newData, { where: { student_id: id } });
            handleFileUpdates(
                existData,
                { visaPage, permitCard, salaryAccountStatement, supportingDocuments }
            );
        } else {
            result = await db.EmploymentHistory.create(newData);
        }

        return res.status(200).json({
            status: true,
            message: `Employment history saved successfully`,
            data: result
        });

    } catch (error) {
        console.error("Error saving employment history:", error);
        return res.status(500).json({ status: false, message: 'An error occurred while processing your request. Please try again later.' });
    }
};

exports.getEmploymentHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log('ID',id);
        

        const result = await db.EmploymentHistory.findOne({ where: { student_id: id } });

        console.log('result',result);

        return res.status(200).json({
            status: true,
            message: `Employment history fetched successfully`,
            data: result
        });

    } catch (error) {
        console.error("Error fetching employment history:", error);
        return res.status(500).json({ status: false, message: 'An error occurred while processing your request. Please try again later.' });
    }
};

const handleFileUpdates = (existData, newFiles) => {
    const {
        visa_page: existedVisaPage,
        permit_card: existedPermitCard,
        salary_account_statement: existedSAS,
        supporting_documents: existedSupportingDocuments
    } = existData;

    const {
        visaPage,
        permitCard,
        salaryAccountStatement,
        supportingDocuments
    } = newFiles;

    if (visaPage && existedVisaPage) removeExistedFile(existedVisaPage);
    if (permitCard && existedPermitCard) removeExistedFile(existedPermitCard);
    if (salaryAccountStatement && existedSAS) removeExistedFile(existedSAS);
    if (supportingDocuments && existedSupportingDocuments) removeExistedFile(existedSupportingDocuments);
};

const removeExistedFile = (existFile) => {
    const filePath = path.join(uploadsPath, existFile);

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Error deleting file ${existFile}: ${err.message}`);
        } else {
            console.log(`Deleted file: ${existFile}`);
        }
    });
};
