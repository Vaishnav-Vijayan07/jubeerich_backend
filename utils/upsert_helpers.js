const path = require("path");
const fs = require("fs");

const batchUpsertData = async (
  model,
  records,
  transaction,
  fileFields,
  fileDirectory
) => {
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
      const { id, ...recordWithOutId } = record;
      addPromises.push(model.create(recordWithOutId, { transaction }));
    } else {
      const existingRecord = existingRecords.find((r) => r.id == record.id);
      if (existingRecord) {
        const updateFields = {};
        Object.keys(record).forEach((key) => {
          if (key !== "id") {
            // Handle date fields separately
            if (
              record[key] instanceof Date ||
              existingRecord[key] instanceof Date
            ) {
              // Compare date fields using the helper
              if (!areDatesEqual(record[key], existingRecord[key])) {
                updateFields[key] = record[key];
              }
            } else if (record[key] !== existingRecord[key]) {
              updateFields[key] = record[key];
            }
          }
        });

        console.log("UPDATE FIELDS", updateFields);

        if (Object.keys(updateFields).length > 0) {
          // Loop through each file-related field
          if (fileFields) {
            fileFields.forEach((field) => {
              if (Object.keys(updateFields).includes(field)) {
                const docName = existingRecord[field];
                deleteFile(fileDirectory, docName);
              }
            });
          }

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

const areDatesEqual = (date1, date2) => {
  return (
    new Date(date1).toISOString().split("T")[0] ===
    new Date(date2).toISOString().split("T")[0]
  );
};

const deleteFile = (directory, fileName) => {
  if (!fileName) return;

  const filePath = path.join(__dirname, "..", "uploads", directory, fileName);

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
};

const handleFileDeletions = async (type, record) => {
  const fileDeletionMapping = {
    exam: ["score_card"],
    fund: ["supporting_document"],
    gap: ["supporting_document"],
    graduation: [
      "certificate",
      "admit_card",
      "registration_certificate",
      "backlog_certificate",
      "grading_scale_info",
    ],
    work: [
      "appointment_document",
      "bank_statement",
      "job_offer_document",
      "payslip_document",
    ],
  };

  const filesToDelete = fileDeletionMapping[type] || [];

  filesToDelete.forEach((field) => {
    const fileName = record[field];
    if (fileName) {
      deleteFile(`${type}Documents`, fileName);
    }
  });
};

module.exports = { batchUpsertData, deleteFile, handleFileDeletions };
