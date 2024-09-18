const { where } = require("sequelize");
const db = require("../models");
const { addOrUpdateVisaDecline, addOrUpdateVisaApprove, addOrUpdateTravelHistory, getVisaData } = require("../utils/visa_process_helper");

const sequelize = db.sequelize;

exports.saveVisaDeclineProcess = async (req, res, next) => {
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
    if (!transaction.success) {
      await transaction.rollback();
    }
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}

exports.saveVisaApproveProcess = async (req, res, next) => {
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
    if (!transaction.success) {
      await transaction.rollback();
    }
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}

exports.saveTravelHistory = async (req, res, next) => {
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
    if (!transaction.success) {
      await transaction.rollback();
    }
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
}

exports.getAllVisaProcess = async (req, res, next) => {
  try {
    const { id } = req.params;

    const previousVisaDeclineData = await getVisaData(db.previousVisaDecline, id, 'declined');

    console.log('previousVisaDeclineData', previousVisaDeclineData);

    const previousVisaApproveData = await getVisaData(db.previousVisaApprove, id, 'approved');

    console.log('previousVisaApproveData', previousVisaApproveData);

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

    console.log('travelHistory', travelHistory);

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
      message: "Internal server error",
    });
  }
}

exports.deleteVisaProcessItem = async(req,res,next) => {
  try {
    const { id, formName } = req.params;
    let visaData;
    let message;

    const transaction = await sequelize.transaction();

    switch (formName) {
      case "visa_approve":
        visaData = await db.previousVisaApprove.findByPk(id);
        message = "Visa Approve";
        break;
      case "visa_decline":
        visaData = await db.previousVisaDecline.findByPk(id);
        message = "Visa Decline";
        break;
      case "travel_history":
        visaData = await db.travelHistory.findByPk(id);
        message = "Travel History";
        break;
      default:
        throw new Error("Invalid type specified");
    }

    console.log('visaData',visaData);
    

    if (!visaData) {
      await transaction.rollback();
      throw new Error(`${message} not found`);
    }

    await visaData.destroy({ transaction });

    await transaction.commit();
    
    return res.status(200).json({
      status: true,
      message: `${message} successfully deleted`,
    });

  } catch (error) {
    console.log(error);
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
} 