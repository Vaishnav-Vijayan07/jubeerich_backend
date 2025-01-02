const db = require("../models");
const { addLeadHistory } = require("../utils/academic_query_helper");
const { createTaskDesc } = require('../utils/task_description');

module.exports = async function processBatch(batch) {
  const { rows, meta, userDecodeId, role, creTLrole } = batch;
  const transaction = await db.sequelize.transaction();

  const errors = [];
  const validData = [];

  const userRole = await db.adminUsers.findOne({ where: { id: userDecodeId } });

  rows.forEach((row, index) => {
    const validationErrors = validateRowData(row);
    if (validationErrors.length > 0) {
      errors.push({ rowNumber: meta.startRow + index, errors: validationErrors });
    } else {
      validData.push(row);
    }
  });

  if (validData.length > 0) {
    try {
      let formattedData = validData.map((data) => data?.rowData);

      // Bulk create users from the valid data
      const createdUsers = await db.userPrimaryInfo.bulkCreate(formattedData, {
        returning: true,
        transaction
      });

      for (const user of createdUsers) {

        const userId = user.id;
        const userJsonData = validData.find((data) => data.rowData.email == user.email);

        let preferredCountries = userJsonData.rowData.preferred_country;

        const franchiseId = user.franchise_id;

        if (user.id) {
          await addLeadHistory(user.id, `Lead created by ${role}`, userDecodeId, null, transaction);
        }

        if (userRole?.role_id == process.env.IT_TEAM_ID && user.office_type == process.env.CORPORATE_OFFICE_ID) {
          await addLeadHistory(user.id, `Lead assigned to ${creTLrole}`, userDecodeId, null, transaction);
        }

        // Retrieve existing user-country associations
        const existingUserCountries = await db.userContries.findAll({
          where: {
            user_primary_info_id: userId,
          },
          attributes: ["country_id"],
        });

        const existingCountryIds = new Set(existingUserCountries.map((uc) => uc.country_id));
        
        preferredCountries = Array.isArray(preferredCountries) ? preferredCountries : [preferredCountries]
        
        // Collect preferred countries excluding duplicates
        const userCountries = preferredCountries
          ?.filter((countryId) => !existingCountryIds.has(countryId))
          .map((countryId) => ({
            user_primary_info_id: userId,
            country_id: countryId,
            status_id: process.env.NEW_LEAD_STATUS_ID,
          }));

        if (userCountries.length > 0) {
          await db.userContries.bulkCreate(userCountries, { transaction });
        }

        // Create study preferences for the user
        if (preferredCountries.length > 0) {
          await Promise.all(
            preferredCountries.map(async (countryId) => {
              await db.studyPreference.create({
                userPrimaryInfoId: userId,
                countryId,
              }, { transaction });
            })
          );
        }

        // Handle franchise-specific logic
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
            const userCounselorsData = leastAssignedUsers.map((counsellorId) => ({
              user_id: userId,
              counselor_id: counsellorId,
            }));

            await db.userCounselors.bulkCreate(userCounselorsData, { transaction });

            const dueDate = new Date();

            let countryName = "Unknown";
            if (preferredCountries.length > 0) {
              const countries = await db.country.findAll({
                where: { id: preferredCountries },
                attributes: ["country_name", "country_code"],
              });

              if (countries) {
                countryName = countries.map((country) => country.country_code).join(", ");
              }
            }

            let formattedDesc = await createTaskDesc(user, user.id);

            if (!formattedDesc) {
              throw new Error("Description error while creating task");
            }

            // Create tasks for each least assigned user
            for (const leastUserId of leastAssignedUsers) {
              await db.tasks.create({
                studentId: user.id,
                userId: leastUserId,
                title: `${user.full_name} - ${countryName}`,
                description: formattedDesc,
                dueDate: dueDate,
                updatedBy: userId,
              }, { transaction });
            }
          }
        }
      }

      await transaction.commit();

    } catch (error) {
      console.error("Error in processing batch", error);
      errors.push({ rowNumber: meta.startRow, errors: [`Database error: ${error.message}`] });
      await transaction.rollback();
      throw error;
    }
  }
  console.log('errors', errors);

  return { errors };
};

// module.exports = async function processBatch(batch) {
//   const { rows, meta, userDecodeId, role, creTLrole } = batch;
//   const transaction = await db.sequelize.transaction();

//   const errors = [];
//   const validData = [];

//   const userRole = await db.adminUsers.findOne({ where: { id: userDecodeId } });

//   const emailSet = new Set();
//   const phoneSet = new Set();
//   const duplicateEmailRows = new Map();
//   const duplicatePhoneRows = new Map();

//   rows.forEach((row, index) => {
//     const { email, phone } = row.rowData;
//     const rowNumber = meta.startRow + index;

//     // Check for duplicates within the file
//     if (email) {
//       if (emailSet.has(email)) {
//         if (!duplicateEmailRows.has(email)) {
//           duplicateEmailRows.set(email, []);
//         }
//         duplicateEmailRows.get(email).push(rowNumber);
//       } else {
//         emailSet.add(email);
//       }
//     }

//     if (phone) {
//       if (phoneSet.has(phone)) {
//         if (!duplicatePhoneRows.has(phone)) {
//           duplicatePhoneRows.set(phone, []);
//         }
//         duplicatePhoneRows.get(phone).push(rowNumber);
//       } else {
//         phoneSet.add(phone);
//       }
//     }
//   });

//   // Step 2: Check for duplicates against the database
//   const dbExistingEmails = await db.userPrimaryInfo.findAll({
//     where: { email: Array.from(emailSet) },
//     attributes: ["email"],
//   });

//   const dbExistingPhones = await db.userPrimaryInfo.findAll({
//     where: { phone: Array.from(phoneSet) },
//     attributes: ["phone"],
//   });

//   const dbEmailSet = new Set(dbExistingEmails.map((record) => record.email));
//   const dbPhoneSet = new Set(dbExistingPhones.map((record) => record.phone));

//   // Step 3: Add errors for duplicates and validate rows
//   rows.forEach((row, index) => {
//     const { email, phone } = row.rowData;
//     const rowNumber = meta.startRow + index;
//     const rowErrors = validateRowData(row.rowData);

//     if (email && duplicateEmailRows.has(email)) {
//       rowErrors.push(`Duplicate email within file at rows: ${duplicateEmailRows.get(email).join(", ")}`);
//     }

//     if (phone && duplicatePhoneRows.has(phone)) {
//       rowErrors.push(`Duplicate phone within file at rows: ${duplicatePhoneRows.get(phone).join(", ")}`);
//     }

//     if (email && dbEmailSet.has(email)) {
//       rowErrors.push(`Email already exists in the database: ${email}`);
//     }

//     if (phone && dbPhoneSet.has(phone)) {
//       rowErrors.push(`Phone already exists in the database: ${phone}`);
//     }

//     if (rowErrors.length > 0) {
//       errors.push({ rowNumber, errors: rowErrors });
//     } else {
//       validData.push(row);
//     }
//   });

//   if (validData.length > 0) {
//     try {
//       let formattedData = validData.map((data) => data?.rowData);

//       // Bulk create users from the valid data
//       const createdUsers = await db.userPrimaryInfo.bulkCreate(formattedData, {
//         returning: true,
//         transaction
//       });

//       for (const user of createdUsers) {

//         const userId = user.id;
//         const userJsonData = validData.find((data) => data.rowData.email == user.email);

//         let preferredCountries = userJsonData.rowData.preferred_country;

//         const franchiseId = user.franchise_id;

//         if (user.id) {
//           await addLeadHistory(user.id, `Lead created by ${role}`, userDecodeId, null, transaction);
//         }

//         if (userRole?.role_id == process.env.IT_TEAM_ID && user.office_type == process.env.CORPORATE_OFFICE_ID) {
//           await addLeadHistory(user.id, `Lead assigned to ${creTLrole}`, userDecodeId, null, transaction);
//         }

//         // Retrieve existing user-country associations
//         const existingUserCountries = await db.userContries.findAll({
//           where: {
//             user_primary_info_id: userId,
//           },
//           attributes: ["country_id"],
//         });

//         const existingCountryIds = new Set(existingUserCountries.map((uc) => uc.country_id));
        
//         preferredCountries = Array.isArray(preferredCountries) ? preferredCountries : [preferredCountries]
        
//         // Collect preferred countries excluding duplicates
//         const userCountries = preferredCountries
//           ?.filter((countryId) => !existingCountryIds.has(countryId))
//           .map((countryId) => ({
//             user_primary_info_id: userId,
//             country_id: countryId,
//             status_id: process.env.NEW_LEAD_STATUS_ID,
//           }));

//         if (userCountries.length > 0) {
//           await db.userContries.bulkCreate(userCountries, { transaction });
//         }

//         // Create study preferences for the user
//         if (preferredCountries.length > 0) {
//           await Promise.all(
//             preferredCountries.map(async (countryId) => {
//               await db.studyPreference.create({
//                 userPrimaryInfoId: userId,
//                 countryId,
//               }, { transaction });
//             })
//           );
//         }

//         // Handle franchise-specific logic
//         if (franchiseId) {
//           let leastAssignedUsers = [];
//           for (const countryId of preferredCountries) {
//             const users = await getLeastAssignedCounsellor(countryId, franchiseId);
//             if (users?.leastAssignedUserId) {
//               leastAssignedUsers = leastAssignedUsers.concat(users.leastAssignedUserId);
//             }
//           }

//           if (leastAssignedUsers.length > 0) {
//             // Remove existing counselors for the student
//             await db.userCounselors.destroy({
//               where: { user_id: userId },
//             });

//             // Add new counselors
//             const userCounselorsData = leastAssignedUsers.map((counsellorId) => ({
//               user_id: userId,
//               counselor_id: counsellorId,
//             }));

//             await db.userCounselors.bulkCreate(userCounselorsData, { transaction });

//             const dueDate = new Date();

//             let countryName = "Unknown";
//             if (preferredCountries.length > 0) {
//               const countries = await db.country.findAll({
//                 where: { id: preferredCountries },
//                 attributes: ["country_name", "country_code"],
//               });

//               if (countries) {
//                 countryName = countries.map((country) => country.country_code).join(", ");
//               }
//             }

//             let formattedDesc = await createTaskDesc(user, user.id);

//             if (!formattedDesc) {
//               throw new Error("Description error while creating task");
//             }

//             // Create tasks for each least assigned user
//             for (const leastUserId of leastAssignedUsers) {
//               await db.tasks.create({
//                 studentId: user.id,
//                 userId: leastUserId,
//                 title: `${user.full_name} - ${countryName}`,
//                 description: formattedDesc,
//                 dueDate: dueDate,
//                 updatedBy: userId,
//               }, { transaction });
//             }
//           }
//         }
//       }

//       await transaction.commit();

//     } catch (error) {
//       console.error("Error in processing batch", error);
//       errors.push({ rowNumber: meta.startRow, errors: [`Database error: ${error.message}`] });
//       await transaction.rollback();
//       throw error;
//     }
//   }
//   console.log('errors', errors);

//   return { errors };
// };

// Validation function to check row data
const validateRowData = (data) => {
  const errors = [];

  if (!data?.rowData?.full_name) errors.push("Full name is required");
  if (!data?.rowData?.email) errors.push("Email is required");
  if (!data?.rowData?.phone) errors.push("Phone is required");
  if (!data?.rowData?.source_id) errors.push("Invalid source");
  if (!data?.rowData?.channel_id) errors.push("Invalid channel");
  if (!data?.rowData?.office_type) errors.push("Invalid office type");

  return errors;
};

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