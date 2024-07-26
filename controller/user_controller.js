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
    preferred_country,
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
    // Check if referenced IDs exist in their respective tables
    const categoryExists = await checkIfEntityExists(
      "lead_category",
      category_id
    );
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

    const countryExists = await checkIfEntityExists(
      "country",
      preferred_country
    );
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
      const counsilerExists = await checkIfEntityExists(
        "admin_user",
        counsiler_id
      );
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
      const updatedByExists = await checkIfEntityExists(
        "admin_user",
        updated_by
      );
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
        created_by: userId,
        ielts,
      },
      { transaction }
    );

    const userRole = await db.adminUsers.findOne({ where: { id: userId } });

    console.log("userRole====>", userRole.role_id);

    if (userRole?.role_id == 2) {
      const leastAssignedStaff = await getLeastAssignedUser();

      if (leastAssignedStaff) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);

        const country = await db.country.findByPk(preferred_country);
        // Create a task for the new lead
        const task = await db.tasks.create(
          {
            studentId: userPrimaryInfo.id,
            userId: leastAssignedStaff,
            title: `${full_name} - ${country.country_name} - ${phone}`,
            dueDate: dueDate,
            updatedBy: userId,
          },
          { transaction }
        );

        console.log("task==>", task);
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

exports.getAllLeads = async (req, res) => {
  const cre_id = req.userDecodeId;

  try {
    const userPrimaryInfos = await UserPrimaryInfo.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { assigned_cre: cre_id },
          { created_by: cre_id },
        ],
        is_deleted: false,
      },
      include: [
        {
          model: db.leadCategory,
          as: "category_name",
          attributes: ["category_name"],
        },
        {
          model: db.leadSource,
          as: "source_name",
          attributes: ["source_name"],
        },
        {
          model: db.leadChannel,
          as: "channel_name",
          attributes: ["channel_name"],
        },
        { model: db.country, as: "country_name", attributes: ["country_name"] },
        {
          model: db.officeType,
          as: "office_type_name",
          attributes: ["office_type_name"],
        },
        {
          model: db.region,
          as: "region_name",
          attributes: ["region_name"],
          required: false,
        },
        {
          model: db.adminUsers,
          as: "counsiler_name",
          attributes: ["name"],
          required: false,
        },
        {
          model: db.branches,
          as: "branch_name",
          attributes: ["branch_name"],
          required: false,
        },
      ],
    });

    const formattedUserPrimaryInfos = userPrimaryInfos.map((info) => ({
      ...info.toJSON(),
      category_name: info.category_name
        ? info.category_name.category_name
        : null,
      source_name: info.source_name ? info.source_name.source_name : null,
      channel_name: info.channel_name ? info.channel_name.channel_name : null,
      country_name: info.country_name ? info.country_name.country_name : null,
      office_type_name: info.office_type_name
        ? info.office_type_name.office_type_name
        : null,
      region_name: info.region_name ? info.region_name.region_name : null,
      counsiler_name: info.counsiler_name ? info.counsiler_name.name : null,
      branch_name: info.branch_name ? info.branch_name.branch_name : null,
    }));

    res.status(200).json({
      status: true,
      message: "User primary info retrieved successfully",
      formattedUserPrimaryInfos,
      allCres: null,
    });
  } catch (error) {
    console.error(`Error fetching user primary info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getLeadsByCreatedUser = async (req, res) => {
  try {
    const userId = req.userDecodeId;
    const userPrimaryInfos = await UserPrimaryInfo.findAll({
      where: { is_deleted: false, created_by: userId },
      include: [
        {
          model: db.leadCategory,
          as: "category_name",
          attributes: ["category_name"],
        },
        {
          model: db.leadSource,
          as: "source_name",
          attributes: ["source_name"],
        },
        {
          model: db.leadChannel,
          as: "channel_name",
          attributes: ["channel_name"],
        },
        { model: db.country, as: "country_name", attributes: ["country_name"] },
        {
          model: db.officeType,
          as: "office_type_name",
          attributes: ["office_type_name"],
        },
        {
          model: db.region,
          as: "region_name",
          attributes: ["region_name"],
          required: false,
        },
        {
          model: db.adminUsers,
          as: "counsiler_name",
          attributes: ["name"],
          required: false,
        },
        {
          model: db.branches,
          as: "branch_name",
          attributes: ["branch_name"],
          required: false,
        },
      ],
    });

    const formattedUserPrimaryInfos = userPrimaryInfos.map((info) => ({
      ...info.toJSON(),
      category_name: info.category_name
        ? info.category_name.category_name
        : null,
      source_name: info.source_name ? info.source_name.source_name : null,
      channel_name: info.channel_name ? info.channel_name.channel_name : null,
      country_name: info.country_name ? info.country_name.country_name : null,
      office_type_name: info.office_type_name
        ? info.office_type_name.office_type_name
        : null,
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

exports.geLeadsForCreTl = async (req, res) => {
  try {
    const allCres = await AdminUsers.findAll({
      where: { role_id: 3 },
      attributes: ["id", "name"],
    });

    const userId = req.userDecodeId;
    const userPrimaryInfos = await UserPrimaryInfo.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { assigned_cre_tl: userId },
          { created_by: userId },
        ],
        assigned_cre: {
          [db.Sequelize.Op.is]: null,
        },
      },
      include: [
        {
          model: db.leadCategory,
          as: "category_name",
          attributes: ["category_name"],
        },
        {
          model: db.leadSource,
          as: "source_name",
          attributes: ["source_name"],
        },
        {
          model: db.leadChannel,
          as: "channel_name",
          attributes: ["channel_name"],
        },
        { model: db.country, as: "country_name", attributes: ["country_name"] },
        {
          model: db.officeType,
          as: "office_type_name",
          attributes: ["office_type_name"],
        },
        {
          model: db.region,
          as: "region_name",
          attributes: ["region_name"],
          required: false,
        },
        {
          model: db.adminUsers,
          as: "counsiler_name",
          attributes: ["name"],
          required: false,
        },
        {
          model: db.adminUsers,
          as: "cre_name",
          attributes: ["id", "name"],
        },
        {
          model: db.branches,
          as: "branch_name",
          attributes: ["branch_name"],
          required: false,
        },
      ],
    });

    const formattedUserPrimaryInfos = userPrimaryInfos.map((info) => ({
      ...info.toJSON(),
      category_name: info.category_name
        ? info.category_name.category_name
        : null,
      source_name: info.source_name ? info.source_name.source_name : null,
      channel_name: info.channel_name ? info.channel_name.channel_name : null,
      country_name: info.country_name ? info.country_name.country_name : null,
      office_type_name: info.office_type_name
        ? info.office_type_name.office_type_name
        : null,
      region_name: info.region_name ? info.region_name.region_name : null,
      counsiler_name: info.counsiler_name ? info.counsiler_name.name : null,
      branch_name: info.branch_name ? info.branch_name.branch_name : null,
      cre_name: info.cre_name ? info.cre_name.name : "Not assigned", // Added cre_name extraction
    }));

    res.status(200).json({
      status: true,
      message: "User primary info retrieved successfully",
      formattedUserPrimaryInfos,
      allCres,
    });
  } catch (error) {
    console.error(`Error fetching user primary info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getAssignedLeadsForCreTl = async (req, res) => {
  try {
    const allCres = await AdminUsers.findAll({
      where: { role_id: 3 },
      attributes: ["id", "name"],
    });

    const userId = req.userDecodeId;
    const userPrimaryInfos = await UserPrimaryInfo.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { assigned_cre_tl: userId },
          { created_by: userId },
        ],
        assigned_cre: {
          [db.Sequelize.Op.ne]: null,
        },
      },
      include: [
        {
          model: db.leadCategory,
          as: "category_name",
          attributes: ["category_name"],
        },
        {
          model: db.leadSource,
          as: "source_name",
          attributes: ["source_name"],
        },
        {
          model: db.leadChannel,
          as: "channel_name",
          attributes: ["channel_name"],
        },
        { model: db.country, as: "country_name", attributes: ["country_name"] },
        {
          model: db.officeType,
          as: "office_type_name",
          attributes: ["office_type_name"],
        },
        {
          model: db.region,
          as: "region_name",
          attributes: ["region_name"],
          required: false,
        },
        {
          model: db.adminUsers,
          as: "counsiler_name",
          attributes: ["name"],
          required: false,
        },
        {
          model: db.adminUsers,
          as: "cre_name",
          attributes: ["id", "name"],
        },
        {
          model: db.branches,
          as: "branch_name",
          attributes: ["branch_name"],
          required: false,
        },
      ],
    });

    const formattedUserPrimaryInfos = userPrimaryInfos.map((info) => ({
      ...info.toJSON(),
      category_name: info.category_name
        ? info.category_name.category_name
        : null,
      source_name: info.source_name ? info.source_name.source_name : null,
      channel_name: info.channel_name ? info.channel_name.channel_name : null,
      country_name: info.country_name ? info.country_name.country_name : null,
      office_type_name: info.office_type_name
        ? info.office_type_name.office_type_name
        : null,
      region_name: info.region_name ? info.region_name.region_name : null,
      counsiler_name: info.counsiler_name ? info.counsiler_name.name : null,
      branch_name: info.branch_name ? info.branch_name.branch_name : null,
      cre_name: info.cre_name ? info.cre_name.name : "Not assigned", // Added cre_name extraction
    }));

    res.status(200).json({
      status: true,
      message: "User primary info retrieved successfully",
      formattedUserPrimaryInfos,
      allCres,
    });
  } catch (error) {
    console.error(`Error fetching user primary info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.assignCres = async (req, res) => {
  const { cre_id, user_ids } = req.body;

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    // Validate cre_id
    if (!cre_id) {
      return res.status(400).json({
        status: false,
        message: "cre_id is required",
      });
    }

    // Validate user_ids
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "user_ids must be a non-empty array",
      });
    }

    // Validate each user_id
    for (const user_id of user_ids) {
      if (typeof user_id !== "number") {
        return res.status(400).json({
          status: false,
          message: "Each user_id must be a number",
        });
      }
    }

    // Update assigned_cre for each user_id
    await Promise.all(
      user_ids.map(async (user_id) => {
        await UserPrimaryInfo.update(
          { assigned_cre: cre_id },
          { where: { id: user_id }, transaction }
        );
      })
    );

    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "CRE assigned successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error(`Error assigning CRE: ${error}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// exports.autoAssign = async (req, res) => {
//   const { leads_ids } = req.body;

//   // Start a new transaction
//   const transaction = await sequelize.transaction();

//   try {
//     // Validate leads_ids
//     if (!Array.isArray(leads_ids) || leads_ids.length === 0) {
//       return res.status(400).json({
//         status: false,
//         message: "leads_ids must be a non-empty array",
//       });
//     }

//     // Validate each user_id
//     for (const user_id of leads_ids) {
//       if (typeof user_id !== "number") {
//         return res.status(400).json({
//           status: false,
//           message: "Each user_id must be a number",
//         });
//       }
//     }

//     const leastCre = await getLeastAssignedCre(); // Get all CREs with their assignment counts
//     let creIndex = 0; // Initialize an index to track the current CRE

//     for (const id of leads_ids) {
//       if (leastCre.length === 0) {
//         throw new Error("No available CREs to assign leads");
//       }

//       // Get the current CRE based on the index
//       const currentCre = leastCre[creIndex].user_id;

//       // Update the user with the selected CRE
//       await UserPrimaryInfo.update(
//         { assigned_cre: currentCre },
//         { where: { id: id }, transaction }
//       );

//       // Update the index to the next CRE
//       creIndex = (creIndex + 1) % leastCre.length; // Loop back to the start if needed
//     }

//     await transaction.commit();

//     res.status(200).json({
//       status: true,
//       message: "Leads assigned successfully",
//     });
//   } catch (error) {
//     // Rollback the transaction in case of an error
//     await transaction.rollback();
//     console.error("Error in autoAssign:", error);
//     res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };

exports.autoAssign = async (req, res) => {
  const { leads_ids } = req.body;

  // Validate leads_ids
  if (!Array.isArray(leads_ids) || leads_ids.length === 0) {
    return res.status(400).json({
      status: false,
      message: "leads_ids must be a non-empty array",
    });
  }

  if (!leads_ids.every((id) => typeof id === "number")) {
    return res.status(400).json({
      status: false,
      message: "Each user_id must be a number",
    });
  }

  // Start a new transaction
  const transaction = await sequelize.transaction();

  try {
    // Fetch all CREs with their assignment counts
    const leastCre = await getLeastAssignedCre();

    if (leastCre.length === 0) {
      throw new Error("No available CREs to assign leads");
    }

    // Prepare the bulk update data
    const updatePromises = leads_ids.map((id, index) => {
      const currentCre = leastCre[index % leastCre.length].user_id;
      return UserPrimaryInfo.update(
        { assigned_cre: currentCre },
        { where: { id }, transaction }
      );
    });

    // Perform bulk update
    await Promise.all(updatePromises);

    // Commit the transaction
    await transaction.commit();

    res.status(200).json({
      status: true,
      message: "Leads assigned successfully",
    });
  } catch (error) {
    // Rollback the transaction in case of an error
    await transaction.rollback();
    console.error("Error in autoAssign:", error);
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
    ielts,
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
    if (email !== lead.email) {
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
        ielts,
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
      console.log(
        'No matching users found or no assignments exist for user type "2".'
      );
    }
  } catch (error) {
    console.error(`Error finding least assigned user: ${error}`);
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

const getLeastAssignedCre = async () => {
  try {
    // Fetch all CREs with their current assignment counts
    const creList = await db.adminUsers.findAll({
      attributes: [
        ["id", "user_id"],
        "username",
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM "user_primary_info"
            WHERE "user_primary_info"."assigned_cre" = "admin_user"."id"
          )`),
          "assignment_count",
        ],
      ],
      where: {
        role_id: 3, // Assuming role_id 3 is for CREs
        // status: true, // Uncomment to include only active users
      },
      order: [[Sequelize.literal("assignment_count"), "ASC"]], // Order by assignment count in ascending order
    });

    return creList.map((cre) => ({
      user_id: cre.dataValues.user_id,
      assignment_count: parseInt(cre.dataValues.assignment_count, 10),
    }));
  } catch (error) {
    console.error("Error fetching CREs with assignment counts:", error);
    throw error;
  }
};
