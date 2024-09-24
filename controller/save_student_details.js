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
  addOrUpdateGraduationData,
} = require("../utils/academic_query_helper");
const { deleteFile } = require("../utils/upsert_helpers");

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
// REF
exports.saveStudentAcademicInfo = async (req, res) => {
  let { academicRecords, exam_details, user_id } = req.body;

  // Ensure the exam documents are handled correctly
  const files = req.files?.exam_documents || [];

  // Check if there is any data to process
  const hasAcademicData = academicRecords && academicRecords.length > 0;
  const hasExamData = exam_details && exam_details.length > 0;

  console.log("EXAMS ===> ", exam_details);

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

  // Start a transaction
  const transaction = await sequelize.transaction();

  const files = req.files;

  // Debugging information
  console.log("workExperience", workExperience);
  console.log("Files data:", files);

  if (!user_id || !Array.isArray(workExperience) || !files) {
    throw new Error("Invalid input data");
  }

  const modifiedData = [];

  // Iterate over graduation details
  workExperience.forEach((item, index) => {
    const fields = [
      "appointment_document",
      "bank_statement",
      "job_offer_document",
      "payslip_document",
    ];

    const isUpdate = item?.id !== "0";

    const itemData = {
      id: item.id,
      company: item.company,
      years: Number(item.years),
      designation: item.designation,
      from: item.from,
      to: item.to,
      user_id: Number(user_id),
    };

    fields.forEach((field) => {
      const fieldName = `workExperience[${index}][${field}]`;
      const file = files.find((file) => file.fieldname === fieldName);

      if (!isUpdate || (isUpdate && file)) {
        // Only add field if it's not an update or if a new file is provided
        itemData[field] = file ? file.filename : null;
      }
    });

    // Push the item data to the modifiedData array
    modifiedData.push(itemData);
  });

  console.log("Modified data:", modifiedData);

  try {
    const workResult = await addOrUpdateWork(modifiedData, transaction);

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

    // Determine the type of record to delete
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
      case "studyPreference":
        record = await db.studyPreferenceDetails.findByPk(id);
        message = "Study preference record";
        break;
      case "graduation":
        record = await db.graduationDetails.findByPk(id);
        message = "Graduation record";
        break;
      default:
        throw new Error("Invalid type specified");
    }

    // If the record is not found, throw an error
    if (!record) {
      throw new Error(`${message} not found`);
    }

    // If the record is of type 'exam', delete the associated document
    if (type == "exam") {
      const file = record.score_card;
      if (file) {
        deleteFile("examDocuments", file);
      }
    }

    // If the record is of type 'graduation', delete multiple associated documents
    if (type == "graduation") {
      const fileFields = [
        "certificate",
        "admit_card",
        "registration_certificate",
        "backlog_certificate",
        "grading_scale_info",
      ];

      fileFields.forEach((field) => {
        const docName = record[field];
        if (docName) {
          deleteFile("graduationDocuments", docName);
        }
      });
    }

    if (type == "work") {
      const fileFields = [
        "appointment_document",
        "bank_statement",
        "job_offer_document",
        "payslip_document",
      ];

      fileFields.forEach((field) => {
        const docName = record[field];
        if (docName) {
          deleteFile("workDocuments", docName);
        }
      });
    }

    // Proceed with the deletion of the record from the database
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

exports.saveStudentPrimaryEducation = async (req, res) => {
  const { student_id, primary, secondary, operation } = req.body;

  const transaction = await sequelize.transaction();

  try {
    if (!student_id) {
      await transaction.rollback();
      return res.status(400).json({ error: "Student ID is required" });
    }

    const student = await db.userPrimaryInfo.findByPk(student_id);
    if (!student) {
      await transaction.rollback();
      return res.status(404).json({ error: "Student not found" });
    }

    const { type } = req.params;
    if (!type || (type !== "primary" && type !== "secondary")) {
      await transaction.rollback();
      return res.status(400).json({ error: "Invalid type provided" });
    }

    const formData = type === "primary" ? primary : secondary;
    if (!formData) {
      await transaction.rollback();
      return res.status(400).json({ error: `${type} details are required` });
    }

    const filePaths = {
      mark_sheet: req.files[`${type}_mark_sheet`]
        ? req.files[`${type}_mark_sheet`][0].filename
        : null,
      certificate: req.files[`${type}_certificate`]
        ? req.files[`${type}_certificate`][0].filename
        : null,
      admit_card: req.files[`${type}_admit_card`]
        ? req.files[`${type}_admit_card`][0].filename
        : null,
    };

    const saveOrUpdateEducationDetails = async () => {
      if (operation === "add") {
        // Add new education details
        await student.createEducationDetail(
          {
            qualification: formData.qualification,
            start_date: formData.startDate,
            end_date: formData.endDate,
            percentage: formData.percentage,
            mark_sheet: filePaths.mark_sheet,
            admit_card: filePaths.admit_card,
            certificate: filePaths.certificate,
          },
          { transaction }
        );

        return res
          .status(201)
          .json({ message: "Education details added successfully" });
      } else if (operation === "update") {
        // Update existing education details
        const existingDetails = await db.educationDetails.findOne({
          where: { student_id, qualification: formData.qualification },
        });

        if (!existingDetails) {
          await transaction.rollback();
          return res.status(404).json({ error: "Education details not found" });
        }

        await existingDetails.update(
          {
            start_date: formData.startDate,
            end_date: formData.endDate,
            percentage: formData.percentage,
            mark_sheet: filePaths.mark_sheet || existingDetails.mark_sheet,
            admit_card: filePaths.admit_card || existingDetails.admit_card,
            certificate: filePaths.certificate || existingDetails.certificate,
          },
          {
            transaction,
          }
        );

        return res.status(200).json({
          message: "Education details updated successfully",
          status: true,
        });
      } else {
        await transaction.rollback();
        return res.status(400).json({ error: "Invalid operation" });
      }
    };

    await saveOrUpdateEducationDetails();
    await transaction.commit();
  } catch (error) {
    console.error("Error saving education details:", error);
    await transaction.rollback();
    res.status(500).json({ error: "Failed to save education details" });
  }
};

exports.studentPrimaryEducationDetails = async (req, res) => {
  try {
    const { student_id } = req.params;

    // Fetch student primary info and related details in parallel
    const [student, graduationDetails] = await Promise.all([
      db.userPrimaryInfo.findByPk(student_id, {
        include: [
          {
            model: db.educationDetails,
            as: "educationDetails",
          },
        ],
      }),
      db.userPrimaryInfo.findByPk(student_id, {
        include: [
          {
            model: db.graduationDetails,
            as: "graduationDetails",
          },
        ],
      }),
    ]);

    // Check if the student exists
    if (!student) {
      return res.status(404).json({
        status: false,
        message: "Student not found",
      });
    }

    console.log(graduationDetails.graduationDetails);
    console.log(student.educationDetails);

    // Retrieve primary and secondary education details
    const educationDetails = student.educationDetails;
    const graduationData = graduationDetails.graduationDetails;

    let primaryDetails = null;
    let secondaryDetails = null;

    // Assuming "primary" and "secondary" qualifications are stored in the `qualification` field
    educationDetails.forEach((detail) => {
      const formattedDetail = {
        id: detail?.id,
        startDate: detail?.start_date,
        endDate: detail?.end_date,
        qualification: detail?.qualification,
        percentage: detail?.percentage,
        certificate: detail?.certificate || null,
        mark_sheet: detail?.mark_sheet || null,
        admit_card: detail?.admit_card || null,
      };

      if (detail.qualification.toLowerCase() === "10th") {
        primaryDetails = formattedDetail;
      } else if (detail.qualification.toLowerCase() === "plustwo") {
        secondaryDetails = formattedDetail;
      }
    });

    // Format graduation details if available
    const graduationDetailsFormatted = graduationData.map((detail) => {
      return {
        id: detail?.id,
        start_date: detail?.start_date,
        end_date: detail?.end_date,
        qualification: detail?.qualification,
        percentage: detail?.percentage,
        certificate: detail?.certificate || null,
        registration_certificate: detail?.registration_certificate || null,
        backlog_certificate: detail?.backlog_certificate || null,
        grading_scale_info: detail?.grading_scale_info || null,
        admit_card: detail?.admit_card || null,
        conversion_formula: detail?.conversion_formula || "",
      };
    });

    // Respond with formatted education details
    return res.status(200).json({
      status: true,
      primary: primaryDetails,
      secondary: secondaryDetails,
      graduation: graduationDetailsFormatted, // Corrected response key
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.saveStudentGraduationDetails = async (req, res) => {
  const transaction = await sequelize.transaction(); // Start a transaction

  try {
    const { student_id, graduation } = req.body;
    const files = req.files;

    console.log(student_id);

    // Debugging information
    console.log("Graduation data:", graduation);
    console.log("Files data:", files);

    if (!student_id || !Array.isArray(graduation) || !files) {
      throw new Error("Invalid input data");
    }

    const modifiedData = [];

    // Iterate over graduation details
    graduation.forEach((item, index) => {
      const fields = [
        "certificate",
        "admit_card",
        "registration_certificate",
        "backlog_certificate",
        "grading_scale_info",
      ];

      const isUpdate = item?.id !== "0";

      const itemData = {
        id: item.id,
        start_date: item.start_date,
        end_date: item.end_date,
        percentage: Number(item.percentage),
        conversion_formula: item.conversion_formula,
        qualification: item.qualification,
        student_id: Number(student_id),
      };

      fields.forEach((field) => {
        const fieldName = `graduation[${index}][${field}]`;
        const file = files.find((file) => file.fieldname === fieldName);

        if (!isUpdate || (isUpdate && file)) {
          // Only add field if it's not an update or if a new file is provided
          itemData[field] = file ? file.filename : null;
        }
      });

      // Push the item data to the modifiedData array
      modifiedData.push(itemData);
    });

    console.log("Modified data:", modifiedData);

    // Add or update graduation data with transaction
    await addOrUpdateGraduationData(modifiedData, transaction);

    // Commit the transaction
    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "Success",
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Rollback the transaction if an error occurs
    await transaction.rollback();
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
