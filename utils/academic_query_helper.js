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

module.exports = {
  addOrUpdateAcademic,
  addOrUpdateWork,
  addOrUpdateExamDocs,
};
