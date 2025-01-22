const Excel = require("exceljs");
const db = require("../models");
const Source = db.leadSource;
const Channel = db.leadChannel;
const AdminUsers = db.adminUsers;
const OfficeType = db.officeType;
const Region = db.region;
const Franchise = db.franchise;
const UserPrimaryInfo = db.userPrimaryInfo;
const Country = db.country;
const UserCountries = db.userContries; // Import the UserCountries model
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { addLeadHistory } = require("../utils/academic_query_helper");
const { createTaskDesc } = require("../utils/task_description");
const stageDatas = require("../constants/stage_data");
const Piscina = require("piscina");
const { error } = require("console");

exports.bulkUpload = async (req, res) => {
  const transaction = await db.sequelize.transaction();

  try {
    const userId = req.userDecodeId;
    const role = req.role_name;
    const workbook = new Excel.Workbook();
    const fileName = `${uuidv4()}.xlsx`; // Generate a unique file name
    const filePath = path.join("uploads", fileName);

    // Save the uploaded file to local storage
    fs.writeFileSync(filePath, req.file.buffer);

    await workbook.xlsx.load(req.file.buffer);
    const jsonData = [];
    const invalidRows = [];
    const seenEntries = new Set(); // Track seen entries to detect duplicates

    const sources = await Source.findAll();
    const regions = await Region.findAll();
    const franchises = await Franchise.findAll();
    const channels = await Channel.findAll();
    const officeTypes = await OfficeType.findAll();
    const countries = await Country.findAll();
    // const creTl = await AdminUsers.findOne({ where: { role_id: process.env.CRE_TL_ID } }); // Find the user_id of cre_tl
    const creTl = await AdminUsers.findOne({
      where: { role_id: process.env.CRE_TL_ID },
      include: [
        {
          model: db.accessRoles,
          attributes: ["role_name"],
        },
      ],
    });

    const sourceSlugToId = sources.reduce((acc, source) => {
      acc[source.slug] = source.id;
      return acc;
    }, {});

    const regionSlugToId = regions.reduce((acc, region) => {
      acc[region.slug] = region.id;
      return acc;
    }, {});

    const franchiseSlugToId = franchises.reduce((acc, franchise) => {
      acc[franchise.slug] = franchise.id;
      return acc;
    }, {});

    const regionSlugToManagerId = regions.reduce((acc, region) => {
      acc[region.slug] = region.regional_manager_id;

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

    const countryCodeToId = countries.reduce((acc, country) => {
      acc[country.country_code] = country.id;
      return acc;
    }, {});

    // Query existing records from the database
    const existingRecords = await UserPrimaryInfo.findAll({
      attributes: ["email", "phone"],
    });

    const existingEmails = new Set(existingRecords.map((record) => record.email));
    const existingPhones = new Set(existingRecords.map((record) => record.phone));

    const rowPromises = []; // Collect row processing promises

    workbook.eachSheet((worksheet) => {
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          rowPromises.push(
            (async () => {
              const sourceSlug = row.getCell(3).value;
              const channelSlug = row.getCell(4).value;
              const officeTypeSlug = row.getCell(9).value;
              let regionSlug = null;
              let franchiseSlug = null;
              if (officeTypeSlug == "REGION") {
                regionSlug = row.getCell(10).value;
              } else if (officeTypeSlug == "FRANCHISE") {
                franchiseSlug = row.getCell(10).value;
              }

              let emailCell = row.getCell(6);
              let email = emailCell.text || emailCell.value;
              const phone = row.getCell(7).value;

              const emailKey = email || "";
              const phoneKey = phone || "";

              // Handle preferred_country as a comma-separated string of country codes
              let preferred_country = row.getCell(11).value;

              if (preferred_country && typeof preferred_country === "string") {
                preferred_country = preferred_country
                  .split(",") // Split by commas
                  .map((code) => code.trim()) // Remove any whitespace around codes
                  .filter((code) => countryCodeToId[code]) // Filter out invalid codes
                  .map((code) => countryCodeToId[code]); // Map to country IDs
              } else {
                // Default to an empty array if no valid codes are found
                preferred_country = [];
              }

              // const rowData = {
              //   lead_received_date: row.getCell(2).value,
              //   source_id: sourceSlugToId[sourceSlug] || null,
              //   channel_id: channelSlugToId[channelSlug] || null,
              //   full_name: row.getCell(5).value,
              //   email,
              //   phone,
              //   city: row.getCell(8).value,
              //   office_type: officeTypeSlugToId[officeTypeSlug] || null,
              //   preferred_country,
              //   prefferedCountryCode: row.getCell(11).value,
              //   ielts: row.getCell(12).value,
              //   region_slug: regionSlug,
              //   remarks: row.getCell(13).value,
              //   source_slug: sourceSlug,
              //   channel_slug: channelSlug,
              //   office_type_slug: officeTypeSlug,
              //   assigned_cre_tl: officeTypeSlug == "CORPORATE_OFFICE" && creTl ? creTl.id : null,
              //   created_by: userId,
              //   region_id: officeTypeSlug == "REGION" ? regionSlugToId[regionSlug] : null,
              //   franchise_id: officeTypeSlug == "FRANCHISE" ? franchiseSlugToId[franchiseSlug] : null,
              //   assigned_regional_manager: officeTypeSlug == "REGION" ? regionSlugToManagerId[regionSlug] : null,
              //   stage:
              //     officeTypeSlug == "CORPORATE_OFFICE"
              //       ? stageDatas.cre
              //       : officeTypeSlug == "REGION"
              //       ? stageDatas.regional_manager
              //       : officeTypeSlug == "FRANCHISE"
              //       ? stageDatas.counsellor
              //       : stageDatas.unknown,
              // };

              const isCorporateOffice = officeTypeSlug == "CORPORATE_OFFICE";
              const isRegion = officeTypeSlug == "REGION";
              const isFranchise = officeTypeSlug == "FRANCHISE";

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
                prefferedCountryCode: row.getCell(11).value,
                ielts: row.getCell(12).value,
                region_slug: regionSlug,
                remarks: row.getCell(13).value,
                source_slug: sourceSlug,
                channel_slug: channelSlug,
                office_type_slug: officeTypeSlug,
                assigned_cre_tl: isCorporateOffice && creTl ? creTl.id : null,
                created_by: userId,
                region_id: isRegion ? regionSlugToId[regionSlug] : null,
                franchise_id: isFranchise ? franchiseSlugToId[franchiseSlug] : null,
                assigned_regional_manager: isRegion ? regionSlugToManagerId[regionSlug] : null,
                stage: isCorporateOffice
                  ? stageDatas.cre
                  : isRegion
                  ? stageDatas.regional_manager
                  : isFranchise
                  ? stageDatas.counsellor
                  : stageDatas.unknown,
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
                  rowData,
                });
              } else {
                jsonData.push(rowData);
              }
            })()
          );
        }
      });
    });

    await Promise.all(rowPromises); // Await all row processing promises

    const userRole = await db.adminUsers.findOne({ where: { id: userId } });

    // Save valid data to UserPrimaryInfo and UserCountries
    if (jsonData.length > 0) {
      const createdUsers = await UserPrimaryInfo.bulkCreate(jsonData, { returning: true });

      // Collect user ID and preferred country IDs
      for (const user of createdUsers) {
        const userId = user.id;
        const userJsonData = jsonData.find((data) => data.email === user.email);
        const preferredCountries = userJsonData.preferred_country;
        const franchiseId = user.franchise_id;

        if (user.id) {
          await addLeadHistory(user.id, `Lead created by ${role}`, req.userDecodeId, null, transaction);
        }

        if (userRole?.role_id == process.env.IT_TEAM_ID && user.office_type == process.env.CORPORATE_OFFICE_ID) {
          await addLeadHistory(user.id, `Lead assigned to ${creTl?.access_role.role_name}`, req.userDecodeId, null, transaction);
        }
        //  else if (userRole?.role_id == process.env.IT_TEAM_ID && regionalManagerId) {
        //   await addLeadHistory(user.id, `Lead assigned to ${regionMangerRoleName}`, req.userDecodeId, null, transaction);
        // }

        // Retrieve existing user-country associations for this user
        const existingUserCountries = await UserCountries.findAll({
          where: {
            user_primary_info_id: userId,
          },
          attributes: ["country_id"],
        });

        const existingCountryIds = new Set(existingUserCountries.map((uc) => uc.country_id));

        const userCountries = preferredCountries
          .filter((countryId) => !existingCountryIds.has(countryId)) // Exclude duplicates
          .map((countryId) => ({
            user_primary_info_id: userId,
            country_id: countryId,
            status_id: process.env.NEW_LEAD_STATUS_ID,
          }));

        if (userCountries.length > 0) {
          await UserCountries.bulkCreate(userCountries);
        }

        if (preferredCountries.length > 0) {
          const studyPreferences = await Promise.all(
            preferredCountries.map(async (countryId) => {
              return await db.studyPreference.create({
                userPrimaryInfoId: userId,
                countryId,
              });
            })
          );
        }

        // Create user-countries associations
        // const userCountries = preferredCountries.map((countryId) => ({
        //   user_primary_info_id: userId,
        //   country_id: countryId,
        // }));

        // if (userCountries.length > 0) {
        //   await UserCountries.bulkCreate(userCountries);
        // }

        if (franchiseId) {
          let leastAssignedUsers = [];
          for (const countryId of preferredCountries) {
            const users = await getLeastAssignedCounsellor(countryId, franchiseId);
            if (users?.leastAssignedUserId) {
              leastAssignedUsers = leastAssignedUsers.concat(users.leastAssignedUserId);
            }
          }

          if (leastAssignedUsers.length > 0) {
            // Remove existing counselors for the student
            await db.userCounselors.destroy({
              where: { user_id: userId },
            });

            // Add new counselors
            const userCounselorsData = leastAssignedUsers?.map((counsellorId) => ({
              user_id: userId,
              counselor_id: counsellorId,
            }));

            await db.userCounselors.bulkCreate(userCounselorsData);

            const dueDate = new Date();

            let countryName = "Unknown";
            if (preferredCountries.length > 0) {
              // const country = await db.country.findByPk(countryIds[0]);
              const countries = await db.country.findAll({
                where: { id: preferredCountries },
                attributes: ["country_name", "country_code"],
              });

              if (countries) {
                // countryName = countries.map((country) => country.country_name).join(", ");
                countryName = countries.map((country) => country.country_code).join(", ");
              }
            }

            let formattedDesc = await createTaskDesc(user, user.id);

            if (!formattedDesc) {
              return res.status(500).json({
                status: false,
                message: "Description error",
              });
            }

            // Create tasks for each least assigned user
            for (const leastUserId of leastAssignedUsers) {
              const task = await db.tasks.create({
                studentId: user.id,
                userId: leastUserId,
                title: `${user.full_name} - ${countryName}`,
                // description: `${user.full_name} from ${user?.city}, has applied for admission in ${countryName}`,
                description: formattedDesc,
                dueDate: dueDate,
                updatedBy: userId,
              });
            }
          }
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
          rowData.region_slug,
          rowData.prefferedCountryCode,
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
      await transaction.commit();
      res.status(200).json({
        status: true,
        message: "Data processed and saved successfully",
      });
    }
  } catch (error) {
    console.error(`Error processing bulk upload: ${error}`);
    await transaction.rollback();
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
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

  return errors;
};

// const getLeastAssignedCounsellor = async (countryId, franchiseId) => {
//   const roleId = process.env.FRANCHISE_COUNSELLOR_ID;
//   try {
//     // Use raw SQL to execute the query
//     const [results] = await db.sequelize.query(`
//       WITH user_assignments AS (
//         SELECT
//           "admin_users"."id" AS "user_id",
//           COUNT("user_counselors"."counselor_id") AS "assignment_count"
//         FROM "admin_users"
//         LEFT JOIN "user_counselors"
//           ON "admin_users"."id" = "user_counselors"."counselor_id"
//         WHERE "admin_users"."role_id" = :roleId
//           AND "admin_users"."country_id" = :countryId
//           AND "admin_users"."franchise_id" = :franchiseId
//         GROUP BY "admin_users"."id"
//       )
//       SELECT "user_id"
//       FROM user_assignments
//       ORDER BY "assignment_count" ASC, "user_id" ASC
//       LIMIT 1;
//     `, {
//       replacements: { roleId, countryId, franchiseId },
//       type: db.Sequelize.QueryTypes.SELECT
//     });

//     console.log("results ===>", results);

//     // Check if results is defined and not null
//     if (!results || Object.keys(results).length === 0) {
//       return {
//         leastAssignedUserId: null
//       };
//     }

//     // Extract user_id if results has user_id
//     const leastAssignedUserId = results.user_id;

//     // If user_id is undefined, return an error response
//     if (leastAssignedUserId === undefined) {
//       return {
//         leastAssignedUserId: null
//       };
//     }

//     return {
//       leastAssignedUserId
//     };
//   } catch (error) {
//     console.error(`Error finding least assigned users: ${error}`);
//     return {
//       leastAssignedUserId: null
//     };
//   }
// };

const getLeastAssignedCounsellor = async (countryId, franchiseId) => {
  const roleId = process.env.FRANCHISE_COUNSELLOR_ID;
  try {
    // Use raw SQL to execute the query
    const [results] = await db.sequelize.query(
      `
      WITH user_assignments AS (
        SELECT 
          "admin_users"."id" AS "user_id", 
          COUNT("user_counselors"."counselor_id") AS "assignment_count"
        FROM "admin_users"
        LEFT JOIN "user_counselors" 
          ON "admin_users"."id" = "user_counselors"."counselor_id"
        WHERE "admin_users"."role_id" = :roleId
          AND "admin_users"."franchise_id" = :franchiseId
          AND "admin_users"."status" = true
        GROUP BY "admin_users"."id"
      )
      SELECT "user_id"
      FROM user_assignments
      ORDER BY "assignment_count" ASC, "user_id" ASC
      LIMIT 1;
    `,
      {
        replacements: { roleId, franchiseId },
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    // Check if results is defined and not null
    if (!results || Object.keys(results).length === 0) {
      return {
        leastAssignedUserId: null,
      };
    }

    // Extract user_id if results has user_id
    const leastAssignedUserId = results.user_id;

    // If user_id is undefined, return an error response
    if (leastAssignedUserId === undefined) {
      return {
        leastAssignedUserId: null,
      };
    }

    return {
      leastAssignedUserId,
    };
  } catch (error) {
    console.error(`Error finding least assigned users: ${error}`);
    return {
      leastAssignedUserId: null,
    };
  }
};

// exports.bulkUploadMultiCore = async (req, res) => {
//   // const transaction = await db.sequelize.transaction();

//   let piscina = null;
//   if (!piscina) {
//     piscina = new Piscina({
//       filename: path.resolve(__dirname, "../workers/worker.js"),
//       maxThreads: require("os").cpus().length,
//     });
//   }

//   try {
//     const userId = req.userDecodeId;
//     const role = req.role_name;
//     const workbook = new Excel.Workbook();
//     await workbook.xlsx.load(req.file.buffer);

//     const rows = [];
//     const errors = [];
//     const batchSize = 500;
//     let batchPromises = [];

//     // Load mappings
//     const sources = await Source.findAll({ attributes: ["id", "slug"] });
//     const channels = await Channel.findAll({ attributes: ["id", "slug"] });
//     const officeTypes = await OfficeType.findAll({ attributes: ["id", "slug"] });
//     const countries = await Country.findAll({ attributes: ["id", "country_code"] });
//     const regions = await Region.findAll({ attributes: ["id", "slug", "regional_manager_id"] });
//     const franchises = await Franchise.findAll({ attributes: ["id", "slug"] });

//     const creTl = await AdminUsers.findOne({
//       where: { role_id: process.env.CRE_TL_ID },
//       include: [
//         {
//           model: db.accessRoles,
//           attributes: ["role_name"],
//         },
//       ],
//     });

//     const existingRecords = await UserPrimaryInfo.findAll({
//       attributes: ["email", "phone"],
//     });

//     const existingEmails = new Set(existingRecords.map((record) => record.email));
//     const existingPhones = new Set(existingRecords.map((record) => record.phone));

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

//     const countryCodeToId = countries.reduce((acc, country) => {
//       acc[country.country_code] = country.id;
//       return acc;
//     }, {});

//     const regionSlugToId = regions.reduce((acc, region) => {
//       acc[region.slug] = region.id;
//       return acc;
//     }, {});

//     const regionSlugToManagerId = regions.reduce((acc, region) => {
//       acc[region.slug] = region.regional_manager_id;
//       return acc;
//     }, {});

//     const franchiseSlugToId = franchises.reduce((acc, franchise) => {
//       acc[franchise.slug] = franchise.id;
//       return acc;
//     }, {});

//     // Load rows into memory
//     workbook.eachSheet((worksheet) => {
//       worksheet.eachRow((row, rowNumber) => {
//         if (rowNumber > 1) {
//           let emailCell = row.getCell(6);
//           let email = emailCell.text || emailCell.value;
//           // Skip header row
//           rows.push({
//             lead_received_date: row.getCell(2).value,
//             source_slug: row.getCell(3).value,
//             channel_slug: row.getCell(4).value,
//             full_name: row.getCell(5).value,
//             email: email,
//             phone: row.getCell(7).value,
//             city: row.getCell(8).value,
//             office_type_slug: row.getCell(9).value,
//             region_or_franchise_slug: row.getCell(10).value,
//             preferred_country_code: row.getCell(11).value,
//             ielts: row.getCell(12).value,
//             remarks: row.getCell(13).value,
//           });
//         }
//       });
//     });

//     // Process rows in batches
//     for (let i = 0; i < rows.length; i += batchSize) {
//       const batch = {
//         rows: rows
//           .slice(i, i + batchSize)
//           .map((row, index) => {
//             const rowNumber = i + index + 2; // Account for header row
//             const officeTypeSlug = row.office_type_slug;

//             const isCorporateOffice = officeTypeSlug == "CORPORATE_OFFICE";
//             const isRegion = officeTypeSlug == "REGION";
//             const isFranchise = officeTypeSlug == "FRANCHISE";

//             const processedRow = {
//               lead_received_date: row.lead_received_date,
//               source_id: sourceSlugToId[row.source_slug] || null,
//               channel_id: channelSlugToId[row.channel_slug] || null,
//               full_name: row.full_name,
//               email: row.email,
//               phone: row.phone,
//               city: row.city,
//               office_type: officeTypeSlugToId[officeTypeSlug] || null,
//               preferred_country: countryCodeToId[row.preferred_country_code] || null,
//               ielts: row.ielts,
//               remarks: row.remarks,
//               assigned_cre_tl: officeTypeSlug == "CORPORATE_OFFICE" && creTl ? creTl.id : null,
//               created_by: userId,
//               region_id: officeTypeSlug === "REGION" ? regionSlugToId[row.region_or_franchise_slug] : null,
//               franchise_id: officeTypeSlug === "FRANCHISE" ? franchiseSlugToId[row.region_or_franchise_slug] : null,
//               assigned_regional_manager: officeTypeSlug === "REGION" ? regionSlugToManagerId[row.region_or_franchise_slug] : null,
//               // stage: officeTypeSlug == "CORPORATE_OFFICE" ? stageDatas.cre : "Unknown",
//               stage: isCorporateOffice
//                 ? stageDatas.cre
//                 : isRegion
//                 ? stageDatas.regional_manager
//                 : isFranchise
//                 ? stageDatas.counsellor
//                 : stageDatas.unknown,
//             };

//             // Check if the email or phone already exists in the existing records
//             if (existingEmails.has(processedRow.email) || existingPhones.has(processedRow.phone)) {
//               errors.push({ rowNumber, rowData: processedRow, errors: ["Email or phone already exists in Database"] });
//               return null; // Skip this row if email or phone already exists
//             }

//             return {
//               rowNumber,
//               rowData: processedRow,
//             };
//           })
//           ?.filter((row) => row != null),
//         meta: { startRow: i + 2 },
//         userDecodeId: userId,
//         role: role,
//         creTLrole: creTl?.access_role?.role_name,
//       };

//       batchPromises.push(piscina.run(batch));
//     }

//     const results = await Promise.all(batchPromises);

//     // Collect errors from all batches
//     results.forEach((result) => {
//       if (result.errors) {
//         errors.push(...result.errors);
//       }
//     });

//     // Save errors to an error file if any exist
//     if (errors.length > 0) {
//       // Assuming `invalidRows` is an array with rows that have validation errors
//       const invalidRows = errors; // Or the array where your rows with errors are stored

//       // Create a new Excel Workbook
//       const errorWorkbook = new Excel.Workbook();
//       const errorSheet = errorWorkbook.addWorksheet("Errors");

//       // Assuming the first sheet is the original sheet you're working with
//       const originalSheet = workbook.getWorksheet(1);

//       // Add "Errors" to the header of the new error sheet
//       const headerRow = originalSheet.getRow(1).values;
//       headerRow.push("Errors"); // Add 'Errors' to the end of the header row for the new sheet
//       errorSheet.addRow(headerRow); // Write the header row to the error sheet

//       // Iterate over invalid rows and add them to the error sheet
//       invalidRows.forEach(({ rowNumber, rowData, errors }, index) => {
//         const errorDetails = Array.isArray(errors) ? errors?.join("; ") : [errors]?.join("; "); // Join all errors with a semicolon

//         const worksheet = workbook.getWorksheet(1);
//         const existRow = worksheet.getRow(rowNumber);

//         const rowWithErrors = [
//           rowNumber, // Serial Number (1-based index for user-friendly display)
//           existRow.getCell(2).value, // Lead Received Date
//           existRow.getCell(3).value, // Source Slug
//           existRow.getCell(4).value, // Channel Slug
//           existRow.getCell(5).value, // Full Name
//           existRow.getCell(6).value, // Email
//           existRow.getCell(7).value, // Phone
//           existRow.getCell(8).value, // City
//           existRow.getCell(9).value, // Office Type Slug
//           existRow.getCell(10).value, // Region or Franchise Slug
//           existRow.getCell(11).value, // Preferred Country Code
//           existRow.getCell(12).value, // IELTS
//           existRow.getCell(13).value, // Remarks
//           errorDetails, // The error message(s)
//         ];

//         // Add the row with errors to the error sheet
//         errorSheet.addRow(rowWithErrors);
//       });

//       // Generate a unique file name and save the errors to the file
//       const errorFileName = `invalid-rows-${uuidv4()}.xlsx`;
//       const errorFilePath = path.join("uploads/rejected_files", errorFileName);
//       await errorWorkbook.xlsx.writeFile(errorFilePath);

//       return res.status(201).json({
//         status: false,
//         message: `${rows.length - errors.length} out of ${
//           rows.length
//         } rows processed successfully. Please check the downloaded sheet for errors.`,
//         // message: "Some rows contain invalid data",
//         // errors: rowWithErrors,
//         invalidFileLink: `${errorFilePath}`, // Adjust this if necessary to serve static files
//       });
//     } else {
//       return res.status(200).json({
//         status: true,
//         message: "File uploaded successfully",
//       });
//     }
//   } catch (error) {
//     console.error("Error processing bulk upload:", error);
//     // await transaction.rollback();
//     return res.status(500).json({
//       status: false,
//       message: "An error occurred while processing your request. Please try again later.",
//     });
//   } finally {
//     piscina.close();
//     console.log("piscina closed ==========>");
//   }
// };

exports.bulkUploadMultiCore = async (req, res) => {
  // const transaction = await db.sequelize.transaction();

  let piscina = null;
  if (!piscina) {
    piscina = new Piscina({
      filename: path.resolve(__dirname, "../workers/worker.js"),
      maxThreads: require("os").cpus().length,
    });
  }

  try {
    const userId = req.userDecodeId;
    const role = req.role_name;
    const workbook = new Excel.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const rows = [];
    const errors = [];
    const batchSize = 500;
    let batchPromises = [];

    // Load mappings (unchanged)
    const sources = await Source.findAll({ attributes: ["id", "slug"] });
    const channels = await Channel.findAll({ attributes: ["id", "slug"] });
    const officeTypes = await OfficeType.findAll({ attributes: ["id", "slug"] });
    const countries = await Country.findAll({ attributes: ["id", "country_code"] });
    const regions = await Region.findAll({ attributes: ["id", "slug", "regional_manager_id"] });
    const franchises = await Franchise.findAll({ attributes: ["id", "slug"] });

    const creTl = await AdminUsers.findOne({
      where: { role_id: process.env.CRE_TL_ID },
      include: [
        {
          model: db.accessRoles,
          attributes: ["role_name"],
        },
      ],
    });

    const existingRecords = await UserPrimaryInfo.findAll({
      attributes: ["email", "phone"],
    });

    const existingEmails = new Set(existingRecords.map((record) => record.email));
    const existingPhones = new Set(existingRecords.map((record) => record.phone));

    // Mappings (unchanged)
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

    const countryCodeToId = countries.reduce((acc, country) => {
      acc[country.country_code] = country.id;
      return acc;
    }, {});

    const regionSlugToId = regions.reduce((acc, region) => {
      acc[region.slug] = region.id;
      return acc;
    }, {});

    const regionSlugToManagerId = regions.reduce((acc, region) => {
      acc[region.slug] = region.regional_manager_id;
      return acc;
    }, {});

    const franchiseSlugToId = franchises.reduce((acc, franchise) => {
      acc[franchise.slug] = franchise.id;
      return acc;
    }, {});

    // Helper function to safely get cell value
    const getCellValue = (cell) => {
      if (!cell) return null;

      // Handle different cell types
      if (cell.type === Excel.ValueType.Date) {
        return cell.value;
      }
      if (cell.type === Excel.ValueType.Number) {
        return cell.value;
      }
      // Handle text and other types
      return (cell.text || cell.value || "").toString().trim() || null;
    };

    // Load rows into memory with improved cell value handling
    workbook.eachSheet((worksheet) => {
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          rows.push({
            lead_received_date: getCellValue(row.getCell(2)),
            source_slug: getCellValue(row.getCell(3)),
            channel_slug: getCellValue(row.getCell(4)),
            full_name: getCellValue(row.getCell(5)),
            email: getCellValue(row.getCell(6)),
            phone: getCellValue(row.getCell(7)),
            city: getCellValue(row.getCell(8)),
            office_type_slug: getCellValue(row.getCell(9)),
            region_or_franchise_slug: getCellValue(row.getCell(10)),
            preferred_country_code: getCellValue(row.getCell(11)),
            ielts: getCellValue(row.getCell(12)),
            remarks: getCellValue(row.getCell(13)),
          });
        }
      });
    });

    // Process rows in batches (rest of the code unchanged)
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = {
        rows: rows
          .slice(i, i + batchSize)
          .map((row, index) => {
            const rowNumber = i + index + 2;
            const officeTypeSlug = row.office_type_slug;

            const isCorporateOffice = officeTypeSlug == "CORPORATE_OFFICE";
            const isRegion = officeTypeSlug == "REGION";
            const isFranchise = officeTypeSlug == "FRANCHISE";

            const processedRow = {
              lead_received_date: row.lead_received_date,
              source_id: sourceSlugToId[row.source_slug] || null,
              channel_id: channelSlugToId[row.channel_slug] || null,
              full_name: row.full_name,
              email: row.email,
              phone: row.phone,
              city: row.city,
              office_type: officeTypeSlugToId[officeTypeSlug] || null,
              preferred_country: countryCodeToId[row.preferred_country_code] || null,
              ielts: row.ielts,
              remarks: row.remarks,
              assigned_cre_tl: officeTypeSlug == "CORPORATE_OFFICE" && creTl ? creTl.id : null,
              created_by: userId,
              region_id: officeTypeSlug === "REGION" ? regionSlugToId[row.region_or_franchise_slug] : null,
              franchise_id: officeTypeSlug === "FRANCHISE" ? franchiseSlugToId[row.region_or_franchise_slug] : null,
              assigned_regional_manager: officeTypeSlug === "REGION" ? regionSlugToManagerId[row.region_or_franchise_slug] : null,
              stage: isCorporateOffice
                ? stageDatas.cre
                : isRegion
                ? stageDatas.regional_manager
                : isFranchise
                ? stageDatas.counsellor
                : stageDatas.unknown,
            };

            if (existingEmails.has(processedRow.email) || existingPhones.has(processedRow.phone)) {
              errors.push({ rowNumber, rowData: processedRow, errors: ["Email or phone already exists in Database"] });
              return null;
            }

            return {
              rowNumber,
              rowData: processedRow,
            };
          })
          .filter((row) => row != null),
        meta: { startRow: i + 2 },
        userDecodeId: userId,
        role: role,
        creTLrole: creTl?.access_role?.role_name,
      };

      batchPromises.push(piscina.run(batch));
    }

    const results = await Promise.all(batchPromises);

    // Collect errors from all batches
    results.forEach((result) => {
      if (result.errors) {
        errors.push(...result.errors);
      }
    });

    // Save errors to an error file if any exist
    if (errors.length > 0) {
      const errorWorkbook = new Excel.Workbook();
      const errorSheet = errorWorkbook.addWorksheet("Errors");

      const originalSheet = workbook.getWorksheet(1);
      const headerRow = originalSheet.getRow(1).values;
      headerRow.push("Errors");
      errorSheet.addRow(headerRow);

      errors.forEach(({ rowNumber, rowData, errors }) => {
        const errorDetails = Array.isArray(errors) ? errors?.join("; ") : [errors]?.join("; ");

        const worksheet = workbook.getWorksheet(1);
        const existRow = worksheet.getRow(rowNumber);

        const rowWithErrors = [
          rowNumber,
          existRow.getCell(2).value,
          existRow.getCell(3).value,
          existRow.getCell(4).value,
          existRow.getCell(5).value,
          existRow.getCell(6).value,
          existRow.getCell(7).value,
          existRow.getCell(8).value,
          existRow.getCell(9).value,
          existRow.getCell(10).value,
          existRow.getCell(11).value,
          existRow.getCell(12).value,
          existRow.getCell(13).value,
          errorDetails,
        ];

        errorSheet.addRow(rowWithErrors);
      });

      const errorFileName = `invalid-rows-${uuidv4()}.xlsx`;
      const errorFilePath = path.join("uploads/rejected_files", errorFileName);
      await errorWorkbook.xlsx.writeFile(errorFilePath);

      return res.status(201).json({
        status: false,
        message: `${rows.length - errors.length} out of ${
          rows.length
        } rows processed successfully. Please check the downloaded sheet for errors.`,
        invalidFileLink: `${errorFilePath}`,
      });
    } else {
      return res.status(200).json({
        status: true,
        message: "File uploaded successfully",
      });
    }
  } catch (error) {
    console.error("Error processing bulk upload:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  } finally {
    piscina.close();
    console.log("piscina closed ==========>");
  }
};
