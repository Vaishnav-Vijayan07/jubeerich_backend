const Excel = require("exceljs");
const db = require("../models");
const Source = db.leadSource;
const Channel = db.leadChannel;
const AdminUsers = db.adminUsers;
const OfficeType = db.officeType;
const UserPrimaryInfo = db.userPrimaryInfo;
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
    const creTl = await AdminUsers.findOne({ where: { role_id: 4 } });  //find the user_d of cre_tl

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

    workbook.eachSheet(async (worksheet) => {
      worksheet.eachRow(async (row, rowNumber) => {
        if (rowNumber > 1) {
          const sourceSlug = row.getCell(3).value;
          const channelSlug = row.getCell(4).value;
          const officeTypeSlug = row.getCell(9).value;

          const email = row.getCell(6).value;
          const phone = row.getCell(7).value;

          const emailKey = email || "";
          const phoneKey = phone || "";

          // Check for duplicate email within the file
          if (seenEmails.has(emailKey)) {
            invalidRows.push({
              rowNumber,
              errors: [`Duplicate email detected: '${email}' in the file`],
              rowData: {
                lead_received_date: row.getCell(2).value,
                source_slug: sourceSlug,
                channel_slug: channelSlug,
                full_name: row.getCell(5).value,
                email,
                phone,
                city: row.getCell(8).value,
                office_type_slug: officeTypeSlug,
                preferred_country: row.getCell(10).value,
                ielts: row.getCell(11).value,
                remarks: row.getCell(12).value,
              },
            });
            return; // Skip processing this row
          }

          // Check for duplicate phone within the file
          if (seenPhones.has(phoneKey)) {
            invalidRows.push({
              rowNumber,
              errors: [`Duplicate phone number detected: '${phone}' in the file`],
              rowData: {
                lead_received_date: row.getCell(2).value,
                source_slug: sourceSlug,
                channel_slug: channelSlug,
                full_name: row.getCell(5).value,
                email,
                phone,
                city: row.getCell(8).value,
                office_type_slug: officeTypeSlug,
                preferred_country: row.getCell(10).value,
                ielts: row.getCell(11).value,
                remarks: row.getCell(12).value,
              },
            });
            return; // Skip processing this row
          }

          seenEmails.add(emailKey);
          seenPhones.add(phoneKey);

          const rowData = {
            lead_received_date: row.getCell(2).value,
            source_id: sourceSlugToId[sourceSlug] || null,
            channel_id: channelSlugToId[channelSlug] || null,
            full_name: row.getCell(5).value,
            email,
            phone,
            city: row.getCell(8).value,
            office_type: officeTypeSlugToId[officeTypeSlug] || null,
            preferred_country: row.getCell(10).value,
            ielts: row.getCell(11).value,
            remarks: row.getCell(12).value,
            source_slug: sourceSlug,
            channel_slug: channelSlug,
            office_type_slug: officeTypeSlug,
            assigned_cre_tl: creTl ? creTl.id : null,
            created_by: userId
          };

          // Validate row data
          const errors = validateRowData(rowData);
          if (errors.length > 0) {
            invalidRows.push({ rowNumber, errors, rowData });
          } else {
            // Check for existing email or phone in the database
            const emailExists = existingEmails.has(email);
            const phoneExists = existingPhones.has(phone);

            if (emailExists || phoneExists) {
              invalidRows.push({
                rowNumber,
                errors: [
                  emailExists
                    ? `Email '${email}' already exists in the database`
                    : null,
                  phoneExists
                    ? `Phone number '${phone}' already exists in the database`
                    : null,
                ].filter(Boolean),
                rowData,
              });
            } else {
              jsonData.push(rowData);
            }
          }
        }
      });
    });

    console.log("HERE REACHED");

    // Save valid data to UserPrimaryInfo
    await UserPrimaryInfo.bulkCreate(jsonData);
    console.log("HERE REACHED 2");

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
          rowData.preferred_country,
          rowData.ielts,
          rowData.remarks,
          errorDetails,
        ];

        errorSheet.addRow(rowWithErrors);
      });

      const errorFileName = `invalid-rows-${uuidv4()}.xlsx`;
      const errorFilePath = path.join("uploads/rejected_files", errorFileName);
      await errorWorkbook.xlsx.writeFile(errorFilePath);

      return res.status(409).json({
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
  if (!data.preferred_country) errors.push("Preferred country is required");

  return errors;
};
