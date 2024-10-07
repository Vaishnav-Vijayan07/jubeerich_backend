const db = require("../models");
const fs = require('fs');
const path = require('path');
const declined_letter = 'declined_letter'
const approved_letter = 'approved_letter'
const travel_history = 'travel_history'

const batchUpsertVisaProcess = async (model, records, transaction, files, dbName = travel_history) => {
    try {
        const ids = records.filter((record) => record.id !== "0").map((record) => record.id);
        console.log(ids);

        const existingRecords = await model.findAll({
            where: { id: ids },
            transaction,
        });

        const updatePromises = [];
        const addPromises = [];
        const uploadsPath = path.join(__dirname, '../uploads');

        records.forEach((record, index) => {
            const newFile = (files?.[index]?.size && files[index].size !== 0) ? files[index].filename : null;
            const emptyFiles = (files?.[index]?.size == 0) ? files[index].filename : null;

            if (record.id === "0") {
                let { id, ...recordWithoutId } = record;

                console.log('dbName:', dbName);

                if (dbName === declined_letter) {
                    recordWithoutId.declined_letter = newFile;
                } else if (dbName === approved_letter) {
                    recordWithoutId.approved_letter = newFile;
                }

                console.log('Record without ID:', recordWithoutId);
                addPromises.push(model.create(recordWithoutId, { transaction }));
            } else {
                const existingRecord = existingRecords.find((r) => r.id === record.id);

                if (existingRecord) {
                    const updateFields = {};
                    let existingFile;

                    Object.keys(record).forEach((key) => {
                        if (key !== 'id' && record[key] !== existingRecord[key]) {
                            updateFields[key] = record[key];
                        }
                    });

                    if (newFile) {
                        if (existingRecord.dataValues.hasOwnProperty(approved_letter)) {
                            existingFile = existingRecord['approved_letter'];
                            updateFields['approved_letter'] = newFile;
                        } else if (existingRecord.dataValues.hasOwnProperty(declined_letter)) {
                            existingFile = existingRecord['declined_letter'];
                            updateFields['declined_letter'] = newFile;
                        }
                    }

                    console.log('existingFile', existingFile);

                    if (existingFile) {
                        const filePath = path.join(uploadsPath, existingFile);
                        fs.unlink(filePath, (err) => {
                            if (err) {
                                console.error(`Error deleting file ${existingFile}: ${err.message}`);
                            } else {
                                console.log(`Deleted file: ${existingFile}`);
                            }
                        });
                    }

                    if (Object.keys(updateFields).length > 0) {
                        updatePromises.push(existingRecord.update(updateFields, { transaction }));
                    }

                    console.log('EMPTY FILE', emptyFiles);

                    if (emptyFiles) {
                        const emptyFilePath = path.join(uploadsPath, emptyFiles);
                        fs.unlink(emptyFilePath, (err) => {
                            if (err) {
                                console.error(`Error deleting file ${emptyFiles}: ${err.message}`);
                            } else {
                                console.log(`Deleted file: ${emptyFiles}`);
                            }
                        });
                    }
                }
            }
        });

        await Promise.all([...addPromises, ...updatePromises]);
    } catch (error) {
        console.log(error);
        throw new Error(`Visa Update Failed: ${error.message}`);
    }
};


const addOrUpdateVisaDecline = async (visaDecline, userId, transaction, declinedDocs) => {
    try {
        console.log('declinedDocs', declinedDocs);

        const visaDeclineData = visaDecline.map((visaRecord) => ({
            ...visaRecord,
            updated_by: userId
        }));

        await batchUpsertVisaProcess(db.previousVisaDecline, visaDeclineData, transaction, declinedDocs?.visaDeclinedDocs, declined_letter);
        return { success: true };
    } catch (error) {
        console.log(error);
        throw new Error(`Visa Declines Update Failed: ${error.message}`);
    }
}

const addOrUpdateVisaApprove = async (visaApprove, userId, transaction, approvedDocs) => {

    try {
        const visaApproveData = visaApprove.map((visaRecord, index) => ({
            ...visaRecord,
            updated_by: userId,
        }));

        await batchUpsertVisaProcess(db.previousVisaApprove, visaApproveData, transaction, approvedDocs?.visaApprovedDocs, approved_letter);
        return { success: true };
    } catch (error) {
        console.log(error);
        throw new Error(`Visa Approve Update Failed: ${error.message}`);
    }
}

const addOrUpdateTravelHistory = async (travelHistory, userId, transaction) => {
    try {
        const travelHistoryData = travelHistory.map((visaRecord) => ({
            ...visaRecord,
            updated_by: userId
        }));

        await batchUpsertVisaProcess(db.travelHistory, travelHistoryData, transaction);
        return { success: true };
    } catch (error) {
        console.log(error);
        throw new Error(`Travel History Update Failed: ${error.message}`);
    }
}

const getVisaData = async (model, studentId, aliasName) => {
    return await model.findAll({
        where: { student_id: studentId },
        include: [
            {
                model: db.country,
                as: `${aliasName}_country`,
                attributes: ['country_name']
            },
            {
                model: db.course,
                as: `${aliasName}_course`,
                attributes: ['course_name']
            },
            {
                model: db.university,
                as: `${aliasName}_university_applied`,
                attributes: ['university_name']
            },
        ]
    });
}

module.exports = {
    addOrUpdateVisaDecline,
    addOrUpdateVisaApprove,
    addOrUpdateTravelHistory,
    getVisaData
}