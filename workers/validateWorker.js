const db = require("../models");

module.exports = async function processBatch(batch) {
  const { rows, meta } = batch;
  
  const transaction = await db.sequelize.transaction();

  const errors = [];
  const validData = [];
  const seen = new Set();

  rows.forEach((row, index) => {
    const validationErrors = validateRowData(row);
    const rowNumber = meta.startRow + index;

    if (validationErrors.length > 0) {
      errors.push({ rowNumber, rowData: row?.rowData, errors: validationErrors });
    } else if (!seen.has(row?.rowData?.email) && !seen.has(row?.rowData?.phone)) {
      seen.add(row?.rowData?.email);
      seen.add(row?.rowData?.phone);
      validData.push(row);
    } else {
      errors.push({ rowNumber, rowData: row?.rowData, errors: 'Duplicate email or phone found on the sheet' });
    }
  });
  return { errors, validData };
};

const validateRowData = (data) => {
  const errors = [];

  if (!data?.rowData?.full_name) errors.push("Full name is required");
  if (!data?.rowData?.email) errors.push("Email is required");
  if (!data?.rowData?.phone) errors.push("Phone is required");
  if (!data?.rowData?.source_id) errors.push("Invalid source");
  if (!data?.rowData?.channel_id) errors.push("Invalid channel");
  if (!data?.rowData?.office_type) errors.push("Invalid office type");
  if (!data?.rowData?.preferred_country) errors.push("Invalid country");

  return errors;
};