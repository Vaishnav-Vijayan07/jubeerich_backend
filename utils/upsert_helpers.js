const path = require("path");
const fs = require("fs");
// fileHelper.js
const fspromises = require("fs").promises; // Use promises for async/await

const batchUpsertData = async (
  model,
  records,
  transaction,
  fileFields,
  fileDirectory
) => {

  const ids = records.map((record) => record.id).filter((id) => id !== "0");


  // Fetch all existing records that need updating
  const existingRecords = await model.findAll({
    where: { id: ids },
    transaction,
  });


  const updatePromises = [];
  const addPromises = [];


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

const deleteFile = async (directory, fileName) => {
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
      "transcript",
      "individual_marksheet",
    ],
    work: [
      "appointment_document",
      "bank_statement",
      "job_offer_document",
      "payslip_document",
      "experience_certificate",
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

const deleteUnwantedFiles = async (dirPath, filesToKeep) => {
  try {
    // Use a Set for faster lookup
    const filesToKeepSet = new Set(filesToKeep);

    // Read all files in the specified directory
    const files = await fspromises.readdir(dirPath);

    // Prepare deletion promises
    const deletePromises = files
      .filter((file) => !filesToKeepSet.has(file)) // Filter files not in the Set
      .map(async (file) => {
        const filePath = path.join(dirPath, file);
        try {
          await fspromises.unlink(filePath); // Delete the file
          return console.log(`Deleted file: ${filePath}`);
        } catch (err) {
          return console.error(
            `Failed to delete file: ${filePath} - ${err.message}`
          );
        }
      });

    // Wait for all deletions to complete
    await Promise.all(deletePromises);
    console.log("All unwanted files deleted successfully.");
  } catch (err) {
    console.error(`Error processing the directory: ${err.message}`);
  }
};

module.exports = {
  batchUpsertData,
  deleteFile,
  handleFileDeletions,
  deleteUnwantedFiles,
};
