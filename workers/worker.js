const db = require("../models");
const { addLeadHistory } = require("../utils/academic_query_helper");
const { createTaskDesc } = require('../utils/task_description');

module.exports = async function processBatch(batch) {
  const { rows, meta, userDecodeId, role, creTLrole } = batch;

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
      });

      for (const user of createdUsers) {

        const userId = user.id;
        const userJsonData = validData.find((data) => data.rowData.email == user.email);

        let preferredCountries = userJsonData.rowData.preferred_country;

        const franchiseId = user.franchise_id;

        if (user.id) {
          await addLeadHistory(user.id, `Lead created by ${role}`, userDecodeId, null, null);
        }

        if (userRole?.role_id == process.env.IT_TEAM_ID && user.office_type == process.env.CORPORATE_OFFICE_ID) {
          await addLeadHistory(user.id, `Lead assigned to ${creTLrole}`, userDecodeId, null, null);
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
          await db.userContries.bulkCreate(userCountries);
        }

        // Create study preferences for the user
        if (preferredCountries.length > 0) {
          await Promise.all(
            preferredCountries.map(async (countryId) => {
              await db.studyPreference.create({
                userPrimaryInfoId: userId,
                countryId,
              });
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

            await db.userCounselors.bulkCreate(userCounselorsData);

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
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in processing batch", error);
      errors.push({ rowNumber: meta.startRow, errors: [`Database error: ${error.message}`] });
    }
  }

  return { errors };
};

// Validation function to check row data
const validateRowData = (data) => {
  const errors = [];

  if (!data.rowData.full_name) errors.push("Full name is required");
  if (!data.rowData.email) errors.push("Email is required");
  if (!data.rowData.phone) errors.push("Phone is required");
  if (!data.rowData.source_id) errors.push("Invalid source");
  if (!data.rowData.channel_id) errors.push("Invalid channel");
  if (!data.rowData.office_type) errors.push("Invalid office type");

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