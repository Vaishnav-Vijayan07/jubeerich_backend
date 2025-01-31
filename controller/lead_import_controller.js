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

              console.log("preferred_country after processing ====>", preferred_country);

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
                assigned_cre_tl: officeTypeSlug == "CORPORATE_OFFICE" && creTl ? creTl.id : null,
                created_by: userId,
                region_id: officeTypeSlug == "REGION" ? regionSlugToId[regionSlug] : null,
                franchise_id: officeTypeSlug == "FRANCHISE" ? franchiseSlugToId[franchiseSlug] : null,
                assigned_regional_manager: officeTypeSlug == "REGION" ? regionSlugToManagerId[regionSlug] : null,
                stage: officeTypeSlug == "CORPORATE_OFFICE" ? stageDatas.cre : "Unknown",
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

        console.log("USERRRRRR ======>", user.office_type);

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
      message: "Internal server error",
    });
  } finally {
    await transaction.rollback();
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

    console.log("count results  ===>", results);

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
