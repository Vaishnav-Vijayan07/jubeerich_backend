const { validationResult, check } = require("express-validator");
const db = require("../models");
const { checkIfEntityExists } = require("../utils/helper");
const UserPrimaryInfo = db.userPrimaryInfo;
const sequelize = db.sequelize;
const { Op, Sequelize } = require("sequelize");

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
    preferred_country,
    office_type,
    region_id,
    counsiler_id,
    branch_id,
    updated_by,
    remarks,
    lead_received_date,
  } = req.body;

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    const userId = req.userDecodeId;
    console.log("userId===>", userId);
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

    const countryExists = await checkIfEntityExists("country", preferred_country);
    if (!countryExists) {
      await transaction.rollback(); // Rollback the transaction if country ID is invalid
      return res.status(400).json({
        status: false,
        message: "Invalid preferred country ID provided",
        errors: [{ msg: "Please provide a valid preferred country ID" }],
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
    const existingEmailUser = await UserPrimaryInfo.findOne({ where: { email } });
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

    const recieved_date = new Date();

    // Create user and related information
    const userPrimaryInfo = await UserPrimaryInfo.create(
      {
        full_name,
        email,
        phone,
        city,
        preferred_country,
        office_type,
        category_id,
        source_id,
        channel_id,
        region_id,
        counsiler_id,
        branch_id,
        updated_by,
        remarks,
        lead_received_date: lead_received_date || recieved_date,
      },
      { transaction }
    );

    console.log("userPrimaryInfo==>", userPrimaryInfo);

    const leastAssignedStaff = await getLeastAssignedUser();
    console.log("leastAssignedStaff===>", leastAssignedStaff);
    if (leastAssignedStaff) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);
      // Create a task for the new lead
      const task = await db.tasks.create(
        {
          studentId: userPrimaryInfo.id,
          userId: leastAssignedStaff,
          title: `Follow up with ${full_name}`,
          dueDate: dueDate,
          updatedBy: userId,
        },
        { transaction }
      );

      console.log("task==>", task);
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

exports.getAllLeads = async (req, res) => {
  try {
    const userPrimaryInfos = await UserPrimaryInfo.findAll({
      where: { is_deleted: false },
      include: [
        { model: db.leadCategory, as: "category_name", attributes: ["category_name"] },
        { model: db.leadSource, as: "source_name", attributes: ["source_name"] },
        { model: db.leadChannel, as: "channel_name", attributes: ["channel_name"] },
        { model: db.country, as: "country_name", attributes: ["country_name"] },
        { model: db.officeType, as: "office_type_name", attributes: ["office_type_name"] },
        { model: db.region, as: "region_name", attributes: ["region_name"], required: false },
        { model: db.adminUsers, as: "counsiler_name", attributes: ["name"], required: false },
        { model: db.branches, as: "branch_name", attributes: ["branch_name"], required: false },
      ],
    });

    const formattedUserPrimaryInfos = userPrimaryInfos.map((info) => ({
      ...info.toJSON(),
      category_name: info.category_name ? info.category_name.category_name : null,
      source_name: info.source_name ? info.source_name.source_name : null,
      channel_name: info.channel_name ? info.channel_name.channel_name : null,
      country_name: info.country_name ? info.country_name.country_name : null,
      office_type_name: info.office_type_name ? info.office_type_name.office_type_name : null,
      region_name: info.region_name ? info.region_name.region_name : null,
      counsiler_name: info.counsiler_name ? info.counsiler_name.name : null,
      branch_name: info.branch_name ? info.branch_name.branch_name : null,
    }));

    res.status(200).json({
      status: true,
      message: "User primary info retrieved successfully",
      data: formattedUserPrimaryInfos,
    });
  } catch (error) {
    console.error(`Error fetching user primary info: ${error}`);
    res.status(500).json({
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
    preferred_country,
    office_type,
    region_id,
    counsiler_id,
    branch_id,
    updated_by,
    remarks,
    lead_received_date,
  } = req.body;

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
      { model: "country", id: preferred_country },
      { model: "office_type", id: office_type },
      { model: "region", id: region_id },
      { model: "admin_user", id: counsiler_id },
      { model: "branch", id: branch_id },
      { model: "admin_user", id: updated_by },
    ];

    for (const entity of entities) {
      if (entity.id !== null && !(await checkIfEntityExists(entity.model, entity.id))) {
        await transaction.rollback();
        return res.status(400).json({
          status: false,
          message: `Invalid ${entity.model.replace("_", " ")} ID provided`,
          errors: [{ msg: `Please provide a valid ${entity.model.replace("_", " ")} ID` }],
        });
      }
    }

    // Check if email or phone already exists
    if (email !== lead.email) {
      const existingEmailUser = await UserPrimaryInfo.findOne({ where: { email } });
      if (existingEmailUser) {
        await transaction.rollback();
        return res.status(400).json({
          status: false,
          message: "User with the same email already exists",
          errors: [{ msg: "Email must be unique" }],
        });
      }
    }

    if (phone !== lead.phone) {
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
        preferred_country,
        office_type,
        category_id,
        source_id,
        channel_id,
        region_id,
        counsiler_id,
        branch_id,
        updated_by,
        remarks,
        lead_received_date,
      },
      { transaction }
    );

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

// round robin method
const getLeastAssignedUser = async (req, res) => {
  try {
    const result = await db.adminUsers.findOne({
      attributes: [
        ["id", "user_id"],
        "username",
        [
          Sequelize.literal(`(
          SELECT COUNT(*)
          FROM "tasks"
          WHERE "tasks"."userId" = "admin_user"."id"
        )`),
          "assignment_count",
        ],
      ],
      where: {
        role_id: 3,
        // status: true,
      },
      order: [[Sequelize.literal("assignment_count"), "ASC"]],
    });

    console.log("result===>", result);

    if (result.dataValues) {
      const leastAssignedUser = result.dataValues.user_id;

      console.log("User with the least assignments:", leastAssignedUser);
      return leastAssignedUser;
    } else {
      console.log('No matching users found or no assignments exist for user type "2".');
    }
  } catch (error) {
    console.error(`Error finding least assigned user: ${error}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
