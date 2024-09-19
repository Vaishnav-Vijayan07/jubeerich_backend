const db = require("../models");
const path = require("path");
const fs = require("fs");

const batchUpsert = async (model, records, transaction) => {
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
          updatePromises.push(
            existingRecord.update(updateFields, { transaction })
          );
        }
      }
    }
  });

  await Promise.all([...addPromises, ...updatePromises]);
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
          if (Object.keys(updateFields).includes("document")) {
            const docName = existingRecord.document;
            console.log(docName);

            const filePath = path.join(
              __dirname,
              "..",
              "uploads",
              "examDocuments",
              docName
            );
            if (fs.existsSync(filePath)) {
              fs.unlink(filePath, (err) => {
                if (err) {
                  console.error(`Failed to delete file: ${filePath}`);
                } else {
                  console.log(`Successfully deleted file: ${filePath}`);
                }
              });
            }
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
  console.log(records);

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

  console.log("RECORDS =====>", records);

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

        const fileFields = [
          "certificate",
          "admit_card",
          "registration_certificate",
          "backlog_certificate",
          "grading_scale_info",
        ];

        if (Object.keys(updateFields).length > 0) {
          // Loop through each file-related field
          fileFields.forEach((field) => {
            if (Object.keys(updateFields).includes(field)) {
              const docName = existingRecord[field];
              const filePath = path.join(
                __dirname,
                "..",
                "uploads",
                "graduationDocuments",
                docName
              );

              // Check if the file exists before attempting to delete
              if (fs.existsSync(filePath)) {
                fs.unlink(filePath, (err) => {
                  if (err) {
                    console.error(`Failed to delete file: ${filePath}`, err);
                  } else {
                    console.log(`Successfully deleted file: ${filePath}`);
                  }
                });
              }
            }
          });

          // Push the update operation into the updatePromises array
          updatePromises.push(
            existingRecord.update(updateFields, { transaction })
          );
        }
      }
    }
  });

  await Promise.all([...addPromises, ...updatePromises]);
};

const addOrUpdateAcademic = async (academicRecords, userId, transaction) => {
  const records = academicRecords.map((record) => ({
    ...record,
    year_of_passing: Number(record.year_of_passing),
    backlogs: Number(record.backlogs),
    user_id: userId,
  }));

  console.log("ACAD Record", records);

  try {
    await batchUpsert(db.academicInfos, records, transaction);
    return { success: true };
  } catch (error) {
    console.log(error);

    throw new Error(`Academic Update Failed: ${error.message}`);
  }
};

const addOrUpdateExamDocs = async (examRecords, userId, files, transaction) => {
  const records = examRecords.map((record) => {
    // Find the file associated with the current record
    const fileitem = files?.find(
      (file) => file.originalname === record.document
    );

    console.log(files);
    console.log(fileitem);

    // If a file is found, update the document field with the file's filename
    if (fileitem) {
      return {
        ...record,
        document: fileitem.filename, // Update with the actual file name
        marks: Number(record.marks), // Ensure marks is a number
        student_id: Number(userId), // Add the user ID
      };
    }

    // If no file is found, return the record as is, but ensure marks is a number
    return {
      ...record,
      marks: Number(record.marks), // Ensure marks is a number
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

const addOrUpdateWork = async (workRecords, userId, transaction) => {
  const records = workRecords.map((record) => ({
    ...record,
    years: Number(record.years),
    user_id: userId,
  }));

  console.log("WORK Record", records);
  try {
    await batchUpsert(db.workInfos, records, transaction);
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

module.exports = {
  addOrUpdateAcademic,
  addOrUpdateWork,
  addOrUpdateExamDocs,
  addOrUpdateStudyPreference,
  addOrUpdateGraduationData,
};
