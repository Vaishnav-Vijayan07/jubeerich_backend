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
    preferred_country,  // This should be an array of country IDs
    office_type,
    region_id,
    counsiler_id,
    branch_id,
    nationality,
    secondary_number,
    state,
    country,
    address,
    ielts
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
        ielts
      },
      { transaction }
    );

    // Update preferred countries if provided
    if (Array.isArray(preferred_country) && preferred_country.length > 0) {
      await updatedUserPrimaryInfo.setPreferredCountries(preferred_country, { transaction });
    }

    // Check if userBasicInfo exists and update or create accordingly
    let userBasicDetails;
    const userBasicInfo = await db.userBasicInfo.findOne({ where: { user_id } });

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
          address
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

    // Commit the transaction
    await transaction.commit();

    // Respond with success
    return res.status(200).json({
      status: true,
      message: "Basic details updated successfully",
      data: {
        updatedUserPrimaryInfo,
        userBasicDetails
      }
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
  let { qualification, place, percentage, year_of_passing, backlogs, work_experience, designation, company, years, user_id, exam_details } =
    req.body;

    console.log('BODY', req.body);
    

  console.log('User ID', user_id);
  

  exam_details = exam_details ? JSON.parse(exam_details) : null
  console.log('exam_details',exam_details);
  
  const examDocuments = req.files && req.files['exam_documents'];

  console.log("Files ===>", examDocuments)

  const transaction = await sequelize.transaction();

  try {
    let UserAcadamicInfo = await db.userAcademicInfo.findOne({
      where: { user_id: user_id },
    });

    console.log('UserAcadamicInfo',UserAcadamicInfo);
    

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
          company,
          years
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
          company,
          years,
          user_id,
        },
        { transaction }
      );
    }

    if (Array.isArray(exam_details) && exam_details.length > 0) {
      const examDetailsPromises = exam_details.map(async (exam, index) => {
        const examDocument = examDocuments ? examDocuments[index] : null;

        // Create the exam record
        const createdExam = await db.userExams.create({
          // student_id: userPrimaryInfo.id,
          student_id: user_id,
          exam_name: exam.exam_name,
          marks: exam.marks,
          document: examDocument ? examDocument.filename : null, // Save the filename of the uploaded document
        }, { transaction });

        return createdExam;
      });

      await Promise.all(examDetailsPromises);
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
    course_fee
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