const db = require("../models");
const { addOrUpdateVisaDecline, addOrUpdateVisaApprove, addOrUpdateTravelHistory } = require("../utils/visa_process_helper");

const sequelize = db.sequelize;

exports.saveVisaDeclineProcess = async(req, res, next) => {
    try {
        const { visaDecline, userId } = req.body;
        const transaction = await sequelize.transaction();

        const saveVisaDecline = await addOrUpdateVisaDecline(
            visaDecline,
            userId,
            transaction
        )

        if (saveVisaDecline.success) {
            await transaction.commit();
            return res.status(201).json({
              status: true,
              message: "Visa Decline Process updated successfully",
            });
          } else {
            throw new Error("Failed to update visa decline process");
          }
    } catch (error) {
        console.log(error);
    }
}

exports.saveVisaApproveProcess = async(req, res, next) => {
    try {
        const { visaApproved, userId } = req.body;
        const transaction = await sequelize.transaction();

        const saveVisaApprove = await addOrUpdateVisaApprove(
            visaApproved,
            userId,
            transaction
        )

        if (saveVisaApprove.success) {
            await transaction.commit();
            return res.status(201).json({
              status: true,
              message: "Visa Approve Process updated successfully",
            });
          } else {
            throw new Error("Failed to update visa approve process");
          }
    } catch (error) {
        console.log(error);
    }
}

exports.saveTravelHistory = async(req, res, next) => {
    try {
        const { travelHistory, userId } = req.body;
        const transaction = await sequelize.transaction();

        const saveTravelHistory = await addOrUpdateTravelHistory(
            travelHistory,
            userId,
            transaction
        )

        if (saveTravelHistory.success) {
            await transaction.commit();
            return res.status(201).json({
              status: true,
              message: "Travel History updated successfully",
            });
          } else {
            throw new Error("Failed to update Travel History");
          }
    } catch (error) {
        console.log(error);
    }
}

exports.getAllVisaProcess = async(req, res, next) => {
    try {
        const { id } = req.params;
        const previousVisaDeclineData = await db.previousVisaDecline.findByPk(id, {
            includes: [
                {
                    model: db.userPrimaryInfo,
                    as: "previousVisaDecline",
                    attributes: ['']
                }
            ]
        });
    } catch (error) {
        console.log(error);
    }
}