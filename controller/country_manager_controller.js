const db = require("../models");
const UserPrimaryInfo = db.userPrimaryInfo;
const AdminUsers = db.adminUsers;
exports.getLeadsForCountryManager = async (req, res) => {
  try {
    const userId = req.userDecodeId;

    const adminUser = await AdminUsers.findByPk(userId);  // Await the promise to get the admin user data
    
    if (!adminUser) {
      return res.status(404).json({
        status: false,
        message: "Admin user not found",
      });
    }

    const country_id = adminUser.country_id;  // Get country_id from the found AdminUser

    console.log("country_id ===>", country_id);
    
    const userPrimaryInfos = await UserPrimaryInfo.findAll({
      where: { is_deleted: false },
      // attributes: ['id', 'full_name', 'email'], // Only select necessary columns
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
          attributes: ["country_name", "id"],
          through: { attributes: [] },
          required: true,
          where: country_id ? { id: country_id } : {},
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
          model: db.flag,
          as: "user_primary_flags",
          attributes: ["flag_name"],
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
    });

    const formattedUserPrimaryInfos = userPrimaryInfos.map((info) => {
      const preferredCountries = info.preferredCountries.map((country) => ({
        country_name: country.country_name,
        id: country.id,
      }));

      const counsellorNames = info.counselors?.map((counselor) => ({
        counselor_name: counselor.name,
        id: counselor.id,
      }));

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
      };
    });

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
