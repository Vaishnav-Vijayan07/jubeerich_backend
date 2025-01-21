const db = require("../models");
const { Op } = require("sequelize");
const { getEnumValue } = require("../utils/helper");
const UserPrimaryInfo = db.userPrimaryInfo;
const AdminUsers = db.adminUsers;

exports.getLeads = async (req, res) => {
  try {
    const userPrimaryInfos = await UserPrimaryInfo.findAll({
      where: { is_deleted: false },
      // attributes: ["id", "full_name", "email", "city", "source_id", "lead_received_date", "stage", "status_id", "office_type"],
      include: [
        {
          model: db.leadSource,
          as: "source_name",
          attributes: ["source_name"],
        },
        {
          model: db.leadType,
          as: "type_name",
          attributes: ["name"],
        },
        {
          model: db.leadChannel,
          as: "channel_name",
          attributes: ["channel_name"],
        },
        // {
        //   model: db.country,
        //   as: "preferredCountries",
        //   attributes: ["country_name", "id"],
        //   through: { attributes: [] },
        //   required: false,
        // },
        {
          model: db.country,
          as: "preferredCountries",
          attributes: ["id", "country_name"],
          through: {
            model: db.userContries,
            attributes: ["country_id", "followup_date", "status_id"],
          },
          required: false,
          include: [
            {
              model: db.status,
              as: "country_status",
              attributes: ["id", "status_name", "color"],
              required: false,
              through: {
                model: db.userContries,
                attributes: [],
              },
              where: { id: { [db.Op.eq]: db.sequelize.col("preferredCountries.user_countries.status_id") } },
            },
          ],
        },
        {
          model: db.adminUsers,
          as: "counselors",
          attributes: ["name", "id"],
          through: { attributes: [] },
          required: false,
        },
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
          as: "assigned_branch_counselor_name",
          attributes: ["name"],
          required: false,
        },
        {
          model: db.branches,
          as: "branch_name",
          attributes: ["branch_name"],
          required: false,
        },
        {
          model: db.status,
          as: "status",
          attributes: ["status_name"],
          required: false,
        },
        // {
        //   model: db.flag,
        //   as: "user_primary_flags",
        //   attributes: ["flag_name"],
        //   required: false,
        // },
        {
          model: db.adminUsers,
          as: "updated_by_user",
          attributes: ["name"],
          required: false,
          foreignKey: "updated_by",
        },
      ],
    });

    const formattedUserPrimaryInfos = await Promise.all(
      userPrimaryInfos.map(async (info) => {
        const preferredCountries = info.preferredCountries.map((country) => ({
          country_name: country.country_name,
          id: country.id,
          status_name: country?.country_status?.[0]?.status_name,
          status_color: country?.country_status?.[0]?.color,
          status_id: country?.country_status?.[0]?.id,
          followup_date: country.user_countries?.followup_date,
        }));

        const counsellorNames = info.counselors?.map((counselor) => ({
          counselor_name: counselor.name,
          id: counselor.id,
        }));

        const flagDetails = await info?.flag_details;

        return {
          ...info.toJSON(),
          type_name: info.type_name?.name || null,
          source_name: info.source_name?.source_name || null,
          channel_name: info.channel_name?.channel_name || null,
          preferredCountries: preferredCountries,
          counselors: counsellorNames,
          office_type_name: info.office_type_name?.office_type_name || null,
          region_name: info.region_name?.region_name || null,
          counsiler_name: info.counsiler_name?.name || null,
          status: info.status?.status_name || null,
          branch_name: info.branch_name?.branch_name || null,
          assigned_branch_counselor_name: info.assigned_branch_counselor_name?.name || null,
          updated_by_user: info.updated_by_user?.name || null,
          flag_details: flagDetails,
        };
      })
    );

    res.status(200).json({
      status: true,
      message: "User primary info retrieved successfully",
      formattedUserPrimaryInfos,
    });
  } catch (error) {
    console.error(`Error fetching user primary info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getAllLeads = async (req, res) => {
  const cre_id = req.userDecodeId;
  const roleId = req.role_id;
  const { page = 1, limit = 20, keyword } = req.query;

  const dynamicIlike = keyword ? `%${keyword}%` : `%%`;
  const isSearchApplied = keyword ? true : false;

  const offset = (page - 1) * limit;
  const parsedLimit = parseInt(limit, 10);

  const whereCountryManger = {
    is_deleted: false,
    [Op.or]: [{ full_name: { [Op.iLike]: dynamicIlike } }, { email: { [Op.iLike]: dynamicIlike } }],
    [Op.or]: [
      { created_by: cre_id },
      {
        [db.Sequelize.Op.and]: [
          db.Sequelize.literal(`EXISTS (
            SELECT 1 FROM "user_counselors" 
            WHERE "user_counselors"."user_id" = "user_primary_info"."id"
            AND "user_counselors"."counselor_id" = ${cre_id}
          )`),
        ],
      },
    ],
  };

  const where = {
    is_deleted: false,
    [Op.and]: [
      {
        [Op.or]: [
          { assigned_cre_tl: cre_id },
          { created_by: cre_id },
          { assigned_cre: cre_id },
          { assigned_regional_manager: cre_id },
          {
            [Op.and]: [{ assigned_counsellor_tl: cre_id }, { assigned_branch_counselor: null }],
          },
          { assigned_branch_counselor: cre_id },
          db.Sequelize.where(
            db.Sequelize.literal(`
              EXISTS (
                SELECT 1 FROM "user_counselors" 
                WHERE "user_counselors"."user_id" = "user_primary_info"."id"
                AND "user_counselors"."counselor_id" = ${cre_id}
              )
            `),
            true
          ),
          db.Sequelize.where(
            db.Sequelize.literal(`
              EXISTS (
                SELECT 1 FROM "admin_users"
                WHERE "admin_users"."region_id" = "user_primary_info"."region_id"
                AND "admin_users"."id" = ${cre_id}
              )
            `),
            true
          ),
        ],
      },
      {
        [Op.or]: [{ full_name: { [Op.iLike]: `%${dynamicIlike}%` } }, { email: { [Op.iLike]: `%${dynamicIlike}%` } }],
      },
    ],
  };

  try {
    let userPrimaryInfos;

    const adminUser = await db.adminUsers.findByPk(cre_id, {
      attributes: ["id", "name"],
      include: {
        model: db.country,
        attributes: ["country_name", "id", "country_code"],
        through: { model: db.adminUserCountries, attributes: [] }, // Exclude join table attributes if not needed
      },
    });

    if (!adminUser) {
      return res.status(404).json({
        status: false,
        message: "Admin user not found",
      });
    }

    let adminUserCountryIds = adminUser?.countries?.map((country) => country?.id);

    if (roleId == process.env.COUNTRY_MANAGER_ID || roleId == process.env.COUNSELLOR_ROLE_ID) {
      userPrimaryInfos = await UserPrimaryInfo.findAndCountAll({
        where: whereCountryManger,
        distint: true,
        include: [
          {
            model: db.leadSource,
            as: "source_name",
            attributes: ["source_name"],
          },
          {
            model: db.leadType,
            as: "type_name",
            attributes: ["name"],
          },
          {
            model: db.leadChannel,
            as: "channel_name",
            attributes: ["channel_name"],
          },
          {
            model: db.country,
            as: "preferredCountries",
            attributes: ["id", "country_name"],
            through: {
              model: db.userContries,
              attributes: ["country_id", "followup_date", "status_id"],
              where: { country_id: { [Op.in]: adminUserCountryIds } },
            },
            required: true,
            include: [
              {
                model: db.status,
                as: "country_status",
                attributes: ["id", "status_name", "color"],
                required: false,
                through: {
                  model: db.userContries,
                  attributes: [],
                },
                where: { id: { [db.Op.eq]: db.sequelize.col("preferredCountries.user_countries.status_id") } },
              },
            ],
          },
          {
            model: db.adminUsers,
            as: "counselors",
            attributes: ["name", "id"],
            through: { attributes: [] },
            required: false,
          },
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
            as: "assigned_branch_counselor_name",
            attributes: ["name"],
            required: false,
          },
          {
            model: db.branches,
            as: "branch_name",
            attributes: ["branch_name"],
            required: false,
          },
          {
            model: db.status,
            as: "status",
            attributes: ["status_name"],
            required: false,
          },
          {
            model: db.adminUsers,
            as: "updated_by_user",
            attributes: ["name"],
            required: false,
            foreignKey: "updated_by",
          },
        ],
        offset,
        limit: parsedLimit,
      });
    } else {
      userPrimaryInfos = await UserPrimaryInfo.findAndCountAll({
        attributes: ["id", "full_name", "email", "city", "source_id", "lead_received_date", "stage", "status_id", "office_type"],
        where,
        distinct: true,
        include: [
          // {
          //   model: db.leadType,
          //   as: "type_name",
          //   attributes: ["name"],
          // },
          {
            model: db.leadSource,
            as: "source_name",
            attributes: ["source_name"],
          },
          // {
          //   model: db.leadChannel,
          //   as: "channel_name",
          //   attributes: ["channel_name"],
          // },
          {
            model: db.country,
            as: "preferredCountries",
            attributes: ["id", "country_name"],
            through: {
              model: db.userContries,
              attributes: ["country_id", "followup_date", "status_id"],
            },
            required: false,
            include: [
              {
                model: db.status,
                as: "country_status",
                attributes: ["id", "status_name", "color"],
                required: false,
                through: {
                  model: db.userContries,
                  attributes: [],
                },
                where: { id: { [db.Op.eq]: db.sequelize.col("preferredCountries.user_countries.status_id") } },
              },
            ],
          },
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
            as: "assigned_branch_counselor_name",
            attributes: ["name"],
            required: false,
          },
          {
            model: db.adminUsers,
            as: "counselors", // Use the alias defined in associations
            attributes: ["name", "id"], // Include the ID attribute
            through: { attributes: [] }, // Exclude attributes from join table
          },
          {
            model: db.branches,
            as: "branch_name",
            attributes: ["branch_name"],
            required: false,
          },
          {
            model: db.adminUsers,
            as: "updated_by_user",
            attributes: ["name"],
            required: false,
            foreignKey: "updated_by",
          },
          {
            model: db.status,
            as: "status",
            attributes: ["status_name"],
            required: false,
          },
          {
            model: db.userExams,
            as: "exams",
            // attributes: ["exam_name","marks", "document"],
            required: false,
          },
        ],
        offset,
        limit: parsedLimit,
      });
    }

    const { count, rows } = userPrimaryInfos;

    const formattedUserPrimaryInfos = await Promise.all(
      rows.map(async (info) => {
        const preferredCountries = info?.preferredCountries?.map((country) => ({
          country_name: country.country_name,
          status_name: country?.country_status?.[0]?.status_name,
          status_color: country?.country_status?.[0]?.color,
          status_id: country?.country_status?.[0]?.id,
          id: country.id,
          followup_date: country.user_countries?.followup_date,
          // status_id: country.user_countries?.status_id,
        }));

        const examDetails = info.exams?.map((exam) => ({
          exam_type: exam.exam_type,
          exam_date: exam.exam_date,
          marks: exam.overall_score,
          listening_score: exam.listening_score,
          speaking_score: exam.speaking_score,
          reading_score: exam.reading_score,
          writing_score: exam.writing_score,
          updated_by: exam.updated_by,
        }));

        const examDocuments = info.exams?.map((exam) => ({
          exam_documents: exam.score_card,
        }));

        const counsellorNames = info.counselors?.map((counselor) => ({
          counselor_name: counselor.name,
          id: counselor.id,
        }));

        const flagDetails = await info.flag_details;

        return {
          ...info.toJSON(),
          type_name: info.type_name ? info.type_name.name : null,
          source_name: info.source_name ? info.source_name.source_name : null,
          channel_name: info.channel_name ? info.channel_name.channel_name : null,
          preferredCountries: preferredCountries,
          counselors: counsellorNames,

          office_type_name: info.office_type_name ? info.office_type_name.office_type_name : null,
          // region_name: info.region_name ? info.region_name.region_name : null,
          branch_name: info.branch_name ? info.branch_name.branch_name : null,
          updated_by_user: info.updated_by_user ? info.updated_by_user.name : null,
          status: info.status ? info.status.status_name : null,
          exam_details: examDetails,
          assigned_branch_counselor_name: info.assigned_branch_counselor_name ? info.assigned_branch_counselor_name.name : null,
          exam_documents: examDocuments,
          flag_details: flagDetails,
        };
      })
    );

    res.status(200).json({
      status: true,
      message: "User primary info retrieved successfully",
      formattedUserPrimaryInfos,
      totalPages: Math.ceil(count / limit),
      count,
      limit: limit,
      isSearchApplied,
    });
  } catch (error) {
    console.error(`Error fetching user primary info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getAllLeadsOptimized = async (req, res) => {
  const cre_id = req.userDecodeId;
  const roleId = req.role_id.toString();
  console.log("roleId", typeof roleId);

  const { page = 1, limit = 20, keyword } = req.query;

  const dynamicIlike = keyword ? `%${keyword}%` : `%%`;
  const isSearchApplied = keyword ? true : false;

  const offset = (page - 1) * limit;
  const parsedLimit = parseInt(limit, 10);

  let dynamicDependancy;
  let dynamicDependancyLiteral;
  let mainWhereCondition;
  let dynamicInclude = [];

  // Dynamic OR inside Main Where Conditions
  switch (roleId) {
    case process.env.CRE_ID:
      dynamicDependancy = { assigned_cre: cre_id };
      break;
    case process.env.REGIONAL_MANAGER_ID:
      dynamicDependancy = { assigned_regional_manager: cre_id };
      dynamicDependancyLiteral = db.Sequelize.where(
        db.Sequelize.literal(`
          EXISTS (
            SELECT 1 FROM "admin_users"
            WHERE "admin_users"."region_id" = "user_primary_info"."region_id"
            AND "admin_users"."id" = ${cre_id}
          )
        `),
        true
      );
      break;
    case process.env.COUNSELLOR_TL_ID:
      dynamicDependancy = {
        [Op.and]: [{ assigned_counsellor_tl: cre_id }, { assigned_branch_counselor: null }],
      };
      dynamicDependancyLiteral = db.Sequelize.where(
        db.Sequelize.literal(`
          EXISTS (
            SELECT 1 FROM "admin_users"
            WHERE "admin_users"."region_id" = "user_primary_info"."region_id"
            AND "admin_users"."id" = ${cre_id}
          )
        `),
        true
      );
      break;
    case process.env.BRANCH_COUNSELLOR_ID:
      dynamicDependancy = { assigned_branch_counselor: cre_id };
      dynamicDependancyLiteral = db.Sequelize.where(
        db.Sequelize.literal(`
          EXISTS (
            SELECT 1 FROM "admin_users"
            WHERE "admin_users"."region_id" = "user_primary_info"."region_id"
            AND "admin_users"."id" = ${cre_id}
          )
        `),
        true
      );
      break;
    default:
      break;
  }

  // Dynamic Main Where Condition
  switch (roleId) {
    case process.env.IT_TEAM_ID:
      mainWhereCondition = {
        is_deleted: false,
        [Op.and]: [
          {
            [Op.or]: [{ full_name: { [Op.iLike]: `%${dynamicIlike}%` } }, { email: { [Op.iLike]: `%${dynamicIlike}%` } }],
          },
        ],
      };
      break;
    case process.env.COUNSELLOR_ROLE_ID:
    case process.env.FRANCHISE_COUNSELLOR_ID:
    case process.env.COUNTRY_MANAGER_ID:
      mainWhereCondition = {
        is_deleted: false,
        [Op.or]: [{ full_name: { [Op.iLike]: dynamicIlike } }, { email: { [Op.iLike]: dynamicIlike } }],
        [Op.or]: [
          dynamicDependancy,
          { created_by: cre_id },
          dynamicDependancyLiteral,
          {
            [db.Sequelize.Op.and]: [
              db.Sequelize.literal(`EXISTS (
                SELECT 1 FROM "user_counselors" 
                WHERE "user_counselors"."user_id" = "user_primary_info"."id"
                AND "user_counselors"."counselor_id" = ${cre_id}
              )`),
            ],
          },
        ],
      };
      break;
    default:
      mainWhereCondition = {
        is_deleted: false,
        [Op.and]: [
          {
            [Op.or]: [dynamicDependancy, { created_by: cre_id }, dynamicDependancyLiteral],
          },
          {
            [Op.or]: [{ full_name: { [Op.iLike]: `%${dynamicIlike}%` } }, { email: { [Op.iLike]: `%${dynamicIlike}%` } }],
          },
        ],
      };
      break;
  }

  // Dynamic Include
  if (
    roleId == process.env.COUNSELLOR_TL_ID ||
    roleId == process.env.BRANCH_COUNSELLOR_ID ||
    roleId == process.env.REGIONAL_MANAGER_ID
  ) {
    dynamicInclude = [
      {
        model: db.region,
        as: "region_name",
        attributes: ["region_name"],
        required: false,
      },
      {
        model: db.adminUsers,
        as: "assigned_branch_counselor_name",
        attributes: ["name"],
        required: false,
      },
      {
        model: db.branches,
        as: "branch_name",
        attributes: ["branch_name"],
        required: false,
      },
    ];
  }

  try {
    let userPrimaryInfos;

    const adminUser = await db.adminUsers.findByPk(cre_id, {
      attributes: ["id", "name"],
      include: {
        model: db.country,
        attributes: ["country_name", "id", "country_code"],
        through: { model: db.adminUserCountries, attributes: [] }, // Exclude join table attributes if not needed
      },
    });

    if (!adminUser) {
      return res.status(404).json({
        status: false,
        message: "Admin user not found",
      });
    }

    let adminUserCountryIds = adminUser?.countries?.map((country) => country?.id);

    if (roleId == process.env.COUNTRY_MANAGER_ID || roleId == process.env.COUNSELLOR_ROLE_ID) {
      userPrimaryInfos = await UserPrimaryInfo.findAndCountAll({
        where: mainWhereCondition,
        distint: true,
        include: [
          {
            model: db.leadSource,
            as: "source_name",
            attributes: ["source_name"],
          },
          {
            model: db.country,
            as: "preferredCountries",
            attributes: ["id", "country_name"],
            through: {
              model: db.userContries,
              attributes: ["country_id", "followup_date", "status_id"],
              where: { country_id: { [Op.in]: adminUserCountryIds } },
            },
            required: true,
            include: [
              {
                model: db.status,
                as: "country_status",
                attributes: ["id", "status_name", "color"],
                required: false,
                through: {
                  model: db.userContries,
                  attributes: [],
                },
                where: { id: { [db.Op.eq]: db.sequelize.col("preferredCountries.user_countries.status_id") } },
              },
            ],
          },
          {
            model: db.officeType,
            as: "office_type_name",
            attributes: ["office_type_name"],
          },
          {
            model: db.adminUsers,
            as: "updated_by_user",
            attributes: ["name"],
            required: false,
            foreignKey: "updated_by",
          },
        ],
        offset,
        limit: parsedLimit,
      });
    } else {
      userPrimaryInfos = await UserPrimaryInfo.findAndCountAll({
        where: mainWhereCondition,
        distinct: true,
        include: [
          {
            model: db.leadSource,
            as: "source_name",
            attributes: ["source_name"],
          },
          {
            model: db.country,
            as: "preferredCountries",
            attributes: ["id", "country_name"],
            through: {
              model: db.userContries,
              attributes: ["country_id", "followup_date", "status_id"],
            },
            required: false,
            include: [
              {
                model: db.status,
                as: "country_status",
                attributes: ["id", "status_name", "color"],
                required: false,
                through: {
                  model: db.userContries,
                  attributes: [],
                },
                where: { id: { [db.Op.eq]: db.sequelize.col("preferredCountries.user_countries.status_id") } },
              },
            ],
          },
          {
            model: db.officeType,
            as: "office_type_name",
            attributes: ["office_type_name"],
          },
          ...dynamicInclude,
          {
            model: db.adminUsers,
            as: "counselors",
            attributes: ["name", "id"],
            through: { attributes: [] },
          },
          {
            model: db.adminUsers,
            as: "updated_by_user",
            attributes: ["name"],
            required: false,
            foreignKey: "updated_by",
          },
        ],
        offset,
        limit: parsedLimit,
      });
    }

    const { count, rows } = userPrimaryInfos;

    const formattedUserPrimaryInfos = await Promise.all(
      rows.map(async (info) => {
        const preferredCountries = info?.preferredCountries?.map((country) => ({
          country_name: country.country_name,
          status_name: country?.country_status?.[0]?.status_name,
          status_color: country?.country_status?.[0]?.color,
          status_id: country?.country_status?.[0]?.id,
          id: country.id,
          followup_date: country.user_countries?.followup_date,
        }));

        const counsellorNames = info.counselors?.map((counselor) => ({
          counselor_name: counselor.name,
          id: counselor.id,
        }));

        return {
          ...info.toJSON(),
          source_name: info.source_name ? info.source_name.source_name : null,
          preferredCountries: preferredCountries,
          counselors: counsellorNames,
          office_type_name: info.office_type_name ? info.office_type_name.office_type_name : null,
          branch_name: info.branch_name ? info.branch_name.branch_name : null,
          updated_by_user: info.updated_by_user ? info.updated_by_user.name : null,
          assigned_branch_counselor_name: info.assigned_branch_counselor_name ? info.assigned_branch_counselor_name.name : null,
        };
      })
    );

    res.status(200).json({
      status: true,
      message: "User primary info retrieved successfully",
      formattedUserPrimaryInfos,
      totalPages: Math.ceil(count / limit),
      count,
      limit: limit,
      isSearchApplied,
    });
  } catch (error) {
    console.error(`Error fetching user primary info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getAllAssignedLeadsRegionalMangers = async (req, res) => {
  const cre_id = req.userDecodeId;

  try {
    const userPrimaryInfos = await UserPrimaryInfo.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { assigned_cre_tl: cre_id },
          { created_by: cre_id },
          { assigned_cre: cre_id },
          { assigned_regional_manager: cre_id },
          { assigned_counsellor_tl: cre_id },
          { assigned_branch_counselor: cre_id },
          {
            [db.Sequelize.Op.and]: [
              db.Sequelize.literal(`EXISTS (
                  SELECT 1 FROM "user_counselors" 
                  WHERE "user_counselors"."user_id" = "user_primary_info"."id"
                  AND "user_counselors"."counselor_id" = ${cre_id}
                )`),
            ],
          },
          {
            [db.Sequelize.Op.and]: [
              db.Sequelize.literal(`EXISTS (
                SELECT 1 FROM "admin_users"
                WHERE "admin_users"."region_id" = "user_primary_info"."region_id"
                AND "admin_users"."id" = ${cre_id}
              )`),
            ],
          },
        ],
        branch_id: {
          // Add this condition to only get results where branch_id is not null
          [db.Sequelize.Op.ne]: null,
        },
        is_deleted: false,
      },
      include: [
        {
          model: db.leadType,
          as: "type_name",
          attributes: ["name"],
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
        // {
        //   model: db.country,
        //   as: "preferredCountries",
        //   attributes: ["country_name", "id"],
        //   through: { attributes: [] }, // Exclude join table attributes
        // },
        {
          model: db.country,
          as: "preferredCountries",
          attributes: ["id", "country_name"],
          through: {
            model: db.userContries,
            attributes: ["country_id", "followup_date", "status_id"],
          },
          required: false,
          include: [
            {
              model: db.status,
              as: "country_status",
              attributes: ["id", "status_name", "color"],
              required: false,
              through: {
                model: db.userContries,
                attributes: [],
              },
              where: { id: { [db.Op.eq]: db.sequelize.col("preferredCountries.user_countries.status_id") } },
            },
          ],
        },
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
          as: "assigned_branch_counselor_name",
          attributes: ["name"],
          required: false,
        },
        {
          model: db.adminUsers,
          as: "counselors", // Use the alias defined in associations
          attributes: ["name", "id"], // Include the ID attribute
          through: { attributes: [] }, // Exclude attributes from join table
        },
        {
          model: db.branches,
          as: "branch_name",
          attributes: ["branch_name"],
          required: false,
        },
        {
          model: db.adminUsers,
          as: "updated_by_user",
          attributes: ["name"],
          required: false,
          foreignKey: "updated_by",
        },
        {
          model: db.status,
          as: "status",
          attributes: ["status_name"],
          required: false,
        },
        // {
        //   model: db.flag,
        //   as: "user_primary_flags",
        //   attributes: ["flag_name"],
        //   required: false,
        // },
        {
          model: db.userExams,
          as: "exams",
          // attributes: ["exam_name","marks", "document"],
          required: false,
        },
      ],
    });

    const formattedUserPrimaryInfos = await Promise.all(
      userPrimaryInfos.map(async (info) => {
        const preferredCountries = info.preferredCountries.map((country) => ({
          country_name: country.country_name,
          status_name: country?.country_status?.[0]?.status_name,
          status_color: country?.country_status?.[0]?.color,
          status_id: country?.country_status?.[0]?.id,
          followup_date: country.user_countries?.followup_date,
          id: country.id,
        }));

        const examDetails = info.exams.map((exam) => ({
          exam_type: exam.exam_type,
          exam_date: exam.exam_date,
          marks: exam.overall_score,
          listening_score: exam.listening_score,
          speaking_score: exam.speaking_score,
          reading_score: exam.reading_score,
          writing_score: exam.writing_score,
          updated_by: exam.updated_by,
        }));

        const examDocuments = info.exams.map((exam) => ({
          exam_documents: exam.score_card,
        }));

        const counsellorNames = info.counselors?.map((counselor) => ({
          counselor_name: counselor.name,
          id: counselor.id,
        }));

        const flagDetails = await info.flag_details;

        return {
          ...info.toJSON(),
          type_name: info.type_name ? info.type_name.name : null,
          source_name: info.source_name ? info.source_name.source_name : null,
          channel_name: info.channel_name ? info.channel_name.channel_name : null,
          preferredCountries: preferredCountries,
          counselors: counsellorNames,

          office_type_name: info.office_type_name ? info.office_type_name.office_type_name : null,
          // region_name: info.region_name ? info.region_name.region_name : null,
          branch_name: info.branch_name ? info.branch_name.branch_name : null,
          updated_by_user: info.updated_by_user ? info.updated_by_user.name : null,
          status: info.status ? info.status.status_name : null,
          exam_details: examDetails,
          assigned_branch_counselor_name: info.assigned_branch_counselor_name ? info.assigned_branch_counselor_name.name : null,
          exam_documents: examDocuments,
          flag_details: flagDetails,
        };
      })
    );

    res.status(200).json({
      status: true,
      message: "User primary info retrieved successfully",
      formattedUserPrimaryInfos,
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
  const { page = 1, limit = 20, keyword } = req.query;

  const dynamicIlike = keyword ? `%${keyword}%` : `%%`;
  const isSearchApplied = keyword ? true : false;

  const offset = (page - 1) * limit;
  const parsedLimit = parseInt(limit, 10);

  try {
    // Fetch all CREs (Role ID 3)
    const allCres = await AdminUsers.findAll({
      where: { role_id: process.env.CRE_ID },
      attributes: ["id", "name"],
    });

    const userId = req.userDecodeId;
    const { count, rows } = await UserPrimaryInfo.findAndCountAll({
      distinct: true,
      where: {
        [db.Sequelize.Op.and]: [
          {
            [db.Sequelize.Op.or]: [{ assigned_cre_tl: userId }, { created_by: userId }],
          },
          {
            assigned_cre: {
              [db.Sequelize.Op.is]: null,
            },
          },
          {
            is_deleted: false,
          },
          {
            [db.Sequelize.Op.or]: [
              {
                full_name: {
                  [db.Sequelize.Op.iLike]: dynamicIlike,
                },
              },
              {
                email: {
                  [db.Sequelize.Op.iLike]: dynamicIlike,
                },
              },
            ],
          },
        ],
      },
      // distint: true,
      include: [
        // {
        //   model: db.leadCategory,
        //   as: "category_name",
        //   attributes: ["category_name"],
        // },
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
        // {
        //   model: db.country,
        //   as: "preferredCountries", // Use the alias defined in associations
        //   attributes: ["country_name", "id"], // Include both name and ID
        //   through: { attributes: [] }, // Exclude attributes from join table
        // },
        {
          model: db.country,
          as: "preferredCountries",
          attributes: ["id", "country_name"],
          through: {
            model: db.userContries,
            attributes: ["country_id", "followup_date", "status_id"],
          },
          required: false,
          include: [
            {
              model: db.status,
              as: "country_status",
              attributes: ["id", "status_name", "color"],
              required: false,
              through: {
                model: db.userContries,
                attributes: [],
              },
              where: { id: { [db.Op.eq]: db.sequelize.col("preferredCountries.user_countries.status_id") } },
            },
          ],
        },
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
        {
          model: db.adminUsers,
          as: "updated_by_user",
          attributes: ["name"],
          required: false,
          foreignKey: "updated_by",
        },
        {
          model: db.status,
          as: "status",
          attributes: ["status_name"],
          required: false,
        },
        // {
        //   model: db.flag,
        //   as: "user_primary_flags",
        //   attributes: ["flag_name"],
        //   required: false,
        // },
        {
          model: db.userExams,
          as: "exams",
          // attributes: ["exam_name","marks", "document"],
          required: false,
        },
      ],
      offset,
      limit: parsedLimit,
    });

    const formattedUserPrimaryInfos = await Promise.all(
      rows.map(async (info) => {
        const preferredCountries = info.preferredCountries.map((country) => ({
          country_name: country.country_name,
          id: country.id,
          status_name: country?.country_status?.[0]?.status_name,
          status_color: country?.country_status?.[0]?.color,
          status_id: country?.country_status?.[0]?.id,
          followup_date: country.user_countries?.followup_date,
        }));

        // const examDetails = info.exams.map((exam)=> ({
        //   exam_name: exam.exam_name,
        //   marks: exam.marks,
        // }))

        const examDetails = info.exams.map((exam) => ({
          exam_type: exam.exam_type,
          exam_date: exam.exam_date,
          marks: exam.overall_score,
          listening_score: exam.listening_score,
          speaking_score: exam.speaking_score,
          reading_score: exam.reading_score,
          writing_score: exam.writing_score,
          updated_by: exam.updated_by,
        }));

        const examDocuments = info.exams.map((exam) => ({
          exam_documents: exam.score_card,
        }));

        const flagDetails = await info.flag_details;

        return {
          ...info.toJSON(),
          // category_name: info.category_name
          //   ? info.category_name.category_name
          //   : null,
          source_name: info.source_name ? info.source_name.source_name : null,
          channel_name: info.channel_name ? info.channel_name.channel_name : null,
          preferredCountries: preferredCountries,
          franchise_id: info.franchise_id ? info.franchise_id : null,
          office_type_name: info.office_type_name ? info.office_type_name.office_type_name : null,
          region_name: info.region_name ? info.region_name.region_name : null,
          counsiler_name: info.counsiler_name ? info.counsiler_name.name : null,
          branch_name: info.branch_name ? info.branch_name.branch_name : null,
          cre_name: info.cre_name ? info.cre_name.name : "Not assigned", // Added cre_name extraction
          updated_by_user: info.updated_by_user ? info.updated_by_user.name : null,
          status: info.status ? info.status.status_name : null,
          exam_details: examDetails,
          exam_documents: examDocuments,
          flag_details: flagDetails,
        };
      })
    );

    res.status(200).json({
      status: true,
      message: "User primary info retrieved successfully",
      formattedUserPrimaryInfos,
      totalPages: Math.ceil(count / limit),
      count,
      limit: limit,
      isSearchApplied,
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
  const { page = 1, limit = 20, keyword } = req.query;

  const offset = (page - 1) * limit;
  const parsedLimit = parseInt(limit, 10);
  const isSearchApplied = keyword ? true : false;
  const dynamicIlike = keyword ? `%${keyword}%` : `%%`;

  try {
    // Fetch all CREs (Role ID 3)
    const allCres = await AdminUsers.findAll({
      where: { role_id: process.env.CRE_ID },
      attributes: ["id", "name"],
    });

    const userId = req.userDecodeId;
    const { count, rows } = await UserPrimaryInfo.findAndCountAll({
      distinct: true,
      where: {
        [db.Sequelize.Op.and]: [
          {
            [db.Sequelize.Op.or]: [{ assigned_cre_tl: userId }, { created_by: userId }],
          },
          {
            assigned_cre: {
              [db.Sequelize.Op.ne]: null,
            },
          },
          {
            is_deleted: false,
          },
          {
            [db.Sequelize.Op.or]: [
              {
                full_name: {
                  [db.Sequelize.Op.iLike]: dynamicIlike,
                },
              },
              {
                email: {
                  [db.Sequelize.Op.iLike]: dynamicIlike,
                },
              },
            ],
          },
        ],
      },
      include: [
        // {
        //   model: db.leadCategory,
        //   as: "category_name",
        //   attributes: ["category_name"],
        // },
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
        // {
        //   model: db.country,
        //   as: "preferredCountries", // Use the alias defined in associations
        //   attributes: ["country_name", "id"], // Include both name and ID
        //   through: { attributes: [] }, // Exclude attributes from join table
        // },
        {
          model: db.country,
          as: "preferredCountries",
          attributes: ["id", "country_name"],
          through: {
            model: db.userContries,
            attributes: ["country_id", "followup_date", "status_id"],
          },
          required: false,
          include: [
            {
              model: db.status,
              as: "country_status",
              attributes: ["id", "status_name", "color"],
              required: false,
              through: {
                model: db.userContries,
                attributes: [],
              },
              where: { id: { [db.Op.eq]: db.sequelize.col("preferredCountries.user_countries.status_id") } },
            },
          ],
        },
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
        {
          model: db.adminUsers,
          as: "updated_by_user",
          attributes: ["name"],
          required: false,
          foreignKey: "updated_by",
        },
        {
          model: db.status,
          as: "status",
          attributes: ["status_name"],
          required: false,
        },
        // {
        //   model: db.flag,
        //   as: "user_primary_flags",
        //   attributes: ["flag_name"],
        //   required: false,
        // },
        {
          model: db.userExams,
          as: "exams",
          // attributes: ["exam_name","marks", "document"],
          required: false,
        },
      ],
      limit: parsedLimit,
      offset: offset,
    });

    const formattedUserPrimaryInfos = await Promise.all(
      rows.map(async (info) => {
        const preferredCountries = info.preferredCountries.map((country) => ({
          country_name: country.country_name,
          id: country.id,
          status_name: country?.country_status?.[0]?.status_name,
          status_color: country?.country_status?.[0]?.color,
          status_id: country?.country_status?.[0]?.id,
          followup_date: country.user_countries?.followup_date,
        }));

        const examDetails = info.exams.map((exam) => ({
          exam_type: exam.exam_type,
          // exam_date: moment(exam.exam_date).format("YYYY-MM-DD"),
          exam_date: exam.exam_date,
          marks: exam.overall_score,
          listening_score: exam.listening_score,
          speaking_score: exam.speaking_score,
          reading_score: exam.reading_score,
          writing_score: exam.writing_score,
          updated_by: exam.updated_by,
        }));

        const examDocuments = info.exams.map((exam) => ({
          exam_documents: exam.score_card,
        }));

        const flagDetails = await info?.flag_details;

        return {
          ...info.toJSON(),
          // category_name: info.category_name
          //   ? info.category_name.category_name
          //   : null,
          source_name: info.source_name ? info.source_name.source_name : null,
          channel_name: info.channel_name ? info.channel_name.channel_name : null,
          preferredCountries: preferredCountries,
          franchise_id: info.franchise_id ? info.franchise_id : null,
          office_type_name: info.office_type_name ? info.office_type_name.office_type_name : null,
          region_name: info.region_name ? info.region_name.region_name : null,
          counsiler_name: info.counsiler_name ? info.counsiler_name.name : null,
          branch_name: info.branch_name ? info.branch_name.branch_name : null,
          cre_name: info.cre_name ? info.cre_name.name : "Not assigned", // Added cre_name extraction
          updated_by_user: info.updated_by_user ? info.updated_by_user.name : null,
          status: info.status ? info.status.status_name : null,
          exam_details: examDetails,
          exam_documents: examDocuments,
          flag_details: flagDetails,
        };
      })
    );

    res.status(200).json({
      status: true,
      message: "User primary info retrieved successfully",
      formattedUserPrimaryInfos,
      allCres,
      totalPages: Math.ceil(count / limit),
      isSearchApplied: isSearchApplied,
      count,
      limit: limit,
    });
  } catch (error) {
    console.error(`Error fetching user primary info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getAssignedLeadsForCreTlOptimised = async (req, res) => {
  const { page = 1, limit = 20, keyword } = req.query;

  const offset = (page - 1) * limit;
  const parsedLimit = parseInt(limit, 10);
  const isSearchApplied = keyword ? true : false;
  const dynamicIlike = keyword ? `%${keyword}%` : `%%`;

  try {
    // Fetch all CREs (Role ID 3)
    const allCres = await AdminUsers.findAll({
      where: { role_id: process.env.CRE_ID },
      attributes: ["id", "name"],
    });

    const userId = req.userDecodeId;
    const { count, rows } = await UserPrimaryInfo.findAndCountAll({
      distinct: true,
      where: {
        [db.Sequelize.Op.and]: [
          {
            [db.Sequelize.Op.or]: [{ assigned_cre_tl: userId }, { created_by: userId }],
          },
          {
            assigned_cre: {
              [db.Sequelize.Op.ne]: null,
            },
          },
          {
            is_deleted: false,
          },
          {
            [db.Sequelize.Op.or]: [
              {
                full_name: {
                  [db.Sequelize.Op.iLike]: dynamicIlike,
                },
              },
              {
                email: {
                  [db.Sequelize.Op.iLike]: dynamicIlike,
                },
              },
            ],
          },
        ],
      },
      include: [
        {
          model: db.leadSource,
          as: "source_name",
          attributes: ["source_name"],
        },
        {
          model: db.country,
          as: "preferredCountries",
          attributes: ["id", "country_name"],
          through: {
            model: db.userContries,
            attributes: ["country_id", "followup_date", "status_id"],
          },
          required: false,
          include: [
            {
              model: db.status,
              as: "country_status",
              attributes: ["id", "status_name", "color"],
              required: false,
              through: {
                model: db.userContries,
                attributes: [],
              },
              where: { id: { [db.Op.eq]: db.sequelize.col("preferredCountries.user_countries.status_id") } },
            },
          ],
        },
        {
          model: db.officeType,
          as: "office_type_name",
          attributes: ["office_type_name"],
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
          model: db.adminUsers,
          as: "updated_by_user",
          attributes: ["name"],
          required: false,
          foreignKey: "updated_by",
        },
      ],
      limit: parsedLimit,
      offset: offset,
    });

    const formattedUserPrimaryInfos = await Promise.all(
      rows.map(async (info) => {
        const preferredCountries = info.preferredCountries.map((country) => ({
          country_name: country.country_name,
          id: country.id,
          status_name: country?.country_status?.[0]?.status_name,
          status_color: country?.country_status?.[0]?.color,
          status_id: country?.country_status?.[0]?.id,
          followup_date: country.user_countries?.followup_date,
        }));

        return {
          ...info.toJSON(),
          source_name: info.source_name ? info.source_name.source_name : null,
          channel_name: info.channel_name ? info.channel_name.channel_name : null,
          preferredCountries: preferredCountries,
          franchise_id: info.franchise_id ? info.franchise_id : null,
          office_type_name: info.office_type_name ? info.office_type_name.office_type_name : null,
          region_name: info.region_name ? info.region_name.region_name : null,
          counsiler_name: info.counsiler_name ? info.counsiler_name.name : null,
          branch_name: info.branch_name ? info.branch_name.branch_name : null,
          cre_name: info.cre_name ? info.cre_name.name : "Not assigned", // Added cre_name extraction
          updated_by_user: info.updated_by_user ? info.updated_by_user.name : null,
          status: info.status ? info.status.status_name : null,
        };
      })
    );

    res.status(200).json({
      status: true,
      message: "User primary info retrieved successfully",
      formattedUserPrimaryInfos,
      allCres,
      totalPages: Math.ceil(count / limit),
      isSearchApplied: isSearchApplied,
      count,
      limit: limit,
    });
  } catch (error) {
    console.error(`Error fetching user primary info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getAssignedLeadsForCounsellorTL = async (req, res) => {
  const { page = 1, limit = 20, keyword } = req.query;
  const isSearchApplied = keyword ? true : false;
  const dynamicIlike = keyword ? `%${keyword}%` : `%%`;

  const offset = (page - 1) * limit;
  const parsedLimit = parseInt(limit, 10);

  try {
    const allCounsellorTLs = await AdminUsers.findAll({
      where: { role_id: process.env.COUNSELLOR_TL_ID },
      attributes: ["id", "name"],
    });

    const userId = req.userDecodeId;
    const { rows, count } = await UserPrimaryInfo.findAndCountAll({
      distinct: true,
      where: {
        [db.Sequelize.Op.and]: [
          {
            [db.Sequelize.Op.or]: [{ assigned_counsellor_tl: userId }, { created_by: userId }],
          },
          {
            assigned_branch_counselor: {
              [db.Sequelize.Op.ne]: null,
            },
          },
          {
            is_deleted: false,
          },
          {
            [db.Sequelize.Op.or]: [
              {
                full_name: { [db.Sequelize.Op.iLike]: dynamicIlike },
              },
              {
                email: { [db.Sequelize.Op.iLike]: dynamicIlike },
              },
            ],
          },
        ],
      },
      include: [
        // {
        //   model: db.leadCategory,
        //   as: "category_name",
        //   attributes: ["category_name"],
        // },
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
        // {
        //   model: db.country,
        //   as: "preferredCountries", // Use the alias defined in associations
        //   attributes: ["country_name", "id"], // Include both name and ID
        //   through: { attributes: [] }, // Exclude attributes from join table
        // },
        {
          model: db.country,
          as: "preferredCountries",
          attributes: ["id", "country_name"],
          through: {
            model: db.userContries,
            attributes: ["country_id", "followup_date", "status_id"],
          },
          required: false,
          include: [
            {
              model: db.status,
              as: "country_status",
              attributes: ["id", "status_name", "color"],
              required: false,
              through: {
                model: db.userContries,
                attributes: [],
              },
              where: { id: { [db.Op.eq]: db.sequelize.col("preferredCountries.user_countries.status_id") } },
            },
          ],
        },
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
        {
          model: db.adminUsers,
          as: "updated_by_user",
          attributes: ["name"],
          required: false,
          foreignKey: "updated_by",
        },
        {
          model: db.status,
          as: "status",
          attributes: ["status_name"],
          required: false,
        },
        // {
        //   model: db.flag,
        //   as: "user_primary_flags",
        //   attributes: ["flag_name"],
        //   required: false,
        // },
        {
          model: db.userExams,
          as: "exams",
          // attributes: ["exam_name","marks", "document"],
          required: false,
        },
      ],
      offset: offset,
      limit: parsedLimit,
    });

    const formattedUserPrimaryInfos = await Promise.all(
      rows.map(async (info) => {
        const preferredCountries = info.preferredCountries.map((country) => ({
          country_name: country.country_name,
          id: country.id,
          status_name: country?.country_status?.[0]?.status_name,
          status_color: country?.country_status?.[0]?.color,
          status_id: country?.country_status?.[0]?.id,
          followup_date: country.user_countries?.followup_date,
        }));

        const examDetails = info.exams.map((exam) => ({
          exam_type: exam.exam_type,
          exam_date: exam.exam_date,
          marks: exam.overall_score,
          listening_score: exam.listening_score,
          speaking_score: exam.speaking_score,
          reading_score: exam.reading_score,
          writing_score: exam.writing_score,
          updated_by: exam.updated_by,
        }));

        const examDocuments = info.exams.map((exam) => ({
          exam_documents: exam.score_card,
        }));

        const flagDetails = await info?.flag_details;

        return {
          ...info.toJSON(),
          // category_name: info.category_name
          //   ? info.category_name.category_name
          //   : null,
          source_name: info.source_name ? info.source_name.source_name : null,
          channel_name: info.channel_name ? info.channel_name.channel_name : null,
          preferredCountries: preferredCountries,
          franchise_id: info.franchise_id ? info.franchise_id : null,
          office_type_name: info.office_type_name ? info.office_type_name.office_type_name : null,
          region_name: info.region_name ? info.region_name.region_name : null,
          counsiler_name: info.counsiler_name ? info.counsiler_name.name : null,
          branch_name: info.branch_name ? info.branch_name.branch_name : null,
          cre_name: info.cre_name ? info.cre_name.name : "Not assigned", // Added cre_name extraction
          updated_by_user: info.updated_by_user ? info.updated_by_user.name : null,
          status: info.status ? info.status.status_name : null,
          exam_details: examDetails,
          exam_documents: examDocuments,
          flag_details: flagDetails,
        };
      })
    );

    res.status(200).json({
      status: true,
      message: "User primary info retrieved successfully",
      formattedUserPrimaryInfos,
      totalPages: Math.ceil(count / limit),
      count,
      limit: limit,
      isSearchApplied,
      allCounsellorTLs,
    });
  } catch (error) {
    console.error(`Error fetching user primary info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getAssignedLeadsForCounsellorTLOptiimised = async (req, res) => {
  const { page = 1, limit = 20, keyword } = req.query;
  const isSearchApplied = keyword ? true : false;
  const dynamicIlike = keyword ? `%${keyword}%` : `%%`;

  const offset = (page - 1) * limit;
  const parsedLimit = parseInt(limit, 10);

  try {
    const allCounsellorTLs = await AdminUsers.findAll({
      where: { role_id: process.env.COUNSELLOR_TL_ID },
      attributes: ["id", "name"],
    });

    const userId = req.userDecodeId;
    const { rows, count } = await UserPrimaryInfo.findAndCountAll({
      distinct: true,
      where: {
        [db.Sequelize.Op.and]: [
          {
            [db.Sequelize.Op.or]: [{ assigned_counsellor_tl: userId }, { created_by: userId }],
          },
          {
            assigned_branch_counselor: {
              [db.Sequelize.Op.ne]: null,
            },
          },
          {
            is_deleted: false,
          },
          {
            [db.Sequelize.Op.or]: [
              {
                full_name: { [db.Sequelize.Op.iLike]: dynamicIlike },
              },
              {
                email: { [db.Sequelize.Op.iLike]: dynamicIlike },
              },
            ],
          },
        ],
      },
      include: [
        {
          model: db.leadSource,
          as: "source_name",
          attributes: ["source_name"],
        },
        {
          model: db.country,
          as: "preferredCountries",
          attributes: ["id", "country_name"],
          through: {
            model: db.userContries,
            attributes: ["country_id", "followup_date", "status_id"],
          },
          required: false,
          include: [
            {
              model: db.status,
              as: "country_status",
              attributes: ["id", "status_name", "color"],
              required: false,
              through: {
                model: db.userContries,
                attributes: [],
              },
              where: { id: { [db.Op.eq]: db.sequelize.col("preferredCountries.user_countries.status_id") } },
            },
          ],
        },
        {
          model: db.officeType,
          as: "office_type_name",
          attributes: ["office_type_name"],
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
        {
          model: db.adminUsers,
          as: "updated_by_user",
          attributes: ["name"],
          required: false,
          foreignKey: "updated_by",
        },
        {
          model: db.status,
          as: "status",
          attributes: ["status_name"],
          required: false,
        },
      ],
      offset: offset,
      limit: parsedLimit,
    });

    const formattedUserPrimaryInfos = await Promise.all(
      rows.map(async (info) => {
        const preferredCountries = info.preferredCountries.map((country) => ({
          country_name: country.country_name,
          id: country.id,
          status_name: country?.country_status?.[0]?.status_name,
          status_color: country?.country_status?.[0]?.color,
          status_id: country?.country_status?.[0]?.id,
          followup_date: country.user_countries?.followup_date,
        }));

        return {
          ...info.toJSON(),
          source_name: info.source_name ? info.source_name.source_name : null,
          channel_name: info.channel_name ? info.channel_name.channel_name : null,
          preferredCountries: preferredCountries,
          franchise_id: info.franchise_id ? info.franchise_id : null,
          office_type_name: info.office_type_name ? info.office_type_name.office_type_name : null,
          region_name: info.region_name ? info.region_name.region_name : null,
          counsiler_name: info.counsiler_name ? info.counsiler_name.name : null,
          branch_name: info.branch_name ? info.branch_name.branch_name : null,
          cre_name: info.cre_name ? info.cre_name.name : "Not assigned", // Added cre_name extraction
          updated_by_user: info.updated_by_user ? info.updated_by_user.name : null,
          status: info.status ? info.status.status_name : null,
        };
      })
    );

    res.status(200).json({
      status: true,
      message: "User primary info retrieved successfully",
      formattedUserPrimaryInfos,
      totalPages: Math.ceil(count / limit),
      count,
      limit: limit,
      isSearchApplied,
      allCounsellorTLs,
    });
  } catch (error) {
    console.error(`Error fetching user primary info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.geLeadsForCounsellorTL = async (req, res) => {
  try {
    const allCounsellors = await AdminUsers.findAll({
      where: { role_id: process.env.CRE_ID },
      attributes: ["id", "name"],
    });

    const userId = req.userDecodeId;
    const userPrimaryInfos = await UserPrimaryInfo.findAll({
      where: {
        [db.Sequelize.Op.and]: [
          {
            [db.Sequelize.Op.or]: [
              { assigned_counsellor_tl: userId },
              { created_by: userId },
              { assigned_counsellor_tl: userId },
            ],
          },
          {
            assigned_branch_counselor: {
              [db.Sequelize.Op.is]: null,
            },
          },
          {
            is_deleted: false,
          },
        ],
      },
      include: [
        // {
        //   model: db.leadCategory,
        //   as: "category_name",
        //   attributes: ["category_name"],
        // },
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
        // {
        //   model: db.country,
        //   as: "preferredCountries", // Use the alias defined in associations
        //   attributes: ["country_name", "id"], // Include both name and ID
        //   through: { attributes: [] }, // Exclude attributes from join table
        // },
        {
          model: db.country,
          as: "preferredCountries",
          attributes: ["id", "country_name"],
          through: {
            model: db.userContries,
            attributes: ["country_id", "followup_date", "status_id"],
          },
          required: false,
          include: [
            {
              model: db.status,
              as: "country_status",
              attributes: ["id", "status_name", "color"],
              required: false,
              through: {
                model: db.userContries,
                attributes: [],
              },
              where: { id: { [db.Op.eq]: db.sequelize.col("preferredCountries.user_countries.status_id") } },
            },
          ],
        },
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
        {
          model: db.adminUsers,
          as: "updated_by_user",
          attributes: ["name"],
          required: false,
          foreignKey: "updated_by",
        },
        {
          model: db.status,
          as: "status",
          attributes: ["status_name"],
          required: false,
        },
        // {
        //   model: db.flag,
        //   as: "user_primary_flags",
        //   attributes: ["flag_name"],
        //   required: false,
        // },
        {
          model: db.userExams,
          as: "exams",
          // attributes: ["exam_name","marks", "document"],
          required: false,
        },
      ],
    });

    const formattedUserPrimaryInfos = await Promise.all(
      userPrimaryInfos.map(async (info) => {
        const preferredCountries = info.preferredCountries.map((country) => ({
          country_name: country.country_name,
          id: country.id,
          status_name: country?.country_status?.[0]?.status_name,
          status_color: country?.country_status?.[0]?.color,
          status_id: country?.country_status?.[0]?.id,
          followup_date: country.user_countries?.followup_date,
        }));

        const examDetails = info.exams.map((exam) => ({
          exam_type: exam.exam_type,
          exam_date: exam.exam_date,
          marks: exam.overall_score,
          listening_score: exam.listening_score,
          speaking_score: exam.speaking_score,
          reading_score: exam.reading_score,
          writing_score: exam.writing_score,
          updated_by: exam.updated_by,
        }));

        const examDocuments = info.exams.map((exam) => ({
          exam_documents: exam.score_card,
        }));

        const flagDetails = await info?.flag_details;

        return {
          ...info.toJSON(),
          // category_name: info.category_name
          //   ? info.category_name.category_name
          //   : null,
          source_name: info.source_name ? info.source_name.source_name : null,
          channel_name: info.channel_name ? info.channel_name.channel_name : null,
          preferredCountries: preferredCountries,
          franchise_id: info.franchise_id ? info.franchise_id : null,
          office_type_name: info.office_type_name ? info.office_type_name.office_type_name : null,
          region_name: info.region_name ? info.region_name.region_name : null,
          counsiler_name: info.counsiler_name ? info.counsiler_name.name : null,
          branch_name: info.branch_name ? info.branch_name.branch_name : null,
          cre_name: info.cre_name ? info.cre_name.name : "Not assigned", // Added cre_name extraction
          updated_by_user: info.updated_by_user ? info.updated_by_user.name : null,
          status: info.status ? info.status.status_name : null,
          exam_details: examDetails,
          exam_documents: examDocuments,
          flag_details: flagDetails,
        };
      })
    );

    res.status(200).json({
      status: true,
      message: "User primary info retrieved successfully",
      formattedUserPrimaryInfos,
      allCounsellors,
    });
  } catch (error) {
    console.error(`Error fetching user primary info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getAllUserDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("id", id);

    const AllDocs = await db.userPrimaryInfo.findAll({
      where: { id: id },
      attributes: ["id", "full_name"],
      include: [
        {
          model: db.studentAdditionalDocs,
          as: "additional_docs",
          where: { student_id: id },
          required: false,
          attributes: ["passport_doc", "updated_cv", "profile_assessment_doc", "pte_cred", "lor", "sop", "gte_form"],
        },
        {
          model: db.previousVisaDecline,
          as: "previousVisaDeclines",
          where: { student_id: id },
          required: false,
          attributes: ["id", "visa_type", "declined_letter"],
        },
        {
          model: db.previousVisaApprove,
          as: "previousVisaApprovals",
          where: { student_id: id },
          required: false,
          attributes: ["id", "visa_type", "approved_letter"],
        },
        {
          model: db.fundPlan,
          as: "fundPlan",
          where: { student_id: id },
          required: false,
          attributes: ["id", "type", "supporting_document"],
        },
        {
          model: db.educationDetails,
          as: "educationDetails",
          where: { student_id: id },
          required: false,
          attributes: ["id", "qualification", "board_name", "school_name", "mark_sheet", "admit_card", "certificate"],
        },
        {
          model: db.graduationDetails,
          as: "graduationDetails",
          where: { student_id: id },
          required: false,
          attributes: [
            "id",
            "qualification",
            "university_name",
            "college_name",
            "admit_card",
            "certificate",
            "backlog_certificate",
            "registration_certificate",
            "grading_scale_info",
            "transcript",
            "individual_marksheet",
          ],
        },
        {
          model: db.workInfos,
          as: "userWorkInfos",
          where: { user_id: id },
          required: false,
          attributes: [
            "id",
            "company",
            "designation",
            "bank_statement",
            "job_offer_document",
            "experience_certificate",
            "appointment_document",
            "payslip_document",
          ],
        },
        {
          model: db.userExams,
          as: "exams",
          where: { student_id: id },
          required: false,
          attributes: ["id", "exam_type", "score_card", "overall_score"],
        },
        {
          model: db.userBasicInfo,
          as: "basic_info_details",
          where: { user_id: id },
          required: false,
          attributes: ["id", "police_clearance_docs"],
        },
        {
          model: db.EmploymentHistory,
          as: "userEmploymentHistories",
          where: { student_id: id },
          required: false,
          attributes: ["id", "visa_page", "permit_card", "salary_account_statement", "supporting_documents"],
        },
        {
          model: db.gapReason,
          required: false,
          as: "gapReasons",
          attributes: ["id", "start_date", "end_date", "type", "supporting_document"],
        },
      ],
    });

    let educationGaps = [];
    let workGaps = [];

    AllDocs[0]?.gapReasons?.forEach((doc) => {
      if (doc.type === "education") {
        educationGaps.push(doc);
      } else {
        workGaps.push(doc);
      }
    });

    res.status(200).json({
      status: true,
      message: "User documents retrieved successfully",
      data: AllDocs[0],
      educationGaps: educationGaps,
      workGaps: workGaps,
    });
  } catch (error) {
    console.error(`Error fetching user documents: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
