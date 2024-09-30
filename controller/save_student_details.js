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
  addOrUpdateGraduationData,
  addOrUpdateExamData,
} = require("../utils/academic_query_helper");
const { deleteFile, handleFileDeletions } = require("../utils/upsert_helpers");

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
  let { academicRecords, user_id } = req.body;

  // Check if there is any data to process
  const hasAcademicData = academicRecords && academicRecords.length > 0;

  if (!hasAcademicData) {
    return res.status(400).json({
      status: false,
      message: "No academic or exam data provided to save.",
    });
  }

  const records = academicRecords.map((record) => ({
    ...record,
    year_of_passing: Number(record.year_of_passing),
    backlogs: Number(record.backlogs),
    user_id: user_id,
  }));

  // Start a transaction only if there is data to process
  const transaction = await sequelize.transaction();

  try {
    const academicResult = await addOrUpdateAcademic(records, transaction);

    if (academicResult.success) {
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

exports.saveStudentExamInfo = async (req, res) => {
  let { examRecords, user_id } = req.body;

  const updated_by = req.userDecodeId;

  // Check if there is any data to process
  const hasExamData = examRecords && examRecords.length > 0;

  if (!hasExamData) {
    return res.status(400).json({
      status: false,
      message: "No exam data provided to save.",
    });
  }

  const records = [];
  const files = req.files;
  const field = "score_card";

  examRecords.forEach((record, index) => {
    const isUpdate = record?.id !== "0";
    const itemData = {
      id: record.id,
      exam_type: record.exam_type,
      listening_score: Number(record.listening_score),
      speaking_score: Number(record.speaking_score),
      reading_score: Number(record.reading_score),
      writing_score: Number(record.writing_score),
      overall_score: Number(record.overall_score),
      exam_date: record.exam_date,
      student_id: Number(user_id),
    };

    const fieldName = `examRecords[${index}][${field}]`;
    const file = files.find((file) => file.fieldname === fieldName);
    if (!isUpdate || (isUpdate && file)) {
      itemData[field] = file ? file.filename : null;
    }

    if (!isUpdate) {
      itemData.updated_by = updated_by;
    }

    records.push(itemData);
  });

  const transaction = await sequelize.transaction();
  try {
    const examResult = await addOrUpdateExamData(records, transaction);
    if (examResult.success) {
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
    console.error(`Error updating exam records: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.saveStudentWorkInfo = async (req, res) => {
  let { workExperience, user_id } = req.body;

  // Start a transaction

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
  const transaction = await sequelize.transaction();

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

  // Define a mapping object to eliminate switch statement
  const recordTypeMapping = {
    academic: { model: db.academicInfos, message: "Academic record" },
    work: { model: db.workInfos, message: "Work record" },
    exam: { model: db.userExams, message: "Exam record" },
    studyPreference: {
      model: db.studyPreferenceDetails,
      message: "Study preference record",
    },
    graduation: { model: db.graduationDetails, message: "Graduation record" },
    fund: { model: db.fundPlan, message: "Fund plan record" },
    gap: { model: db.gapReason, message: "Gap reason record" },
  };

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    // Validate if the type exists in the mapping
    const recordType = recordTypeMapping[type];
    if (!recordType) {
      return res
        .status(400)
        .json({ status: false, message: "Invalid type specified" });
    }

    // Fetch the record
    const record = await recordType.model.findByPk(id);
    if (!record) {
      return res
        .status(404)
        .json({ status: false, message: `${recordType.message} not found` });
    }

    // Handle file deletions
    await handleFileDeletions(type, record);

    // Proceed with the deletion of the record from the database
    await record.destroy({ transaction });

    // Commit the transaction
    await transaction.commit();
    console.log(`${recordType.message} with id:${id} successfully deleted`);

    return res.status(200).json({
      status: true,
      message: `${recordType.message} successfully deleted`,
    });
  } catch (error) {
    // Rollback the transaction if any error occurs
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

  console.log(primary);
  console.log(secondary);
  console.log(operation);

  // Start the transaction
  const transaction = await sequelize.transaction();

  try {
    // Validate the student ID
    if (!student_id) {
      await transaction.rollback();
      return res.status(400).json({ error: "Student ID is required" });
    }

    // Check if the student exists
    const student = await db.userPrimaryInfo.findByPk(student_id);
    if (!student) {
      await transaction.rollback();
      return res.status(404).json({ error: "Student not found" });
    }

    // Validate the type (either primary or secondary)
    const { type } = req.params;
    if (!type || (type !== "primary" && type !== "secondary")) {
      await transaction.rollback();
      return res.status(400).json({ error: "Invalid type provided" });
    }

    // Extract the correct form data based on the type
    const formData = type === "primary" ? primary : secondary;
    console.log(formData);

    if (!formData) {
      await transaction.rollback();
      return res.status(400).json({ error: `${type} details are required` });
    }

    // Handle file paths from uploaded files
    const filePaths = {
      mark_sheet: req.files?.[`${type}_mark_sheet`]?.[0]?.filename || null,
      certificate: req.files?.[`${type}_certificate`]?.[0]?.filename || null,
      admit_card: req.files?.[`${type}_admit_card`]?.[0]?.filename || null,
    };

    // Save or update education details function
    const saveOrUpdateEducationDetails = async () => {
      if (operation === "add") {
        console.log("HERE ADD");

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

        await transaction.commit();

        return res.status(201).json({
          status: true,
          message: "Education details added successfully",
        });
      } else if (operation === "update") {
        console.log("HERE UPDATE");
        // Find existing education details
        const existingDetails = await db.educationDetails.findOne({
          where: { student_id, qualification: formData.qualification },
        });

        if (!existingDetails) {
          await transaction.rollback();
          return res.status(404).json({ error: "Education details not found" });
        }

        // Temporarily store paths of old files for deletion after update
        const oldFilePaths = {
          mark_sheet: filePaths.mark_sheet ? existingDetails.mark_sheet : null,
          admit_card: filePaths.admit_card ? existingDetails.admit_card : null,
          certificate: filePaths.certificate
            ? existingDetails.certificate
            : null,
        };

        // Update the existing details in the database
        await existingDetails.update(
          {
            start_date: formData.startDate,
            end_date: formData.endDate,
            percentage: formData.percentage,
            mark_sheet: filePaths.mark_sheet || existingDetails.mark_sheet,
            admit_card: filePaths.admit_card || existingDetails.admit_card,
            certificate: filePaths.certificate || existingDetails.certificate,
          },
          { transaction }
        );

        // Commit the transaction to ensure database consistency
        await transaction.commit();

        // After transaction is successful, delete old files safely
        const deleteFiles = async () => {
          const filesToDelete = ["mark_sheet", "admit_card", "certificate"];
          for (const fileField of filesToDelete) {
            if (oldFilePaths[fileField]) {
              try {
                await deleteFile("educationDocuments", oldFilePaths[fileField]);
              } catch (err) {
                console.error(
                  `Failed to delete old file ${oldFilePaths[fileField]}:`,
                  err
                );
              }
            }
          }
        };

        await deleteFiles(); // Safe to delete files after committing transaction

        return res.status(200).json({
          message: "Education details updated successfully",
          status: true,
        });
      } else {
        await transaction.rollback();
        return res.status(400).json({ error: "Invalid operation" });
      }
    };

    // Call the function to save or update education details
    await saveOrUpdateEducationDetails();
  } catch (error) {
    console.error("Error saving education details:", error);
    await transaction.rollback();
    return res.status(500).json({ error: "Failed to save education details" });
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
