const { validationResult, check } = require("express-validator");
const db = require("../models");
const { checkIfEntityExists, getStageData } = require("../utils/helper");
const { addLeadHistory, getRegionDataForHistory } = require("../utils/academic_query_helper");
const { createTaskDesc } = require("../utils/task_description");
const IdsFromEnv = require("../constants/ids");
const UserPrimaryInfo = db.userPrimaryInfo;
const Status = db.status;
const StatusAccessRole = db.statusAccessRoles;
const AccessRole = db.accessRoles;
const AdminUsers = db.adminUsers;
const sequelize = db.sequelize;

exports.createLead = async (req, res) => {
  // Validate the request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  // Destructure the validated request body
  let {
    full_name,
    email,
    phone,
    source_id,
    channel_id,
    city,
    preferred_country, // This should be an array of country IDs
    office_type,
    region_id,
    flag_id,
    counsiler_id,
    branch_id,
    updated_by,
    remarks,
    lead_received_date,
    zipcode,
    ielts,
    franchise_id,
    lead_type_id,
  } = req.body;
  const { role_id } = req;

  preferred_country = preferred_country ? JSON.parse(preferred_country) : null;
  flag_id = flag_id ? JSON.parse(flag_id) : null;

  const examDocuments = req.files && req.files["exam_documents"];

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    const userId = req.userDecodeId;
    const role = req.role_name;

    const creTl = await AdminUsers.findOne({
      where: { role_id: process.env.CRE_TL_ID },
      include: [
        {
          model: db.accessRoles,
          attributes: ["role_name"],
        },
      ],
    }); // Find the user_id of cre_tl

    // Check if referenced IDs exist in their respective tables
    const leadTypeExists = await checkIfEntityExists("lead_type", lead_type_id);
    if (!leadTypeExists) {
      await transaction.rollback(); // Rollback the transaction if category ID is invalid
      return res.status(400).json({
        status: false,
        message: "Invalid Lead Type ID provided",
        errors: [{ msg: "Please provide a valid Lead Type ID" }],
      });
    }

    const sourceExists = await checkIfEntityExists("lead_source", source_id);
    if (!sourceExists) {
      await transaction.rollback(); // Rollback the transaction if source ID is invalid
      return res.status(400).json({
        status: false,
        message: "Invalid source ID provided",
        errors: [{ msg: "Please provide a valid source ID" }],
      });
    }

    const channelExists = await checkIfEntityExists("lead_channel", channel_id);
    if (!channelExists) {
      await transaction.rollback(); // Rollback the transaction if channel ID is invalid
      return res.status(400).json({
        status: false,
        message: "Invalid channel ID provided",
        errors: [{ msg: "Please provide a valid channel ID" }],
      });
    }

    const officeExists = await checkIfEntityExists("office_type", office_type);
    if (!officeExists) {
      await transaction.rollback(); // Rollback the transaction if office type ID is invalid
      return res.status(400).json({
        status: false,
        message: "Invalid office type ID provided",
        errors: [{ msg: "Please provide a valid office type ID" }],
      });
    }

    let regionalManagerId = null;
    let regionMangerRoleName = null;
    if (region_id !== "null") {
      const regionExists = await checkIfEntityExists("region", region_id);
      if (!regionExists) {
        await transaction.rollback();
        return res.status(400).json({
          status: false,
          message: "Invalid region ID provided",
          errors: [{ msg: "Please provide a valid region ID" }],
        });
      }

      // Fetch the regional manager for the region
      const region = await db.region.findOne({
        where: { id: region_id },
        attributes: ["regional_manager_id","region_name"], // Fetch regional_manager_id from the region table
        include: [
          {
            model: db.adminUsers, // Include associated adminUsers
            attributes: ["id"], // Select these attributes from adminUsers
            as: "regional_manager",
            required: false, // This ensures it's a LEFT JOIN, allowing null adminUsers
            include: [
              {
                model: db.accessRoles, // Include the role associated with adminUsers
                attributes: ["role_name"], // Select the role_name from accessRoles
                required: false, // This ensures it's a LEFT JOIN for accessRoles as well
              },
            ],
          },
        ],
      });

      // Set the regionalManagerId only if the region exists
      regionalManagerId = region ? region.regional_manager_id : null;
      regionMangerRoleName = region?.adminUsers?.accessRoles?.role_name || "Region Manager";

    }

    if (counsiler_id !== "null") {
      const counsilerExists = await checkIfEntityExists("admin_user", counsiler_id);
      if (!counsilerExists) {
        await transaction.rollback(); // Rollback the transaction if counsiler ID is invalid
        return res.status(400).json({
          status: false,
          message: "Invalid counsiler ID provided",
          errors: [{ msg: "Please provide a valid counsiler ID" }],
        });
      }
    }

    if (branch_id !== "null") {
      const branchExists = await checkIfEntityExists("branch", branch_id);
      if (!branchExists) {
        await transaction.rollback(); // Rollback the transaction if branch ID is invalid
        return res.status(400).json({
          status: false,
          message: "Invalid branch ID provided",
          errors: [{ msg: "Please provide a valid branch ID" }],
        });
      }
    }

    if (updated_by !== null) {
      const updatedByExists = await checkIfEntityExists("admin_user", updated_by);
      if (!updatedByExists) {
        await transaction.rollback(); // Rollback the transaction if updated by ID is invalid
        return res.status(400).json({
          status: false,
          message: "Invalid updated by ID provided",
          errors: [{ msg: "Please provide a valid updated by ID" }],
        });
      }
    }

    // Check if email already exists
    const existingEmailUser = await UserPrimaryInfo.findOne({
      where: { email },
    });
    if (existingEmailUser) {
      await transaction.rollback(); // Rollback transaction if email is not unique
      return res.status(400).json({
        status: false,
        message: "User with the same email already exists",
        errors: [{ msg: "Email must be unique" }],
      });
    }

    const existingPhone = await UserPrimaryInfo.findOne({ where: { phone } });
    if (existingPhone) {
      await transaction.rollback();
      return res.status(400).json({
        status: false,
        message: "User with the same phone number already exists",
        errors: [{ msg: "Phone number must be unique" }],
      });
    }

    const receivedDate = new Date();
    const userRole = await db.adminUsers.findOne({ where: { id: userId } });
    const stage = getStageData(office_type, role_id);

    // Create user and related information
    const userPrimaryInfo = await UserPrimaryInfo.create(
      {
        full_name,
        email,
        phone,
        city,
        office_type,
        lead_type_id,
        source_id,
        channel_id,
        zipcode,
        region_id: region_id != "null" ? region_id : null,
        flag_id: flag_id != "null" ? flag_id : null,
        franchise_id: franchise_id != "null" ? franchise_id : null,
        counsiler_id: counsiler_id != "null" ? counsiler_id : null,
        branch_id: branch_id != "null" ? branch_id : null,
        updated_by,
        remarks,
        ielts,
        lead_received_date: lead_received_date || receivedDate,
        assigned_cre_tl: userRole?.role_id == process.env.IT_TEAM_ID && office_type == process.env.CORPORATE_OFFICE_ID ? creTl?.id : null,
        created_by: userId,
        assign_type: userRole?.role_id == process.env.CRE_ID ? "direct_assign" : null,
        regional_manager_id: userRole?.role_id == process.env.IT_TEAM_ID ? regionalManagerId : null,
        stage,
      },
      { transaction }
    );

    const userPrimaryId = userPrimaryInfo?.id;

    if (userPrimaryId) {
      await addLeadHistory(userPrimaryId, `Lead created by ${role}`, userId, null, transaction);
    }

    if (userRole?.role_id == process.env.IT_TEAM_ID && office_type == process.env.CORPORATE_OFFICE_ID) {
      await addLeadHistory(userPrimaryId, `Lead assigned to ${creTl?.access_role.role_name}`, userId, null, transaction);
    } else if (userRole?.role_id == process.env.IT_TEAM_ID && regionalManagerId) {
      const region = await getRegionDataForHistory(region_id);
      await addLeadHistory(userPrimaryId, `Lead assigned to ${regionMangerRoleName} - ${region?.region_name}`, userId, null, transaction);
    }

    if (preferred_country.length > 0) {
      const studyPreferences = await Promise.all(
        preferred_country.map(async (countryId) => {
          return await db.studyPreference.create(
            {
              userPrimaryInfoId: userPrimaryId,
              countryId,
            },
            { transaction } // Pass the transaction here inside the create call
          );
        })
      );
    }

    // Associate the preferred countries with the user
    if (Array.isArray(preferred_country) && preferred_country.length > 0) {

      const countryAssociations = preferred_country.map((countryId) => ({
        user_primary_info_id: userPrimaryInfo.id, // Assuming this is defined earlier
        country_id: countryId,
        status_id: IdsFromEnv.NEW_LEAD_STATUS_ID, // Add the desired status_id
      }));

      // Use bulkCreate with `updateOnDuplicate` to ensure no duplicates
      await db.userContries.bulkCreate(countryAssociations, {
        transaction,
      });
    }

    if (
      userRole?.role_id == process.env.CRE_ID ||
      userRole?.role_id == process.env.COUNSELLOR_ROLE_ID ||
      userRole?.role_id == process.env.BRANCH_COUNSELLOR_ID ||
      userRole?.role_id == process.env.FRANCHISE_COUNSELLOR_ID ||
      userRole?.role_id == process.env.COUNTRY_MANAGER_ID
    ) {
      const dueDate = new Date();

      // const country = await db.country.findByPk(preferred_country[0]);  // Assuming at least one country is selected
      const country = await db.country.findAll({
        where: { id: preferred_country },
      }); // Assuming at least one country is selected
      // const countryNames = country.map((c) => c.country_name).join(", ");
      const countryNames = country.map((c) => c.country_code).join(", ");

      let formattedDesc = await createTaskDesc(userPrimaryInfo, userPrimaryInfo.id);

      if (!formattedDesc) {
        return res.status(500).json({
          status: false,
          message: "Description error",
        });
      }

      // Create a task for the new lead
      const task = await db.tasks.create(
        {
          studentId: userPrimaryInfo.id,
          userId: userId,
          title: `${full_name} - ${countryNames}`,
          // description: `${full_name} from ${city}, has applied for admission in ${countryNames}`,
          description: formattedDesc,
          dueDate: dueDate,
          updatedBy: userId,
          assigned_country: preferred_country[0],
        },
        { transaction }
      );
      await addLeadHistory(userPrimaryInfo.id, `Task created for ${role}`, userId, null, transaction);

      if (userRole?.role_id == process.env.COUNSELLOR_ROLE_ID) {
        await db.userCounselors.create({ user_id: userPrimaryInfo.id, counselor_id: userId });
      }
    } else if (userRole?.role_id == process.env.CRE_RECEPTION_ID) {
      let leastAssignedUsers = [];

      for (const countryId of preferred_country) {
        const users = await getLeastAssignedUsers(countryId);
        if (users?.leastAssignedUserId) {
          leastAssignedUsers = leastAssignedUsers.concat(users.leastAssignedUserId);
        }
      }

      if (leastAssignedUsers.length > 0) {
        // Remove existing counselors for the student
        await db.userCounselors.destroy({
          where: { user_id: userPrimaryInfo.id },
        });

        // Add new counselors
        const userCounselorsData = leastAssignedUsers?.map((userId) => ({
          user_id: userPrimaryInfo.id,
          counselor_id: userId,
        }));

        await addLeadHistory(userPrimaryInfo.id, `Lead assigned to Counsellors`, userId, null, transaction);

        await db.userCounselors.bulkCreate(userCounselorsData);

        const dueDate = new Date();

        let countryName = "Unknown";
        if (preferred_country.length > 0) {
          // const country = await db.country.findByPk(countryIds[0]);
          const countries = await db.country.findAll({
            where: { id: preferred_country },
            attributes: ["country_name","country_code"],
          });

          if (countries) {
            // countryName = countries.map((country) => country.country_name).join(", ");
            countryName = countries.map((country) => country.country_code).join(", ");
          }
        }

        let formattedDesc = await createTaskDesc(userPrimaryInfo, userPrimaryInfo.id);

        if (!formattedDesc) {
          return res.status(500).json({
            status: false,
            message: "Description error",
          });
        }

        // Create tasks for each least assigned user
        for (const leastUserId of leastAssignedUsers) {
          const task = await db.tasks.create(
            {
              studentId: userPrimaryInfo.id,
              userId: leastUserId,
              title: `${userPrimaryInfo.full_name} - ${countryName}`,
              // description: `${userPrimaryInfo.full_name} from ${userPrimaryInfo?.city}, has applied for admission in ${countryName}`,
              description: formattedDesc,
              dueDate: dueDate,
              updatedBy: userId,
              assigned_country: preferred_country[0],
            },
            { transaction }
          );
        }

        await addLeadHistory(userPrimaryInfo.id, `Task assigned to Counsellors`, userId, null, transaction);
      }
    } else if (userRole?.role_id == process.env.IT_TEAM_ID) {

      if (franchise_id) {
        let leastAssignedUsers = [];
        for (const countryId of preferred_country) {
          const users = await getLeastAssignedCounsellor(countryId, franchise_id);
          if (users?.leastAssignedUserId) {
            leastAssignedUsers = leastAssignedUsers.concat(users.leastAssignedUserId);
          }
        }

        if (leastAssignedUsers.length > 0) {
          // Remove existing counselors for the student
          await db.userCounselors.destroy({
            where: { user_id: userPrimaryInfo.id },
          });

          // Add new counselors
          const userCounselorsData = leastAssignedUsers?.map((userId) => ({
            user_id: userPrimaryInfo.id,
            counselor_id: userId,
          }));

          await addLeadHistory(userPrimaryInfo.id, `Lead assigned to Franchise Counsellor`, userId, null, transaction);

          await db.userCounselors.bulkCreate(userCounselorsData);

          const dueDate = new Date();

          let countryName = "Unknown";
          if (preferred_country.length > 0) {
            // const country = await db.country.findByPk(countryIds[0]);
            const countries = await db.country.findAll({
              where: { id: preferred_country },
              attributes: ["country_name","country_code"],
            });

            if (countries) {
              // countryName = countries.map((country) => country.country_name).join(", ");
              countryName = countries.map((country) => country.country_code).join(", ");
            }
          }

          let formattedDesc = await createTaskDesc(userPrimaryInfo, userPrimaryInfo.id);

          if (!formattedDesc) {
            return res.status(500).json({
              status: false,
              message: "Description error",
            });
          }

          // Create tasks for each least assigned user
          for (const leastUserId of leastAssignedUsers) {
            const task = await db.tasks.create(
              {
                studentId: userPrimaryInfo.id,
                userId: leastUserId,
                title: `${userPrimaryInfo.full_name} - ${countryName}`,
                // description: `${userPrimaryInfo.full_name} from ${userPrimaryInfo?.city}, has applied for admission in ${countryName}`,
                description: formattedDesc,
                dueDate: dueDate,
                updatedBy: userId,
                assigned_country: preferred_country[0],
              },
              { transaction }
            );
          }

          await addLeadHistory(userPrimaryInfo.id, `Task assigned to Franchise Counsellor`, userId, null, transaction);
        }
      }
    }

    // Commit the transaction
    await transaction.commit();

    // Respond with success
    return res.status(201).json({
      status: true,
      message: "Lead created successfully",
      data: { userPrimaryInfo },
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    console.error(`Error Lead: ${error}`);

    // Respond with an error
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.updateLead = async (req, res) => {
  // Validate the request
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  const { id } = req.params; // Get the lead ID from the URL parameters
  let {
    full_name,
    email,
    phone,
    lead_type_id,
    source_id,
    channel_id,
    city,
    preferred_country, // This should be an array of country IDs
    office_type,
    ielts,
    region_id,
    flag_id,
    counsiler_id,
    branch_id,
    updated_by,
    remarks,
    lead_received_date,
    zipcode,
    franchise_id,
  } = req.body;



  preferred_country = preferred_country ? JSON.parse(preferred_country) : null;
  flag_id = flag_id ? JSON.parse(flag_id) : null;



  const examDocuments = req.files && req.files["exam_documents"];

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    const lead = await UserPrimaryInfo.findByPk(id);
    if (!lead) {
      await transaction.rollback();
      return res.status(404).json({
        status: false,
        message: "Lead not found",
      });
    }

    // Check if referenced IDs exist in their respective tables
    const entities = [
      { model: "lead_source", id: source_id },
      { model: "lead_channel", id: channel_id },
      { model: "lead_type", id: lead_type_id },
      { model: "office_type", id: office_type },
      { model: "region", id: region_id !== "null" ? region_id : null },
      {
        model: "admin_user",
        id: counsiler_id !== "null" ? counsiler_id : null,
      },
      { model: "branch", id: branch_id !== "null" ? branch_id : null },
      { model: "admin_user", id: updated_by },
    ];

    for (const entity of entities) {
      if (entity.id !== null && !(await checkIfEntityExists(entity.model, entity.id))) {
        await transaction.rollback();
        return res.status(400).json({
          status: false,
          message: `Invalid ${entity.model.replace("_", " ")} ID provided`,
          errors: [
            {
              msg: `Please provide a valid ${entity.model.replace("_", " ")} ID`,
            },
          ],
        });
      }
    }

    // Check if email or phone already exists
    if (email && email !== lead.email) {
      const existingEmailUser = await UserPrimaryInfo.findOne({
        where: { email },
      });
      if (existingEmailUser) {
        await transaction.rollback();
        return res.status(400).json({
          status: false,
          message: "User with the same email already exists",
          errors: [{ msg: "Email must be unique" }],
        });
      }
    }

    if (phone && phone !== lead.phone) {
      const existingPhone = await UserPrimaryInfo.findOne({ where: { phone } });
      if (existingPhone) {
        await transaction.rollback();
        return res.status(400).json({
          status: false,
          message: "User with the same phone number already exists",
          errors: [{ msg: "Phone number must be unique" }],
        });
      }
    }

    let regionalManagerId = null;
    if (region_id !== "null") {
      const region = await db.region.findOne({ where: { id: region_id } });
      regionalManagerId = region ? region.regional_manager_id : null;
    }

    // Update user information
    await lead.update(
      {
        full_name,
        email,
        phone,
        city,
        office_type,
        lead_type_id,
        source_id,
        channel_id,
        region_id: region_id !== "null" ? region_id : null,
        flag_id: flag_id !== "null" ? flag_id : null,
        franchise_id: franchise_id != "null" ? franchise_id : null,
        counsiler_id: counsiler_id !== "null" ? counsiler_id : null,
        branch_id: branch_id !== "null" ? branch_id : null,
        updated_by,
        remarks,
        ielts,
        lead_received_date,
        zipcode,
        regional_manager_id: regionalManagerId,
      },
      { transaction }
    );

    // Handle preferred country assignments
    const currentPreferredCountries = await lead.getPreferredCountries();

    // Check if preferred countries are changed
    if (Array.isArray(preferred_country) && preferred_country.length > 0) {
      const currentCountryIds = currentPreferredCountries.map((country) => country.id);

      if (JSON.stringify(currentCountryIds.sort()) !== JSON.stringify(preferred_country.sort())) {
        // Remove current assignments
        await lead.setPreferredCountries([], { transaction });

        // Add new assignments
        await lead.setPreferredCountries(preferred_country, { transaction });
      }
    }

    if (Array.isArray(preferred_country) && preferred_country.length > 0) {
      await lead.setPreferredCountries(preferred_country, {
        transaction,
      });
    }

    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "Lead updated successfully",
      data: { lead },
    });
  } catch (error) {
    await transaction.rollback();
    console.error(`Error updating lead: ${error}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.deleteLead = async (req, res) => {
  const { id } = req.params;

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    const lead = await UserPrimaryInfo.findByPk(id);
    if (!lead) {
      await transaction.rollback();
      return res.status(404).json({
        status: false,
        message: "Lead not found",
      });
    }

    await lead.update({ is_deleted: true }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error(`Error deleting lead: ${error}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.updateUserStatus = async (req, res) => {
  const { status_id, lead_id, followup_date, country_id } = req.body;
  const { userDecodeId: userId, role_name, role_id } = req;

  // Start a transaction
  const transaction = await sequelize.transaction();
  try {
    // Check if the status_id exists
    const statusExists = await Status.findOne({
      where: { id: status_id },
    });

    if (!statusExists) {
      await transaction.rollback();
      return res.status(400).json({
        status: false,
        message: "Invalid status ID",
      });
    }

    // Check if the user exists
    const leadExists = await UserPrimaryInfo.findOne({
      where: { id: lead_id },
    });

    if (!leadExists) {
      await transaction.rollback();
      return res.status(404).json({
        status: false,
        message: "Lead not found",
      });
    }

    const userExists = await AdminUsers.findOne({
      where: { id: userId },
    });

    if (!userExists) {
      await transaction.rollback();
      return res.status(404).json({
        status: false,
        message: "Admin not found",
      });
    }

    const userRoleId = userExists.role_id;
    const countryId = userExists?.country_id;

    // Check if the status_id and userRoleId have a valid match in status_access_roles
    const accessRoleExists = await StatusAccessRole.findOne({
      where: { status_id: status_id, access_role_id: userRoleId },
    });

    if (!accessRoleExists) {
      await transaction.rollback();
      return res.status(403).json({
        status: false,
        message: "User does not have access to this status",
      });
    }
    const statusName = statusExists.status_name;
    // Update user status
    // await leadExists.update({ status_id, followup_date }, { transaction });

    const exisTask = await db.tasks.findOne({ where: { studentId: lead_id, userId: userId } });

    await exisTask.update({ dueDate: followup_date }, { transaction });

    let [existUserCountry] = await db.userContries.update(
      { status_id: status_id, followup_date: followup_date },
      { where: { user_primary_info_id: lead_id, country_id: country_id } }
    );

    if (existUserCountry == 0) {
      await transaction.rollback();
      return res.status(403).json({
        status: false,
        message: "Status not changed",
      });
    }

    if (role_id == process.env.COUNSELLOR_ROLE_ID) {
      await addLeadHistory(lead_id, `Status changed to ${statusName} by ${role_name}`, userId, countryId, transaction);
    } else {
      await addLeadHistory(lead_id, `Status changed to ${statusName} by ${role_name}`, userId, null, transaction);
    }

    await transaction.commit();
    return res.status(200).json({
      status: true,
      message: "User status updated successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error(`Error updating user status: ${error}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.getStatusWithAccessPowers = async (req, res) => {
  const { user_role } = req.query;
  const transaction = await sequelize.transaction();
  try {
    const statuses = await Status.findAll({
      include: {
        model: AccessRole,
        through: {
          attributes: [], // Exclude the join table attributes
        },
        where: {
          id: user_role,
        },
        attributes: [],
      },
      attributes: ["id", "status_name", "status_description"],
    });
    await transaction.commit();
    return res.status(200).json({
      status: true,
      message: "Statuses fetched successfully",
      data: statuses,
    });
  } catch (error) {
    await transaction.rollback();
    console.error(`Error updating user status: ${error}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

const getLeastAssignedUsers = async (countryId) => {
  const roleId = process.env.COUNSELLOR_ROLE_ID;
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
          AND "admin_users"."country_id" = :countryId
          AND "admin_users"."status" = true
        GROUP BY "admin_users"."id"
      )
      SELECT "user_id"
      FROM user_assignments
      ORDER BY "assignment_count" ASC, "user_id" ASC
      LIMIT 1;
    `,
      {
        replacements: { roleId, countryId },
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

exports.deleteExams = async (req, res) => {
  const { exam_type, id } = req.body;

  try {
    const exam = await db.userExams.destroy({
      where: {
        exam_type: exam_type,
        student_id: id,
      },
    });

    if (exam > 0) {
      return res.status(200).json({
        status: true,
        message: "Exam deleted successfully",
      });
    } else {
      return res.status(404).json({
        status: false,
        message: "Exam deleteion failed",
      });
    }
  } catch (error) {
    console.error(`Error deleting Exam: ${error}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.getRemarkDetails = async (req, res) => {
  const { id } = req.params;


  try {
    const existLead = await UserPrimaryInfo.findByPk(id);

    if (!existLead) {
      return res.status(404).json({
        status: false,
        message: "User Primary Info not found",
      });
    }

    return res.status(200).json({
      status: true,
      data: existLead?.remark_details || [],
      message: "Remark Fetched successfully",
    });
  } catch (error) {
    console.error(`Error Fetching Remark : ${error}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.createRemarkDetails = async (req, res) => {
  const { remark, followup_date, status_id, lead_id } = req.body;
  const userId = req.userDecodeId;

  try {
    const existLead = await UserPrimaryInfo.findByPk(lead_id);

    const remarkLength = existLead?.remark_details?.length || 0;

    if (!existLead) {
      return res.status(404).json({
        status: false,
        message: "User Primary Info not found",
      });
    }

    const status = await db.status.findByPk(status_id, {
      attributes: ["status_name", "color"],
    });

    const user = await db.adminUsers.findByPk(userId, {
      attributes: ["name"],
    });

    const formattedRemark = JSON.stringify({
      id: remarkLength + 1,
      followup_date: followup_date,
      remark: remark,
      status: status?.status_name,
      created_by_name: user?.name,
      color: status?.color,
    });

    const updateRemark = await UserPrimaryInfo.update(
      {
        remark_details: db.Sequelize.literal(`jsonb_build_array('${formattedRemark}'::jsonb) || COALESCE(remark_details, '[]'::jsonb)`),
      },
      { where: { id: lead_id } }
    );

    if (!updateRemark) {
      return res.status(404).json({
        status: false,
        message: "Remark not saved",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Remark Created successfully",
    });
  } catch (error) {
    console.error(`Error Saving Remark : ${error}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.updateRemarkDetails = async (req, res) => {
  const { id } = req.params;
  const { remark, followup_date, status_id, remark_id } = req.body;
  const userId = req.userDecodeId;

  try {
    const existLead = await UserPrimaryInfo.findByPk(id);

    if (!existLead) {
      return res.status(404).json({
        status: false,
        message: "User Primary Info not found",
      });
    }

    const status = await db.status.findByPk(status_id, {
      attributes: ["status_name", "color"],
    });

    const user = await db.adminUsers.findByPk(userId, {
      attributes: ["name"],
    });

    const formattedOneRemark = {
      id: remark_id,
      followup_date: followup_date,
      remark: remark,
      status: status?.status_name,
      created_by_name: user?.name,
      color: status?.color,
    };

    const remarkIndex = existLead?.remark_details.findIndex((data) => data.id == remark_id);
    const remarkArray = existLead.remark_details;


    remarkArray.splice(remarkIndex, 1, formattedOneRemark);

  

    const updateRemark = await UserPrimaryInfo.update(
      {
        // comment_details: db.Sequelize.literal(`jsonb_build_array('${formattedComment}'::jsonb) || COALESCE(comment_details, '[]'::jsonb)`)
        remark_details: remarkArray,
      },
      { where: { id: id } }
    );

    if (!updateRemark) {
      return res.status(404).json({
        status: false,
        message: "Remark not updated",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Remark Updated successfully",
    });
  } catch (error) {
    console.error(`Error Saving Remark : ${error}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.updateFlagStatus = async (req, res) => {
  const { id } = req.params;
  const { flag_id } = req.body;

  const { role_name, userDecodeId, role_id } = req;
  const transaction = await db.sequelize.transaction();

  try {
    const flag = await db.flag.findByPk(flag_id, {
      attributes: ["flag_name"],
    });

    if (!flag) {
      return res.status(404).json({
        status: false,
        message: "Flag not found",
      });
    }

    const existFlag = await db.userPrimaryInfo.findByPk(id, { attributes: ["id", "flag_id"] });

    const newFlagArr = [...(existFlag?.flag_id || []), flag_id];

    const [affectedRows] = await db.userPrimaryInfo.update({ flag_id: newFlagArr }, { where: { id: id }, transaction });

    if (affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: "Flag not updated",
      });
    }

    if (role_id == process.env.COUNSELLOR_ROLE_ID) {
      const { country_id } = await db.adminUsers.findByPk(userDecodeId);

      await addLeadHistory(id, `Flag updated to ${flag.flag_name} by ${role_name}`, userDecodeId, country_id, transaction);
    } else {
      await addLeadHistory(id, `Flag updated to ${flag.flag_name} by ${role_name}`, userDecodeId, null, transaction);
    }

    // commit the transaction
    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "Flag Updated successfully",
    });
  } catch (error) {
    console.error(`Error Saving Comment : ${error}`);
    // rollback transaction
    await transaction.rollback();
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.removeFlagStatus = async (req, res) => {
  const { id } = req.params;
  const { flag_id } = req.body;

  const { role_name, userDecodeId, role_id } = req;
  const transaction = await db.sequelize.transaction();

  try {
    const flag = await db.flag.findByPk(flag_id, {
      attributes: ["flag_name"],
    });

    if (!flag) {
      return res.status(404).json({
        status: false,
        message: "Flag not found",
      });
    }

    const existFlag = await db.userPrimaryInfo.findByPk(id, { attributes: ["id", "flag_id"] });
    const removedFlagArr = existFlag?.flag_id?.filter((flagId) => flagId != flag_id);

    const [affectedRows] = await db.userPrimaryInfo.update({ flag_id: removedFlagArr }, { where: { id: id }, transaction });

    if (affectedRows === 0) {
      return res.status(404).json({
        status: false,
        message: "Flag not updated",
      });
    }

    if (role_id == process.env.COUNSELLOR_ROLE_ID) {
      const { country_id } = await db.adminUsers.findByPk(userDecodeId);

      await addLeadHistory(id, `${flag.flag_name} Flag removed by ${role_name}`, userDecodeId, country_id, transaction);
    } else {
      await addLeadHistory(id, `${flag.flag_name} Flag removed by ${role_name}`, userDecodeId, null, transaction);
    }

    // commit the transaction
    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "Flag Updated successfully",
    });
  } catch (error) {
    console.error(`Error : ${error}`);
    // rollback transaction
    await transaction.rollback();
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};
