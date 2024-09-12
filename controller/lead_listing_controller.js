const db = require("../models");
const UserPrimaryInfo = db.userPrimaryInfo;
const AdminUsers = db.adminUsers;

exports.getLeads = async (req, res) => {
  try {
    const userPrimaryInfos = await UserPrimaryInfo.findAll({
      where: {
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
        {
          model: db.country,
          as: "preferredCountries", // Use the alias defined in associations
          attributes: ["country_name", "id"], // Include the ID attribute
          through: { attributes: [] }, // Exclude attributes from join table
        },
        {
          model: db.adminUsers,
          as: "counselors", // Use the alias defined in associations
          attributes: ["name", "id"], // Include the ID attribute
          through: { attributes: [] }, // Exclude attributes from join table
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
          foreignKey: "updated_by"
        }
      ],
    });

    const formattedUserPrimaryInfos = userPrimaryInfos.map((info) => {
      const preferredCountries = info.preferredCountries.map((country) => ({
        country_name: country.country_name,
        id: country.id,
      }));

      const counsellorNames = info.counselors?.map((counselor) => ({
        counselor_name: counselor.name,
        id: counselor.id,
      }))

      return {
        ...info.toJSON(),
        category_name: info.category_name
          ? info.category_name.category_name
          : null,
        source_name: info.source_name ? info.source_name.source_name : null,
        channel_name: info.channel_name ? info.channel_name.channel_name : null,
        preferredCountries: preferredCountries,
        counselors: counsellorNames,
        office_type_name: info.office_type_name
          ? info.office_type_name.office_type_name
          : null,
        region_name: info.region_name ? info.region_name.region_name : null,
        counsiler_name: info.counsiler_name ? info.counsiler_name.name : null,
        status: info.status ? info.status.status_name : null,
        branch_name: info.branch_name ? info.branch_name.branch_name : null,
        updated_by_user: info.updated_by_user ? info.updated_by_user.name : null,
      };
    });

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

exports.getAllLeads = async (req, res) => {
  const cre_id = req.userDecodeId;

  try {
    const userPrimaryInfos = await UserPrimaryInfo.findAll({
      where: {
        [db.Sequelize.Op.or]: [
          { assigned_cre_tl: cre_id },
          { created_by: cre_id },
          { assigned_cre: cre_id },
          { assigned_regional_manager: cre_id },
          {
            [db.Sequelize.Op.and]: [
              db.Sequelize.literal(`EXISTS (
                  SELECT 1 FROM "user_counselors" 
                  WHERE "user_counselors"."user_id" = "user_primary_info"."id"
                  AND "user_counselors"."counselor_id" = ${cre_id}
                )`)
            ]
          },
          {
            [db.Sequelize.Op.and]: [
              db.Sequelize.literal(`EXISTS (
                SELECT 1 FROM "admin_users"
                WHERE "admin_users"."region_id" = "user_primary_info"."region_id"
                AND "admin_users"."id" = ${cre_id}
              )`)
            ]
          }
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
        {
          model: db.country,
          as: "preferredCountries",
          attributes: ["country_name", "id"],
          through: { attributes: [] }, // Exclude join table attributes
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
          foreignKey: "updated_by"
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
    });

    const formattedUserPrimaryInfos = userPrimaryInfos.map((info) => {
      const preferredCountries = info.preferredCountries.map((country) => ({
        country_name: country.country_name,
        id: country.id,
      }));

      const examDetails = info.exams.map((exam)=> ({
        exam_type: exam.exam_type,
        exam_date: exam.exam_date,
        marks: exam.overall_score,
        listening_score: exam.listening_score,
        speaking_score: exam.speaking_score,
        reading_score: exam.reading_score,
        writing_score: exam.writing_score,
        updated_by: exam.updated_by
      }))
      
      const examDocuments = info.exams.map((exam)=> ({
        exam_documents: exam.score_card,
      }))

      const counsellorNames = info.counselors?.map((counselor) => ({
        counselor_name: counselor.name,
        id: counselor.id,
      }))

      return {
        ...info.toJSON(),
        category_name: info.category_name
          ? info.category_name.category_name
          : null,
        source_name: info.source_name ? info.source_name.source_name : null,
        channel_name: info.channel_name ? info.channel_name.channel_name : null,
        preferredCountries: preferredCountries,
        counselors: counsellorNames,
        office_type_name: info.office_type_name
          ? info.office_type_name.office_type_name
          : null,
        region_name: info.region_name ? info.region_name.region_name : null,
        branch_name: info.branch_name ? info.branch_name.branch_name : null,
        updated_by_user: info.updated_by_user ? info.updated_by_user.name : null,
        status: info.status ? info.status.status_name : null,
        exam_details: examDetails,
        exam_documents: examDocuments
      };
    });

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
        {
          model: db.country,
          as: "preferredCountries", // Use the alias defined in associations
          attributes: ["country_name", "id"], // Include the ID attribute
          through: { attributes: [] }, // Exclude attributes from join table
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
          model: db.branches,
          as: "branch_name",
          attributes: ["branch_name"],
          required: false,
        },
        {
          model: db.adminUsers,
          as: "counselors", // Use the alias defined in associations
          attributes: ["name", "id"], // Include the ID attribute
          through: { attributes: [] }, // Exclude attributes from join table
        },
        {
          model: db.adminUsers,
          as: "updated_by_user",
          attributes: ["name"],
          required: false,
          foreignKey: "updated_by"
        },
        {
          model: db.status,
          as: "status",
          attributes: ["status_name"],
          required: false,
        },
      ],
    });

    const formattedUserPrimaryInfos = userPrimaryInfos.map((info) => {
      const preferredCountries = info.preferredCountries.map((country) => ({
        country_name: country.country_name,
        id: country.id,
      }));

      const counsellorNames = info.counselors?.map((counselor) => ({
        counselor_name: counselor.name,
        id: counselor.id,
      }))

      return {
        ...info.toJSON(),
        category_name: info.category_name
          ? info.category_name.category_name
          : null,
        source_name: info.source_name ? info.source_name.source_name : null,
        channel_name: info.channel_name ? info.channel_name.channel_name : null,
        preferredCountries: preferredCountries,
        counselors: counsellorNames,
        office_type_name: info.office_type_name
          ? info.office_type_name.office_type_name
          : null,
        region_name: info.region_name ? info.region_name.region_name : null,
        counsiler_name: info.counsiler_name ? info.counsiler_name.name : null,
        branch_name: info.branch_name ? info.branch_name.branch_name : null,
        updated_by_user: info.updated_by_user ? info.updated_by_user.name : null,
        status: info.status ? info.status.status_name : null,
      };
    });

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
    // Fetch all CREs (Role ID 3)
    const allCres = await AdminUsers.findAll({
      where: { role_id: 3 },
      attributes: ["id", "name"],
    });

    const userId = req.userDecodeId;
    const userPrimaryInfos = await UserPrimaryInfo.findAll({
      where: {
        [db.Sequelize.Op.and]: [
          {
            [db.Sequelize.Op.or]: [
              { assigned_cre_tl: userId },
              { created_by: userId },
            ],
          },
          {
            assigned_cre: {
              [db.Sequelize.Op.is]: null,
            },
          },
          {
            is_deleted: false,
          },
        ],
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
        {
          model: db.country,
          as: "preferredCountries", // Use the alias defined in associations
          attributes: ["country_name", "id"], // Include both name and ID
          through: { attributes: [] }, // Exclude attributes from join table
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
          foreignKey: "updated_by"
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
    });

    const formattedUserPrimaryInfos = userPrimaryInfos.map((info) => {
      const preferredCountries = info.preferredCountries.map((country) => ({
        country_name: country.country_name,
        id: country.id,
      }));

      // const examDetails = info.exams.map((exam)=> ({
      //   exam_name: exam.exam_name,
      //   marks: exam.marks,
      // }))

      const examDetails = info.exams.map((exam)=> ({
        exam_type: exam.exam_type,
        exam_date: exam.exam_date,
        marks: exam.overall_score,
        listening_score: exam.listening_score,
        speaking_score: exam.speaking_score,
        reading_score: exam.reading_score,
        writing_score: exam.writing_score,
        updated_by: exam.updated_by
      }))
      
      const examDocuments = info.exams.map((exam)=> ({
        exam_documents: exam.score_card,
      }))

      return {
        ...info.toJSON(),
        category_name: info.category_name
          ? info.category_name.category_name
          : null,
        source_name: info.source_name ? info.source_name.source_name : null,
        channel_name: info.channel_name ? info.channel_name.channel_name : null,
        preferredCountries: preferredCountries,
        office_type_name: info.office_type_name
          ? info.office_type_name.office_type_name
          : null,
        region_name: info.region_name ? info.region_name.region_name : null,
        counsiler_name: info.counsiler_name ? info.counsiler_name.name : null,
        branch_name: info.branch_name ? info.branch_name.branch_name : null,
        cre_name: info.cre_name ? info.cre_name.name : "Not assigned", // Added cre_name extraction
        updated_by_user: info.updated_by_user ? info.updated_by_user.name : null,
        status: info.status ? info.status.status_name : null,
        exam_details: examDetails,
        exam_documents: examDocuments
      };
    });

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
    // Fetch all CREs (Role ID 3)
    const allCres = await AdminUsers.findAll({
      where: { role_id: 3 },
      attributes: ["id", "name"],
    });

    const userId = req.userDecodeId;
    const userPrimaryInfos = await UserPrimaryInfo.findAll({
      where: {
        [db.Sequelize.Op.and]: [
          {
            [db.Sequelize.Op.or]: [
              { assigned_cre_tl: userId },
              { created_by: userId },
            ],
          },
          {
            assigned_cre: {
              [db.Sequelize.Op.ne]: null,
            },
          },
          {
            is_deleted: false,
          },
        ],
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
        {
          model: db.country,
          as: "preferredCountries", // Use the alias defined in associations
          attributes: ["country_name", "id"], // Include both name and ID
          through: { attributes: [] }, // Exclude attributes from join table
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
          foreignKey: "updated_by"
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
    });

    const formattedUserPrimaryInfos = userPrimaryInfos.map((info) => {
      const preferredCountries = info.preferredCountries.map((country) => ({
        country_name: country.country_name,
        id: country.id,
      }));

      // const examDetails = info.exams.map((exam)=> ({
      //   exam_name: exam.exam_name,
      //   marks: exam.marks,
      // }))

      const examDetails = info.exams.map((exam)=> ({
        exam_type: exam.exam_type,
        exam_date: moment(exam.exam_date).format("YYYY-MM-DD"),
        marks: exam.overall_score,
        listening_score: exam.listening_score,
        speaking_score: exam.speaking_score,
        reading_score: exam.reading_score,
        writing_score: exam.writing_score,
        updated_by: exam.updated_by
      }))
      
      const examDocuments = info.exams.map((exam)=> ({
        exam_documents: exam.score_card,
      }))

      return {
        ...info.toJSON(),
        category_name: info.category_name
          ? info.category_name.category_name
          : null,
        source_name: info.source_name ? info.source_name.source_name : null,
        channel_name: info.channel_name ? info.channel_name.channel_name : null,
        preferredCountries: preferredCountries,
        office_type_name: info.office_type_name
          ? info.office_type_name.office_type_name
          : null,
        region_name: info.region_name ? info.region_name.region_name : null,
        counsiler_name: info.counsiler_name ? info.counsiler_name.name : null,
        branch_name: info.branch_name ? info.branch_name.branch_name : null,
        cre_name: info.cre_name ? info.cre_name.name : "Not assigned", // Added cre_name extraction
        updated_by_user: info.updated_by_user ? info.updated_by_user.name : null,
        status: info.status ? info.status.status_name : null,
        exam_details: examDetails,
        exam_documents: examDocuments
      };
    });

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