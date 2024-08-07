const { validationResult, check } = require("express-validator");
const db = require("../models");
const { checkIfEntityExists } = require("../utils/helper");
const UserPrimaryInfo = db.userPrimaryInfo;
const Status = db.status;
const StatusAccessRole = db.statusAccessRoles;
const AccessRole = db.accessRoles;
const AdminUsers = db.adminUsers;
const sequelize = db.sequelize;
const { Op, Sequelize, where } = require("sequelize");

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
  const {
    full_name,
    email,
    phone,
    category_id,
    source_id,
    channel_id,
    city,
    preferred_country,  // This should be an array of country IDs
    office_type,
    region_id,
    counsiler_id,
    branch_id,
    updated_by,
    remarks,
    lead_received_date,
    ielts,
  } = req.body;

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    const userId = req.userDecodeId;
    console.log("userId===>", userId);
    const creTl = await AdminUsers.findOne({ where: { role_id: process.env.CRE_TL_ID } });  // Find the user_id of cre_tl
    const user = await AdminUsers.findOne({ where: { id: userId } });

    // Check if referenced IDs exist in their respective tables
    const categoryExists = await checkIfEntityExists("lead_category", category_id);
    if (!categoryExists) {
      await transaction.rollback(); // Rollback the transaction if category ID is invalid
      return res.status(400).json({
        status: false,
        message: "Invalid category ID provided",
        errors: [{ msg: "Please provide a valid category ID" }],
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

    // Only check existence for non-null fields
    if (region_id !== null) {
      const regionExists = await checkIfEntityExists("region", region_id);
      if (!regionExists) {
        await transaction.rollback(); // Rollback the transaction if region ID is invalid
        return res.status(400).json({
          status: false,
          message: "Invalid region ID provided",
          errors: [{ msg: "Please provide a valid region ID" }],
        });
      }
    }

    if (counsiler_id !== null) {
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

    if (branch_id !== null) {
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

    // Create user and related information
    const userPrimaryInfo = await UserPrimaryInfo.create(
      {
        full_name,
        email,
        phone,
        city,
        office_type,
        category_id,
        source_id,
        channel_id,
        region_id,
        counsiler_id,
        branch_id,
        updated_by,
        remarks,
        lead_received_date: lead_received_date || receivedDate,
        assigned_cre_tl: user.id === 2 && creTl ? creTl.id : null,
        created_by: userId,
        ielts,
        // preferred_country: preferred_country[0]
      },
      { transaction }
    );

    // Associate the preferred countries with the user
    if (Array.isArray(preferred_country) && preferred_country.length > 0) {
      await userPrimaryInfo.setPreferredCountries(preferred_country, { transaction });
    }

    const userRole = await db.adminUsers.findOne({ where: { id: userId } });

    console.log("userRole====>", userRole.role_id);


    if (userRole?.role_id === process.env.CRE_ID) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);

      // const country = await db.country.findByPk(preferred_country[0]);  // Assuming at least one country is selected
      const country = await db.country.findAll({ where: { id: preferred_country } });  // Assuming at least one country is selected
      const countryNames = country.map(c => c.country_name).join(", ");

      // Create a task for the new lead
      const task = await db.tasks.create(
        {
          studentId: userPrimaryInfo.id,
          userId: userId,
          title: `${full_name} - ${countryNames} - ${phone}`,
          dueDate: dueDate,
          updatedBy: userId,
        },
        { transaction }
      );
    }

    if (userRole?.role_id == process.env.CRE_RECEPTION_ID || 5) {
      console.log("CRE RECEPTION =============>");
      
      let leastAssignedUsers = [];

      for (const countryId of preferred_country) {

        const users = await getLeastAssignedUsers(countryId);
        if (users?.leastAssignedUserId) {
          leastAssignedUsers = leastAssignedUsers.concat(users.leastAssignedUserId);
        }
        console.log("leastAssignedUserId ==========>", users.leastAssignedUserId);
      }

      console.log("leastAssignedUsers ==>", leastAssignedUsers);
      

      if (leastAssignedUsers.length > 0) {
        // Remove existing counselors for the student
        await db.userCounselors.destroy({
          where: { user_id: userPrimaryInfo.id },
        });

        // Add new counselors
        const userCounselorsData = leastAssignedUsers.map(userId => ({
          user_id: userPrimaryInfo.id,
          counselor_id: userId,
        }));

        await db.userCounselors.bulkCreate(userCounselorsData);

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);

        let countryName = "Unknown";
        if (preferred_country.length > 0) {
          // const country = await db.country.findByPk(countryIds[0]);
          const countries = await db.country.findAll({
            where: { id: preferred_country },
            attributes: ['country_name'],
          });

          if (countries) {
            countryName = countries.map(country => country.country_name).join(', ');
          }
        }

        // Create tasks for each least assigned user
        for (const leastUserId of leastAssignedUsers) {
          console.log("leastUserId ============>", leastUserId);
          console.log("userPrimaryInfo.id ============>", userPrimaryInfo.id);

          const task = await db.tasks.create(
            {
              studentId: userPrimaryInfo.id,
              userId: leastUserId,
              title: `${userPrimaryInfo.full_name} - ${countryName} - ${userPrimaryInfo.phone}`,
              dueDate: dueDate,
              updatedBy: userId,
            },
            { transaction }
          );
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
      message: "Internal server error",
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
  const {
    full_name,
    email,
    phone,
    category_id,
    source_id,
    channel_id,
    city,
    preferred_country, // This should be an array of country IDs
    office_type,
    region_id,
    counsiler_id,
    branch_id,
    updated_by,
    remarks,
    lead_received_date,
    ielts,
  } = req.body;


  console.log("body =========>", req.body);

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
      { model: "lead_category", id: category_id },
      { model: "lead_source", id: source_id },
      { model: "lead_channel", id: channel_id },
      { model: "office_type", id: office_type },
      { model: "region", id: region_id },
      { model: "admin_user", id: counsiler_id },
      { model: "branch", id: branch_id },
      { model: "admin_user", id: updated_by },
    ];

    for (const entity of entities) {
      if (
        entity.id !== null &&
        !(await checkIfEntityExists(entity.model, entity.id))
      ) {
        await transaction.rollback();
        return res.status(400).json({
          status: false,
          message: `Invalid ${entity.model.replace("_", " ")} ID provided`,
          errors: [
            {
              msg: `Please provide a valid ${entity.model.replace(
                "_",
                " "
              )} ID`,
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

    // Update user information
    await lead.update(
      {
        full_name,
        email,
        phone,
        city,
        office_type,
        category_id: category_id ? category_id : null,
        source_id,
        channel_id,
        region_id,
        counsiler_id,
        branch_id,
        updated_by,
        remarks,
        lead_received_date,
        ielts,
      },
      { transaction }
    );

    // Update associated preferred countries
    if (Array.isArray(preferred_country) && preferred_country.length > 0) {
      await lead.setPreferredCountries(preferred_country, { transaction });
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
      message: "Internal server error",
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
      message: "Internal server error",
    });
  }
};

exports.updateUserStatus = async (req, res) => {
  const { status_id, lead_id } = req.body;
  const userId = req.userDecodeId;

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
    // Update user status
    await leadExists.update({ status_id }, { transaction });
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
      message: "Internal server error",
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
      message: "Internal server error",
    });
  }
};


const getLeastAssignedUsers = async (countryId) => {
  const roleId = process.env.COUNSELLOR_ROLE_ID;
  try {
    // Use raw SQL to execute the query
    const [results] = await db.sequelize.query(`
      WITH user_assignments AS (
        SELECT 
          "admin_users"."id" AS "user_id", 
          COUNT("user_counselors"."counselor_id") AS "assignment_count"
        FROM "admin_users"
        LEFT JOIN "user_counselors" 
          ON "admin_users"."id" = "user_counselors"."counselor_id"
        WHERE "admin_users"."role_id" = :roleId 
          AND "admin_users"."country_id" = :countryId
        GROUP BY "admin_users"."id"
      )
      SELECT "user_id"
      FROM user_assignments
      ORDER BY "assignment_count" ASC, "user_id" ASC
      LIMIT 1;
    `, {
      replacements: { roleId, countryId },
      type: db.Sequelize.QueryTypes.SELECT
    });

    console.log("results ===>", results);

    // Check if results is defined and not null
    if (!results || Object.keys(results).length === 0) {
      return {
        leastAssignedUserId: null
      };
    }

    // Extract user_id if results has user_id
    const leastAssignedUserId = results.user_id;


    // If user_id is undefined, return an error response
    if (leastAssignedUserId === undefined) {
      return {
        leastAssignedUserId: null
      };
    }

    return {
      leastAssignedUserId
    };
  } catch (error) {
    console.error(`Error finding least assigned users: ${error}`);
    return {
      leastAssignedUserId: null
    };
  }
};
