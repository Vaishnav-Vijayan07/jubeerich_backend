const { where } = require("sequelize");
const db = require("../models");
const fs = require('fs');
const path = require('path');
const { addOrUpdateVisaDecline, addOrUpdateVisaApprove, addOrUpdateTravelHistory, getVisaData } = require("../utils/visa_process_helper");
const sequelize = db.sequelize;

exports.saveVisaDeclineProcess = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { visaDecline, userId } = req.body;

    visaDecline = visaDecline ? JSON.parse(visaDecline) : null;
    userId = userId ? JSON.parse(userId) : null;

    let declinedDocs = req?.files ?? null

    const saveVisaDecline = await addOrUpdateVisaDecline(
      visaDecline,
      userId,
      transaction,
      declinedDocs
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
    await transaction.rollback();
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
}

exports.saveVisaApproveProcess = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    let { visaApproved, userId } = req.body;

    visaApproved = visaApproved ? JSON.parse(visaApproved) : null
    userId = userId ? JSON.parse(userId) : null

    let approvedDocs = req?.files ?? null

    const saveVisaApprove = await addOrUpdateVisaApprove(
      visaApproved,
      userId,
      transaction,
      approvedDocs
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
    await transaction.rollback();
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
}

exports.saveTravelHistory = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { travelHistory, userId } = req.body;

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
    await transaction.rollback();
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
}

exports.getAllVisaProcess = async (req, res, next) => {
  try {
    const { id } = req.params;

    const previousVisaDeclineData = await getVisaData(db.previousVisaDecline, id, 'declined');

    const previousVisaApproveData = await getVisaData(db.previousVisaApprove, id, 'approved');

    const travelHistory = await db.travelHistory.findAll({
      where: { student_id: id },
      include: [
        {
          model: db.country,
          as: "travelHistoryCountry",
          attributes: ['id', 'country_name']
        }
      ]
    })

    return res.json({
      message: "Fetched Successfully",
      data: {
        previousVisaApprove: previousVisaApproveData.map((data) => {
          return {
            id: data?.id,
            student_id: data?.student_id,
            country_id: data?.country_id,
            visa_type: data?.visa_type,
            course_applied: data?.course_applied,
            university_applied: data?.university_applied,
            updated_by: data?.updated_by,
            createdAt: data?.createdAt,
            updatedAt: data?.updatedAt,
            country_name: data.approved_country.country_name,
            course_name: data.approved_course.course_name,
            university_name: data.approved_university_applied.university_name,
            approve_letter: data?.approved_letter
          }
        }),
        previousVisaDeclineData: previousVisaDeclineData.map((data) => {
          return {
            id: data?.id,
            student_id: data?.student_id,
            country_id: data?.country_id,
            visa_type: data?.visa_type,
            course_applied: data?.course_applied,
            university_applied: data?.university_applied,
            rejection_reason: data?.rejection_reason,
            updated_by: data?.updated_by,
            createdAt: data?.createdAt,
            updatedAt: data?.updatedAt,
            country_name: data.declined_country.country_name,
            course_name: data.declined_course.course_name,
            university_name: data.declined_university_applied.university_name,
            decline_letter: data?.declined_letter
          }
        }),
        travelHistory: travelHistory.map((data) => {
          return {
            id: data?.id,
            student_id: data.student_id,
            country_id: data?.country_id,
            start_date: data?.start_date,
            end_date: data?.end_date,
            purpose_of_travel: data?.purpose_of_travel,
            createdAt: data?.createdAt,
            updatedAt: data?.updatedAt,
            country_name: data.travelHistoryCountry.country_name
          }
        })
      }
    })
  } catch (error) {
    console.log(error);
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
}

exports.deleteVisaProcessItem = async (req, res, next) => {

  const uploadsPath = path.join(__dirname, '../uploads');
  const transaction = await sequelize.transaction();

  try {
    const { id, formName } = req.params;
    let visaData;
    let existFile;
    let message;

    switch (formName) {
      case "visa_approve":
        visaData = await db.previousVisaApprove.findByPk(id);
        existFile = await visaData.approved_letter
        message = "Visa Approve";
        break;
      case "visa_decline":
        visaData = await db.previousVisaDecline.findByPk(id);
        existFile = await visaData.declined_letter
        message = "Visa Decline";
        break;
      case "travel_history":
        visaData = await db.travelHistory.findByPk(id);
        message = "Travel History";
        break;
      default:
        throw new Error("Invalid type specified");
    }
  

    if (!visaData) {
      await transaction.rollback();
      throw new Error(`${message} not found`);
    }

    await visaData.destroy({ transaction });

    const filePath = path.join(uploadsPath, existFile);

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file ${existFile}: ${err.message}`);
      } else {
        console.log(`Deleted file: ${existFile}`);
      }
    });

    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: `${message} successfully deleted`,
    });

  } catch (error) {
    console.log(error);
    await transaction.rollback();
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
} 