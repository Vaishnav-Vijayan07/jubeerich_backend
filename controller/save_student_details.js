const { validationResult, check } = require("express-validator");
const db = require("../models");
const { checkIfEntityExists } = require("../utils/helper");
const UserPrimaryInfo = db.userPrimaryInfo;
const sequelize = db.sequelize;
const { Op, Sequelize } = require("sequelize");

exports.saveStudentBasicInfo = async (req, res) => {
  const {
    passport_no,
    dob,
    gender,
    marital_status,
    user_id,
    full_name,
    email,
    phone,
    preferred_country,
    office_type,
    region_id,
    counsiler_id,
    branch_id,
    nationality,
    secondary_number,
    state,
    country,
    address
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    // const userId = req.userDecodeId;
    // console.log("userId===>", userId);

    const userPrimaryInfo = await UserPrimaryInfo.findByPk(user_id);

    if (!userPrimaryInfo) {
      throw new Error("User not found");
    }

    const updatedUserPrimaryInfo = await userPrimaryInfo.update(
      {
        full_name,
        email,
        phone,
        preferred_country,
        office_type,
        region_id,
        counsiler_id,
        branch_id,
      },
      { transaction }
    );

    let userBasicInfo = await db.userBasicInfo.findOne({
      where: { user_id },
    });

    let userBasicDetails;

    if (userBasicInfo) {
      userBasicDetails = await userBasicInfo.update(
        {
          passport_no,
          dob,
          gender,
          marital_status,
          nationality,
          secondary_number,
          state,
          country,
          address,
          user_id
        },
        { transaction }
      );
    } else {
      userBasicDetails = await db.userBasicInfo.create(
        {
          user_id,
          passport_no,
          dob,
          gender,
          marital_status,
          nationality,
          secondary_number,
          state,
          country,
          address
        },
        { transaction }
      );
    }

    await transaction.commit();

    return res.status(201).json({
      status: true,
      message: "Basic details updated successfully",
      data: { updatedUserPrimaryInfo, userBasicDetails },
    });
  } catch (error) {
    await transaction.rollback();
    console.error(`Error: ${error.message}`);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.saveStudentAcademicInfo = async (req, res) => {
  const { qualification, place, percentage, year_of_passing, backlogs, work_experience, designation, user_id } =
    req.body;

  const transaction = await sequelize.transaction();

  try {
    let UserAcadamicInfo = await db.userAcademicInfo.findOne({
      where: { user_id: user_id },
    });

    let UserAccadamicDetails;

    if (UserAcadamicInfo) {
      UserAccadamicDetails = await UserAcadamicInfo.update(
        {
          qualification,
          place,
          percentage,
          year_of_passing,
          backlogs,
          work_experience,
          designation,
        },
        { transaction }
      );
    } else {
      UserAccadamicDetails = await db.userAcademicInfo.create(
        {
          qualification,
          place,
          percentage,
          year_of_passing,
          backlogs,
          work_experience,
          designation,
          user_id,
        },
        { transaction }
      );
    }

    await transaction.commit();

    return res.status(201).json({
      status: true,
      message: "Academic details updated successfully",
      data: { UserAccadamicDetails },
    });
  } catch (error) {
    await transaction.rollback();
    console.error(`Error: ${error.message}`);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.saveStudentStudyPreferenceInfo = async (req, res) => {
  const {
    intersted_country,
    intrested_institution,
    intake_year,
    intake_month,
    estimated_budget,
    course_field_of_intrest,
    user_id,
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    let UserStudyPreferenceInfo = await db.userStudyPreference.findOne({
      where: { user_id: user_id },
    });

    let UserStudyPreferenceDetails;

    if (UserStudyPreferenceInfo) {
      UserStudyPreferenceDetails = await UserStudyPreferenceInfo.update(
        {
          intersted_country,
          intrested_institution,
          intake_year,
          intake_month,
          estimated_budget,
          course_field_of_intrest,
          user_id,
        },
        { transaction }
      );
    } else {
      UserStudyPreferenceDetails = await db.userStudyPreference.create(
        {
          intersted_country,
          intrested_institution,
          intake_year,
          intake_month,
          estimated_budget,
          course_field_of_intrest,
          user_id,
        },
        { transaction }
      );
    }

    await transaction.commit();

    return res.status(201).json({
      status: true,
      message: "Student study preference info updated successfully",
      data: { UserStudyPreferenceDetails },
    });
  } catch (error) {
    await transaction.rollback();
    console.error(`Error: ${error.message}`);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
