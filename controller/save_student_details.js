const { validationResult, check } = require("express-validator");
const db = require("../models");
const { checkIfEntityExists } = require("../utils/helper");
const UserPrimaryInfo = db.userPrimaryInfo;
const sequelize = db.sequelize;
const { Op, Sequelize, where } = require("sequelize");
const fs = require("fs");
const path = require("path");
const {
  addOrUpdateAcademic,
  addOrUpdateWork,
  addOrUpdateExamDocs,
} = require("../utils/academic_query_helper");

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
    preferred_country, // This should be an array of country IDs
    office_type,
    region_id,
    counsiler_id,
    branch_id,
    nationality,
    secondary_number,
    state,
    country,
    address,
    ielts,
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    // Fetch the existing userPrimaryInfo record
    const userPrimaryInfo = await UserPrimaryInfo.findByPk(user_id);

    if (!userPrimaryInfo) {
      throw new Error("User not found");
    }

    // Update the UserPrimaryInfo record
    const updatedUserPrimaryInfo = await userPrimaryInfo.update(
      {
        full_name,
        email,
        phone,
        office_type,
        region_id,
        counsiler_id,
        branch_id,
        ielts,
      },
      { transaction }
    );

    // Update preferred countries if provided
    if (Array.isArray(preferred_country) && preferred_country.length > 0) {
      await updatedUserPrimaryInfo.setPreferredCountries(preferred_country, {
        transaction,
      });
    }

    // Check if userBasicInfo exists and update or create accordingly
    let userBasicDetails;
    const userBasicInfo = await db.userBasicInfo.findOne({
      where: { user_id },
    });

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
          address,
        },
        { transaction }
      );
    }

    // Commit the transaction
    await transaction.commit();

    // Respond with success
    return res.status(200).json({
      status: true,
      message: "Basic details updated successfully",
      data: {
        updatedUserPrimaryInfo,
        userBasicDetails,
      },
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    console.error(`Error: ${error.message}`);

    // Respond with an error
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// exports.saveStudentBasicInfo = async (req, res) => {
//   const {
//     passport_no,
//     dob,
//     gender,
//     marital_status,
//     user_id,
//     full_name,
//     email,
//     phone,
//     preferred_country,
//     office_type,
//     region_id,
//     counsiler_id,
//     branch_id,
//     nationality,
//     secondary_number,
//     state,
//     country,
//     address,
//     ielts
//   } = req.body;

//   const transaction = await sequelize.transaction();

//   try {
//     // const userId = req.userDecodeId;
//     // console.log("userId===>", userId);

//     const userPrimaryInfo = await UserPrimaryInfo.findByPk(user_id);

//     if (!userPrimaryInfo) {
//       throw new Error("User not found");
//     }

//     const updatedUserPrimaryInfo = await userPrimaryInfo.update(
//       {
//         full_name,
//         email,
//         phone,
//         preferred_country,
//         office_type,
//         region_id,
//         counsiler_id,
//         branch_id,
//         ielts
//       },
//       { transaction }
//     );

//     let userBasicInfo = await db.userBasicInfo.findOne({
//       where: { user_id },
//     });

//     let userBasicDetails;

//     if (userBasicInfo) {
//       userBasicDetails = await userBasicInfo.update(
//         {
//           passport_no,
//           dob,
//           gender,
//           marital_status,
//           nationality,
//           secondary_number,
//           state,
//           country,
//           address,
//           user_id
//         },
//         { transaction }
//       );
//     } else {
//       userBasicDetails = await db.userBasicInfo.create(
//         {
//           user_id,
//           passport_no,
//           dob,
//           gender,
//           marital_status,
//           nationality,
//           secondary_number,
//           state,
//           country,
//           address
//         },
//         { transaction }
//       );
//     }

//     await transaction.commit();

//     return res.status(201).json({
//       status: true,
//       message: "Basic details updated successfully",
//       data: { updatedUserPrimaryInfo, userBasicDetails },
//     });
//   } catch (error) {
//     await transaction.rollback();
//     console.error(`Error: ${error.message}`);

//     return res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };

exports.saveStudentAcademicInfo = async (req, res) => {
  let { academicRecords, exam_details, user_id } = req.body;

  // Ensure the exam documents are handled correctly
  const files = req.files?.exam_documents || [];

  // Check if there is any data to process
  const hasAcademicData = academicRecords && academicRecords.length > 0;
  const hasExamData = exam_details && exam_details.length > 0;

  if (!hasAcademicData && !hasExamData) {
    return res.status(400).json({
      status: false,
      message: "No academic or exam data provided to save.",
    });
  }

  // Start a transaction only if there is data to process
  const transaction = await sequelize.transaction();

  try {
    let academicResult = { success: true };
    let examResult = { success: true };

    if (hasExamData) {
      examResult = await addOrUpdateExamDocs(
        exam_details,
        user_id,
        files,
        transaction
      );
    }

    if (hasAcademicData) {
      academicResult = await addOrUpdateAcademic(
        academicRecords,
        user_id,
        transaction
      );
    }

    if (academicResult.success && examResult.success) {
      await transaction.commit();
      return res.status(201).json({
        status: true,
        message: "Academic and exam details updated successfully",
      });
    } else {
      throw new Error("Failed to update all records");
    }
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.saveStudentWorkInfo = async (req, res) => {
  let { workExperience, user_id } = req.body;

  console.log("workExperience", workExperience);

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    const workResult = await addOrUpdateWork(
      workExperience,
      user_id,
      transaction
    );

    if (workResult.success) {
      await transaction.commit();
      return res.status(201).json({
        status: true,
        message: "Academic and work details updated successfully",
      });
    } else {
      throw new Error("Failed to update all records");
    }
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
exports.deleteStudentAcademicInfo = async (req, res) => {
  const { id, type } = req.params;

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    let record;
    let message;

    switch (type) {
      case "academic":
        record = await db.academicInfos.findByPk(id);
        message = "Academic record";
        break;
      case "work":
        record = await db.workInfos.findByPk(id);
        message = "Work record";
        break;
      case "exam":
        record = await db.userExams.findByPk(id);
        message = "Exam record";
        break;
      default:
        throw new Error("Invalid type specified");
    }

    if (!record) {
      throw new Error(`${message} not found`);
    }

    if (type === "exam") {
      const file = record.document;
      if (file) {
        const filePath = path.join(
          __dirname,
          "..",
          "uploads",
          "examDocuments",
          file
        );

        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Failed to delete file: ${filePath}`, err);
          } else {
            console.log(`Successfully deleted file: ${filePath}`);
          }
        });
      }
    }

    await record.destroy({ transaction });

    // Commit the transaction
    await transaction.commit();
    console.log(`${message} with id:${id} successfully deleted`);

    return res.status(200).json({
      status: true,
      message: `${message} successfully deleted`,
    });
  } catch (error) {
    if (!transaction.finished) {
      // Rollback the transaction only if it's not already finished
      await transaction.rollback();
    }
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// exports.saveStudentStudyPreferenceInfo = async (req, res) => {
//   const {
//     intersted_country,
//     intrested_institution,
//     intake_year,
//     intake_month,
//     estimated_budget,
//     course_field_of_intrest,
//     user_id,
//   } = req.body;

//   const transaction = await sequelize.transaction();

//   try {
//     let UserStudyPreferenceInfo = await db.userStudyPreference.findOne({
//       where: { user_id: user_id },
//     });

//     let UserStudyPreferenceDetails;

//     if (UserStudyPreferenceInfo) {
//       UserStudyPreferenceDetails = await UserStudyPreferenceInfo.update(
//         {
//           intersted_country,
//           intrested_institution,
//           intake_year,
//           intake_month,
//           estimated_budget,
//           course_field_of_intrest,
//           user_id,
//         },
//         { transaction }
//       );
//     } else {
//       UserStudyPreferenceDetails = await db.userStudyPreference.create(
//         {
//           intersted_country,
//           intrested_institution,
//           intake_year,
//           intake_month,
//           estimated_budget,
//           course_field_of_intrest,
//           user_id,
//         },
//         { transaction }
//       );
//     }

//     await transaction.commit();

//     return res.status(201).json({
//       status: true,
//       message: "Student study preference info updated successfully",
//       data: { UserStudyPreferenceDetails },
//     });
//   } catch (error) {
//     await transaction.rollback();
//     console.error(`Error: ${error.message}`);

//     return res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };

exports.saveStudentStudyPreferenceInfo = async (req, res) => {
  const {
    intersted_country,
    intrested_institution,
    intake_year,
    intake_month,
    estimated_budget,
    course_field_of_intrest,
    user_id,
    universities,
    campus,
    stream,
    course,
    duration,
    course_fee,
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
          universities,
          campus,
          stream,
          course,
          duration,
          course_fee,
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
          universities,
          campus,
          stream,
          course,
          duration,
          course_fee,
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
