const db = require("../models");

const batchUpsertVisaProcess = async (model, records, transaction) => {
    const ids = records.map((record) => record.id).filter((id) => id !== "0");

    console.log(ids);

    const existingRecords = await model.findAll({
        where: { id: ids },
        transaction,
    });

    console.log('existingRecords', existingRecords);

    const updatePromises = [];
    const addPromises = [];

    records.forEach((record) => {
        if (record.id === "0") {
            const { id, ...recordWithOutid } = record;
            console.log('recordWithOutid', recordWithOutid);
            addPromises.push(model.create(recordWithOutid, { transaction }));
        } else {
            const existingRecord = existingRecords.find((r) => r.id == record.id);
            if (existingRecord) {
                const updateFields = {};
                Object.keys(record).forEach((key) => {
                    if (key !== "id" && record[key] !== existingRecord[key]) {
                        updateFields[key] = record[key];
                    }
                });

                console.log("UPDATE FILEDS", updateFields);

                if (Object.keys(updateFields).length > 0) {
                    updatePromises.push(
                        existingRecord.update(updateFields, { transaction })
                    );
                }
            }
        }
    });

    await Promise.all([...addPromises, ...updatePromises]);
};

const addOrUpdateVisaDecline = async (visaDecline, userId, transaction) => {
    try {
        const visaDeclineData = visaDecline.map((visaRecord) => ({
            ...visaRecord,
            updated_by: userId
        }));

        console.log("Visa Declines", visaDeclineData);

        await batchUpsertVisaProcess(db.previousVisaDecline, visaDeclineData, transaction);
        return { success: true };
    } catch (error) {
        console.log(error);
        throw new Error(`Visa Declines Update Failed: ${error.message}`);
    }
}

const addOrUpdateVisaApprove = async (visaApprove, userId, transaction) => {
    try {
        const visaApproveData = visaApprove.map((visaRecord) => ({
            ...visaRecord,
            updated_by: userId
        }));

        console.log("Visa Approve", visaApproveData);

        await batchUpsertVisaProcess(db.previousVisaApprove, visaApproveData, transaction);
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

        console.log("Travel History ", travelHistoryData);

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