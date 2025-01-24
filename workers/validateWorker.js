module.exports = async function processBatch(batch) {
    const { rows, meta, userDecodeId, role, creTLrole } = batch;
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
    console.log('validData', validData);
    console.log('errors', errors);
  
    return { errors, validData };
  };