const Excel = require("exceljs");
const db = require("../models");
const Source = db.leadSource;
const Channel = db.leadChannel;
const AdminUsers = db.adminUsers;
const OfficeType = db.officeType;
const UserPrimaryInfo = db.userPrimaryInfo;
const UserCountries = db.userContries; // Import the UserCountries model
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

exports.bulkUpload = async (req, res) => {
  try {
    const userId = req.userDecodeId;
    const workbook = new Excel.Workbook();
    const fileName = `${uuidv4()}.xlsx`; // Generate a unique file name
    const filePath = path.join('uploads', fileName);

    // Save the uploaded file to local storage
    fs.writeFileSync(filePath, req.file.buffer);

    await workbook.xlsx.load(req.file.buffer);
    const jsonData = [];
    const invalidRows = [];
    const seenEntries = new Set(); // Track seen entries to detect duplicates

    const sources = await Source.findAll();
    const channels = await Channel.findAll();
    const officeTypes = await OfficeType.findAll();
    const creTl = await AdminUsers.findOne({ where: { role_id: 4 } });  // Find the user_id of cre_tl

    const sourceSlugToId = sources.reduce((acc, source) => {
      acc[source.slug] = source.id;
      return acc;
    }, {});

    const channelSlugToId = channels.reduce((acc, channel) => {
      acc[channel.slug] = channel.id;
      return acc;
    }, {});

    const officeTypeSlugToId = officeTypes.reduce((acc, officeType) => {
      acc[officeType.slug] = officeType.id;
      return acc;
    }, {});

    // Query existing records from the database
    const existingRecords = await UserPrimaryInfo.findAll({
      attributes: ["email", "phone"],
    });

    const existingEmails = new Set(
      existingRecords.map((record) => record.email)
    );
    const existingPhones = new Set(
      existingRecords.map((record) => record.phone)
    );

    const rowPromises = []; // Collect row processing promises

    workbook.eachSheet((worksheet) => {
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          rowPromises.push((async () => {
            const sourceSlug = row.getCell(3).value;
            const channelSlug = row.getCell(4).value;
            const officeTypeSlug = row.getCell(9).value;

            const email = row.getCell(6).value;
            const phone = row.getCell(7).value;

            const emailKey = email || "";
            const phoneKey = phone || "";

            // Handle preferred_country, ensuring it can be a single ID or comma-separated list
            let preferred_country = row.getCell(10).value;
            if (typeof preferred_country === 'string') {
              preferred_country = preferred_country.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
            } else {
              preferred_country = [parseInt(preferred_country, 10)].filter(id => !isNaN(id));
            }

            const rowData = {
              lead_received_date: row.getCell(2).value,
              source_id: sourceSlugToId[sourceSlug] || null,
              channel_id: channelSlugToId[channelSlug] || null,
              full_name: row.getCell(5).value,
              email,
              phone,
              city: row.getCell(8).value,
              office_type: officeTypeSlugToId[officeTypeSlug] || null,
              preferred_country,
              ielts: row.getCell(11).value,
              remarks: row.getCell(12).value,
              source_slug: sourceSlug,
              channel_slug: channelSlug,
              office_type_slug: officeTypeSlug,
              assigned_cre_tl: creTl ? creTl.id : null,
              created_by: userId
            };

            const errors = validateRowData(rowData);

            // Check for duplicates within the file
            if (seenEntries.has(emailKey)) {
              errors.push(`Duplicate email detected: '${email}' in the file`);
            }
            if (seenEntries.has(phoneKey)) {
              errors.push(`Duplicate phone number detected: '${phone}' in the file`);
            }

            seenEntries.add(emailKey);
            seenEntries.add(phoneKey);

            // Check for existing email or phone in the database
            const emailExists = existingEmails.has(email);
            const phoneExists = existingPhones.has(phone);

            if (emailExists) {
              errors.push(`Email '${email}' already exists in the database`);
            }
            if (phoneExists) {
              errors.push(`Phone number '${phone}' already exists in the database`);
            }

            if (errors.length > 0) {
              invalidRows.push({
                rowNumber,
                errors,
                rowData
              });
            } else {
              jsonData.push(rowData);
            }
          })());
        }
      });
    });

    await Promise.all(rowPromises); // Await all row processing promises

    // Save valid data to UserPrimaryInfo and UserCountries
    if (jsonData.length > 0) {
      const createdUsers = await UserPrimaryInfo.bulkCreate(jsonData, { returning: true });
      
      // Collect user ID and preferred country IDs
      for (const user of createdUsers) {
        const userId = user.id;
        const userJsonData = jsonData.find(data => data.email === user.email);
        const preferredCountries = userJsonData.preferred_country;

        // Create user-countries associations
        const userCountries = preferredCountries.map(countryId => ({
          user_primary_info_id: userId,
          country_id: countryId,
        }));

        if (userCountries.length > 0) {
          await UserCountries.bulkCreate(userCountries);
        }
      }
    }

    // Generate error report
    if (invalidRows.length > 0) {
      const errorWorkbook = new Excel.Workbook();
      const errorSheet = errorWorkbook.addWorksheet("Invalid Rows");

      const originalSheet = workbook.getWorksheet(1);
      const headerRow = originalSheet.getRow(1).values;
      headerRow.push("Errors"); // Add 'Errors' to the end of the header row
      errorSheet.addRow(headerRow);

      invalidRows.forEach(({ rowData, errors }, index) => {
        const errorDetails = errors.join("; ");
        const rowWithErrors = [
          index + 1, // Serial Number
          rowData.lead_received_date,
          rowData.source_slug,
          rowData.channel_slug,
          rowData.full_name,
          rowData.email,
          rowData.phone,
          rowData.city,
          rowData.office_type_slug,
          rowData.preferred_country.join(', '), // Convert array back to comma-separated string for the report
          rowData.ielts,
          rowData.remarks,
          errorDetails,
        ];

        errorSheet.addRow(rowWithErrors);
      });

      const errorFileName = `invalid-rows-${uuidv4()}.xlsx`;
      const errorFilePath = path.join("uploads/rejected_files", errorFileName);
      await errorWorkbook.xlsx.writeFile(errorFilePath);

      return res.status(201).json({
        status: false,
        message: "Some rows contain invalid data",
        errors: invalidRows,
        invalidFileLink: `${errorFilePath}`, // Adjust this if necessary to serve static files
      });
    } else {
      res.status(200).json({
        status: true,
        message: "Data processed and saved successfully",
      });
    }
  } catch (error) {
    console.error(`Error processing bulk upload: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

const validateRowData = (data) => {
  const errors = [];

  if (!data.full_name) errors.push("Full name is required");
  if (!data.email) errors.push("Email is required");
  if (!data.phone) errors.push("Phone is required");
  if (!data.source_id) errors.push("Invalid source");
  if (!data.channel_id) errors.push("Invalid channel");
  if (!data.office_type) errors.push("Invalid office type");
  if (!data.preferred_country || !data.preferred_country.length) errors.push("Preferred country is required");

  return errors;
};


// const Excel = require("exceljs");
// const db = require("../models");
// const Source = db.leadSource;
// const Channel = db.leadChannel;
// const AdminUsers = db.adminUsers;
// const OfficeType = db.officeType;
// const UserPrimaryInfo = db.userPrimaryInfo;
// const fs = require("fs");
// const path = require("path");
// const { v4: uuidv4 } = require("uuid");

// exports.bulkUpload = async (req, res) => {
//   try {
//     const userId = req.userDecodeId;
//     const workbook = new Excel.Workbook();
//     const fileName = `${uuidv4()}.xlsx`; // Generate a unique file name
//     const filePath = path.join('uploads', fileName);

//     // Save the uploaded file to local storage
//     fs.writeFileSync(filePath, req.file.buffer);

//     await workbook.xlsx.load(req.file.buffer);
//     const jsonData = [];
//     const invalidRows = [];
//     const seenEntries = new Set(); // Track seen entries to detect duplicates

//     const sources = await Source.findAll();
//     const channels = await Channel.findAll();
//     const officeTypes = await OfficeType.findAll();
//     const creTl = await AdminUsers.findOne({ where: { role_id: 4 } });  // Find the user_id of cre_tl

//     const sourceSlugToId = sources.reduce((acc, source) => {
//       acc[source.slug] = source.id;
//       return acc;
//     }, {});

//     const channelSlugToId = channels.reduce((acc, channel) => {
//       acc[channel.slug] = channel.id;
//       return acc;
//     }, {});

//     const officeTypeSlugToId = officeTypes.reduce((acc, officeType) => {
//       acc[officeType.slug] = officeType.id;
//       return acc;
//     }, {});

//     // Query existing records from the database
//     const existingRecords = await UserPrimaryInfo.findAll({
//       attributes: ["email", "phone"],
//     });

//     const existingEmails = new Set(
//       existingRecords.map((record) => record.email)
//     );
//     const existingPhones = new Set(
//       existingRecords.map((record) => record.phone)
//     );

//     const rowPromises = []; // Collect row processing promises

//     workbook.eachSheet((worksheet) => {
//       worksheet.eachRow((row, rowNumber) => {
//         if (rowNumber > 1) {
//           rowPromises.push((async () => {
//             const sourceSlug = row.getCell(3).value;
//             const channelSlug = row.getCell(4).value;
//             const officeTypeSlug = row.getCell(9).value;

//             const email = row.getCell(6).value;
//             const phone = row.getCell(7).value;

//             const emailKey = email || "";
//             const phoneKey = phone || "";

//             const rowData = {
//               lead_received_date: row.getCell(2).value,
//               source_id: sourceSlugToId[sourceSlug] || null,
//               channel_id: channelSlugToId[channelSlug] || null,
//               full_name: row.getCell(5).value,
//               email,
//               phone,
//               city: row.getCell(8).value,
//               office_type: officeTypeSlugToId[officeTypeSlug] || null,
//               preferred_country: row.getCell(10).value,
//               ielts: row.getCell(11).value,
//               remarks: row.getCell(12).value,
//               source_slug: sourceSlug,
//               channel_slug: channelSlug,
//               office_type_slug: officeTypeSlug,
//               assigned_cre_tl: creTl ? creTl.id : null,
//               created_by: userId
//             };

//             const errors = validateRowData(rowData);

//             // Check for duplicates within the file
//             if (seenEntries.has(emailKey)) {
//               errors.push(`Duplicate email detected: '${email}' in the file`);
//             }
//             if (seenEntries.has(phoneKey)) {
//               errors.push(`Duplicate phone number detected: '${phone}' in the file`);
//             }

//             seenEntries.add(emailKey);
//             seenEntries.add(phoneKey);

//             // Check for existing email or phone in the database
//             const emailExists = existingEmails.has(email);
//             const phoneExists = existingPhones.has(phone);

//             if (emailExists) {
//               errors.push(`Email '${email}' already exists in the database`);
//             }
//             if (phoneExists) {
//               errors.push(`Phone number '${phone}' already exists in the database`);
//             }

//             if (errors.length > 0) {
//               invalidRows.push({
//                 rowNumber,
//                 errors,
//                 rowData
//               });
//             } else {
//               jsonData.push(rowData);
//             }
//           })());
//         }
//       });
//     });

//     await Promise.all(rowPromises); // Await all row processing promises

//     // Save valid data to UserPrimaryInfo
//     if (jsonData.length > 0) {
//       await UserPrimaryInfo.bulkCreate(jsonData);
//     }

//     // Generate error report
//     if (invalidRows.length > 0) {
//       const errorWorkbook = new Excel.Workbook();
//       const errorSheet = errorWorkbook.addWorksheet("Invalid Rows");

//       const originalSheet = workbook.getWorksheet(1);
//       const headerRow = originalSheet.getRow(1).values;
//       headerRow.push("Errors"); // Add 'Errors' to the end of the header row
//       errorSheet.addRow(headerRow);

//       invalidRows.forEach(({ rowData, errors }, index) => {
//         const errorDetails = errors.join("; ");
//         const rowWithErrors = [
//           index + 1, // Serial Number
//           rowData.lead_received_date,
//           rowData.source_slug,
//           rowData.channel_slug,
//           rowData.full_name,
//           rowData.email,
//           rowData.phone,
//           rowData.city,
//           rowData.office_type_slug,
//           rowData.preferred_country,
//           rowData.ielts,
//           rowData.remarks,
//           errorDetails,
//         ];

//         errorSheet.addRow(rowWithErrors);
//       });

//       const errorFileName = `invalid-rows-${uuidv4()}.xlsx`;
//       const errorFilePath = path.join("uploads/rejected_files", errorFileName);
//       await errorWorkbook.xlsx.writeFile(errorFilePath);

//       return res.status(201).json({
//         status: false,
//         message: "Some rows contain invalid data",
//         errors: invalidRows,
//         invalidFileLink: `${errorFilePath}`, // Adjust this if necessary to serve static files
//       });
//     } else {
//       res.status(200).json({
//         status: true,
//         message: "Data processed and saved successfully",
//       });
//     }
//   } catch (error) {
//     console.error(`Error processing bulk upload: ${error}`);
//     res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };

// const validateRowData = (data) => {
//   const errors = [];

//   if (!data.full_name) errors.push("Full name is required");
//   if (!data.email) errors.push("Email is required");
//   if (!data.phone) errors.push("Phone is required");
//   if (!data.source_id) errors.push("Invalid source");
//   if (!data.channel_id) errors.push("Invalid channel");
//   if (!data.office_type) errors.push("Invalid office type");
//   if (!data.preferred_country) errors.push("Preferred country is required");

//   return errors;
// };