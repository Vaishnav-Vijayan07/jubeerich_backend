const db = require("../models");
const { batchUpsertData } = require("./upsert_helpers");

const batchUpsertAcademicInfo = async (model, records, transaction) => {
  const fileFields = null;
  return batchUpsertData(model, records, transaction, fileFields, "");
};

const batchUpsertStudyPreference = async (model, records, transaction) => {
  const ids = records.map((record) => record.id).filter((id) => id !== "0");

  // Fetch all existing records that need updating within the same transaction
  const existingRecords = await model.findAll({
    where: { id: ids },
    transaction, // Include the transaction here
  });

  const updatePromises = [];
  const addPromises = [];

  records.forEach((record) => {
    if (record.id == 0) {
      // For new records (id = "0"), we handle the creation phase here
      const { id, ...recordWithoutId } = record;

      // Create new records using the model.create() method
      addPromises.push(
        model.create(
          {
            studyPreferenceId: recordWithoutId.studyPreferenceId,
            universityId: recordWithoutId.universityId,
            campusId: recordWithoutId.campusId,
            courseTypeId: recordWithoutId.courseTypeId,
            streamId: recordWithoutId.streamId,
            courseId: recordWithoutId.courseId,
            intakeYear: recordWithoutId.intakeYear,
            intakeMonth: recordWithoutId.intakeMonth,
            estimatedBudget: recordWithoutId.estimatedBudget,
          },
          { transaction } // Pass the transaction for creation
        )
      );
    } else {
      const existingRecord = existingRecords.find((r) => r.id == record.id);
      if (existingRecord) {
        const updateFields = {};
        Object.keys(record).forEach((key) => {
          if (key !== "id" && record[key] !== existingRecord[key]) {
            updateFields[key] = record[key];
          }
        });

        console.log("UPDATE FIELDS: ", updateFields);

        // Add update logic if there are changes
        if (Object.keys(updateFields).length > 0) {
          updatePromises.push(
            existingRecord.update(updateFields, { transaction }) // Include the transaction for updates
          );
        }
      }
    }
  });

  // Execute the add and update operations in parallel
  await Promise.all([...addPromises, ...updatePromises]);
};

const batchUpsertExamDocs = async (model, records, transaction) => {
  const ids = records.map((record) => record.id).filter((id) => id !== "0");

  console.log(ids);

  // Fetch all existing records that need updating
  const existingRecords = await model.findAll({
    where: { id: ids },
    transaction,
  });

  console.log(existingRecords);

  const updatePromises = [];
  const addPromises = [];

  records.forEach((record) => {
    if (record.id === "0") {
      const { id, ...recordWithOutid } = record;
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
          if (Object.keys(updateFields).includes("score_card")) {
            const docName = existingRecord.score_card;
            console.log(docName);
            deleteFile("examDocuments", docName);
          }

          updatePromises.push(
            existingRecord.update(updateFields, { transaction })
          );
        }
      }
    }
  });

  await Promise.all([...addPromises, ...updatePromises]);
};

const batchUpsertGraduationData = async (model, records, transaction) => {
  const fileFields = [
    "certificate",
    "admit_card",
    "registration_certificate",
    "backlog_certificate",
    "grading_scale_info",
  ];

  return batchUpsertData(
    model,
    records,
    transaction,
    fileFields,
    "graduationDocuments"
  );
};

const batchUpsertWorkData = async (model, records, transaction) => {
  const fileFields = [
    "appointment_document",
    "bank_statement",
    "job_offer_document",
    "payslip_document",
    "experience_certificate",
  ];

  return batchUpsertData(
    model,
    records,
    transaction,
    fileFields,
    "workDocuments"
  );
};

const batchUpsertFundData = async (model, records, transaction) => {
  const fileFields = ["supporting_document"];

  return batchUpsertData(
    model,
    records,
    transaction,
    fileFields,
    "fundDocuments"
  );
};

const batchUpsertGapReasonData = async (model, records, transaction) => {
  const fileFields = ["supporting_document"];

  return batchUpsertData(
    model,
    records,
    transaction,
    fileFields,
    "gapDocuments"
  );
};
const batchUpsertExamData = async (model, records, transaction) => {
  const fileFields = ["score_card"];

  return batchUpsertData(
    model,
    records,
    transaction,
    fileFields,
    "examDocuments"
  );
};

const addOrUpdateAcademic = async (academicRecords, transaction) => {
  try {
    await batchUpsertAcademicInfo(
      db.academicInfos,
      academicRecords,
      transaction
    );
    return { success: true };
  } catch (error) {
    console.log(error);

    throw new Error(`Academic Update Failed: ${error.message}`);
  }
};

const addOrUpdateExamDocs = async (examRecords, userId, files, transaction) => {
  console.log("files ==>", files);

  const records = examRecords.map((record) => {
    // Find the file associated with the current record
    const fileitem = files?.find(
      // (file) => file.originalname === record.document
      (file) => file.originalname === record.score_card
    );

    console.log(files);
    console.log("fileitem===>", fileitem);

    // If a file is found, update the document field with the file's filename
    if (fileitem) {
      return {
        ...record,
        score_card: fileitem.filename, // Update with the actual file name
        student_id: Number(userId), // Add the user ID
      };
    }

    return {
      ...record,
      student_id: Number(userId), // Add the user ID
    };
  });

  console.log("Exam Record", records);

  try {
    await batchUpsertExamDocs(db.userExams, records, transaction);
    return { success: true };
  } catch (error) {
    console.log(error);

    throw new Error(`Academic Update Failed: ${error.message}`);
  }
};

const addOrUpdateWork = async (workRecords, transaction) => {
  console.log("WORK Record", workRecords);
  try {
    await batchUpsertWorkData(db.workInfos, workRecords, transaction);
    return { success: true };
  } catch (error) {
    console.log(error);
    throw new Error(`Work Experience Update Failed: ${error.message}`);
  }
};

const addOrUpdateStudyPreference = async (
  studyPreferenceRecords,
  studyPreferenceId,
  transaction
) => {
  // Map records to include the studyPreferenceId
  const records = studyPreferenceRecords.map((record) => ({
    ...record,
    studyPreferenceId,
  }));

  console.log("STUDY RECORDS", records);

  try {
    await batchUpsertStudyPreference(
      db.studyPreferenceDetails,
      records,
      transaction
    );
    return { success: true };
  } catch (error) {
    console.log(error);
    throw new Error(`Study preference operation Failed: ${error.message}`);
  }
};

const addOrUpdateGraduationData = async (graduationDetails, transaction) => {
  try {
    await batchUpsertGraduationData(
      db.graduationDetails,
      graduationDetails,
      transaction
    );
    return { success: true };
  } catch (error) {
    console.log(error);

    throw new Error(`Graduation Update Failed: ${error.message}`);
  }
};

const addOrUpdateFundData = async (fundDetails, transaction) => {
  try {
    await batchUpsertFundData(db.fundPlan, fundDetails, transaction);
    return { success: true };
  } catch (error) {
    console.log(error);

    throw new Error(`Graduation Update Failed: ${error.message}`);
  }
};

const addOrUpdateGapReasonData = async (gapReasons, transaction) => {
  try {
    await batchUpsertGapReasonData(db.gapReason, gapReasons, transaction);
    return { success: true };
  } catch (error) {
    console.log(error);

    throw new Error(`Gap Reason Update Failed: ${error.message}`);
  }
};

const addOrUpdateExamData = async (examRecords, transaction) => {
  try {
    await batchUpsertExamData(db.userExams, examRecords, transaction);
    return { success: true };
  } catch (error) {
    console.log(error);

    throw new Error(`Gap Reason Update Failed: ${error.message}`);
  }
};

module.exports = {
  addOrUpdateAcademic,
  addOrUpdateWork,
  addOrUpdateExamDocs,
  addOrUpdateStudyPreference,
  addOrUpdateGraduationData,
  addOrUpdateFundData,
  addOrUpdateGapReasonData,
  addOrUpdateExamData,
};
