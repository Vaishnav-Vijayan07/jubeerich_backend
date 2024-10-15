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
// const userExams = require("../models/userExams");

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
    counsiler_id,
    branch_id,
    updated_by,
    remarks,
    lead_received_date,
    zipcode,
    ielts,
    franchise_id,
    lead_type_id,
    exam_details,
  } = req.body;

  exam_details = exam_details ? JSON.parse(exam_details) : null;
  preferred_country = preferred_country ? JSON.parse(preferred_country) : null;

  console.log("preferred_country insertion ==>", preferred_country);
  

  const examDocuments = req.files && req.files["exam_documents"];

  // Start a transaction
  const transaction = await sequelize.transaction();

  try {
    const userId = req.userDecodeId;
    console.log("userId===>", userId);
    const creTl = await AdminUsers.findOne({
      where: { role_id: process.env.CRE_TL_ID },
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
      const region = await db.region.findOne({ where: { id: region_id } });
      regionalManagerId = region ? region.regional_manager_id : null;
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
        franchise_id: franchise_id != "null" ? franchise_id : null,
        counsiler_id: counsiler_id != "null" ? counsiler_id : null,
        branch_id: branch_id != "null" ? branch_id : null,
        updated_by,
        remarks,
        ielts,
        lead_received_date: lead_received_date || receivedDate,
        assigned_cre_tl:
          userRole?.role_id == process.env.IT_TEAM_ID && office_type == process.env.CORPORATE_OFFICE_ID ? creTl?.id : null,
        created_by: userId,
        assign_type: userRole?.role_id == process.env.CRE_ID ? "direct_assign" : null,
        regional_manager_id: userRole?.role_id == process.env.IT_TEAM_ID ? regionalManagerId : null,
      },
      { transaction }
    );

    const userPrimaryId = userPrimaryInfo?.id;
    console.log("USER ID", userPrimaryId);

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
      await userPrimaryInfo.setPreferredCountries(preferred_country, {
        transaction,
      });
    }

    // Handle exam details
    if (Array.isArray(exam_details) && exam_details?.length > 0) {
      const examDetailsPromises = exam_details.map(async (exam, index) => {
        const examDocument = examDocuments ? examDocuments[index] : null;

        // Create the exam record
        const createdExam = await db.userExams.create(
          {
            student_id: userPrimaryInfo.id,
            exam_type: exam.exam_type,
            score_card: examDocument ? examDocument?.filename : null, // Save the filename of the uploaded document
            exam_date: exam.exam_date,
            listening_score: exam.listening_score,
            speaking_score: exam.speaking_score,
            reading_score: exam.reading_score,
            writing_score: exam.writing_score,
            // overall_score: exam.marks,
            overall_score: exam.overall_score,
            updated_by: updated_by,
          },
          { transaction }
        );

        return createdExam;
      });

      await Promise.all(examDetailsPromises);
    }

    if (userRole?.role_id == process.env.CRE_ID) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);

      // const country = await db.country.findByPk(preferred_country[0]);  // Assuming at least one country is selected
      const country = await db.country.findAll({
        where: { id: preferred_country },
      }); // Assuming at least one country is selected
      const countryNames = country.map((c) => c.country_name).join(", ");

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

        await db.userCounselors.bulkCreate(userCounselorsData);

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);

        let countryName = "Unknown";
        if (preferred_country.length > 0) {
          // const country = await db.country.findByPk(countryIds[0]);
          const countries = await db.country.findAll({
            where: { id: preferred_country },
            attributes: ["country_name"],
          });

          if (countries) {
            countryName = countries.map((country) => country.country_name).join(", ");
          }
        }

        // Create tasks for each least assigned user
        for (const leastUserId of leastAssignedUsers) {
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
    } else if (userRole?.role_id == process.env.IT_TEAM_ID) {
      console.log("IT TEAM ID ==>", userRole?.role_id);

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

          await db.userCounselors.bulkCreate(userCounselorsData);

          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 1);

          let countryName = "Unknown";
          if (preferred_country.length > 0) {
            // const country = await db.country.findByPk(countryIds[0]);
            const countries = await db.country.findAll({
              where: { id: preferred_country },
              attributes: ["country_name"],
            });

            if (countries) {
              countryName = countries.map((country) => country.country_name).join(", ");
            }
          }

          // Create tasks for each least assigned user
          for (const leastUserId of leastAssignedUsers) {
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
    counsiler_id,
    branch_id,
    updated_by,
    remarks,
    lead_received_date,
    zipcode,
    franchise_id,
    exam_details,
  } = req.body;

  // Parse exam_details and preferred_country if they are provided as strings
  exam_details = exam_details ? JSON.parse(exam_details) : null;
  preferred_country = preferred_country ? JSON.parse(preferred_country) : null;

  console.log("preferred_country ====>", preferred_country);
  

  console.log("Controller Files", req.files);
  console.log("body =========>", req.body);

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
    // if (Array.isArray(preferred_country) && preferred_country.length > 0) {
    //   const currentCountryIds = currentPreferredCountries.map((country) => country.id);

    //   if (JSON.stringify(currentCountryIds.sort()) !== JSON.stringify(preferred_country.sort())) {
    //     // Remove current assignments
    //     await lead.setPreferredCountries([], { transaction });

    //     // Add new assignments
    //     await lead.setPreferredCountries(preferred_country, { transaction });
    //   }
    // }

    if (Array.isArray(preferred_country) && preferred_country.length > 0) {
      await userPrimaryInfo.setPreferredCountries(preferred_country, {
        transaction,
      });
    }

    // Handle exam details
    if (Array.isArray(exam_details) && exam_details.length > 0) {
      const examDetailsPromises = exam_details.map(async (exam, index) => {
        const examDocument = examDocuments ? examDocuments[index] : null;

        let updateData = {
          exam_type: exam.exam_type,
          exam_date: exam.exam_date,
          listening_score: exam.listening_score,
          speaking_score: exam.speaking_score,
          reading_score: exam.reading_score,
          writing_score: exam.writing_score,
          // overall_score: exam.marks,
          overall_score: exam.overall_score,
          updated_by: updated_by,
        };

        if (examDocument && examDocument.size !== 0) {
          updateData.score_card = examDocument.filename;
        }
        console.log("exam.exam_type", exam.exam_type);

        if (exam.id) {
          return db.userExams.update(updateData, {
            where: {
              student_id: id,
              // exam_type: exam.exam_type,
              id: exam.id,
            },
            transaction,
          });
        } else {
          return db.userExams.create(
            {
              student_id: id,
              exam_type: exam.exam_type,
              exam_date: exam.exam_date,
              listening_score: exam.listening_score,
              speaking_score: exam.speaking_score,
              reading_score: exam.reading_score,
              writing_score: exam.writing_score,
              // overall_score: exam.marks,
              overall_score: exam.overall_score,
              updated_by: updated_by,
              score_card: examDocument ? examDocument.filename : null,
            },
            { transaction }
          );
        }
      });

      await Promise.all(examDetailsPromises);
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
  const { status_id, lead_id, followup_date } = req.body;
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
    await leadExists.update({ status_id, followup_date }, { transaction });

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

    console.log("results ===>", results);

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

// const getLeastAssignedCounsellor = async (countryId, franchiseId) => {
//   const roleId = process.env.FRANCHISE_COUNSELLOR_ID;

//   console.log("countryId ==>", countryId);
//   console.log("franchiseId ==>", franchiseId);
//   console.log("roleId ==>", roleId);

//   try {
//     // Use raw SQL to execute the query
//     const [results] = await db.sequelize.query(
//       `
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
//     `,
//       {
//         replacements: { roleId, countryId, franchiseId },
//         type: db.Sequelize.QueryTypes.SELECT,
//       }
//     );

//     console.log("results ===>", results);

//     // Check if results is defined and not null
//     if (!results || Object.keys(results).length === 0) {
//       return {
//         leastAssignedUserId: null,
//       };
//     }

//     // Extract user_id if results has user_id
//     const leastAssignedUserId = results.user_id;

//     // If user_id is undefined, return an error response
//     if (leastAssignedUserId === undefined) {
//       return {
//         leastAssignedUserId: null,
//       };
//     }

//     return {
//       leastAssignedUserId,
//     };
//   } catch (error) {
//     console.error(`Error finding least assigned users: ${error}`);
//     return {
//       leastAssignedUserId: null,
//     };
//   }
// };

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
      message: "Internal server error",
    });
  }
};
