const IdsFromEnv = require("../constants/ids");
const db = require("../models");

exports.getDashboard = async (req, res) => {
  const { role_id } = req;

  let result;

  try {
    switch (role_id) {
      case IdsFromEnv.IT_TEAM_ID:
        result = await getDataForItTeam();
        break;
      case IdsFromEnv.CRE_TL_ID:
        result = await getDataForCreTl();
        break;
      case IdsFromEnv.CRE_ID:
        result = await getDataForCre();
        break;
      case IdsFromEnv.COUNTRY_MANAGER_ID:
        result = await getDataForCountryManager();
        break;
      default:
        return res.status(403).json({
          message: "Unauthorized role",
          status: false,
        });
    }

    res.status(200).json({
      message: "Dashboard data fetched successfully",
      status: true,
      result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getDataForItTeam = async () => {
  try {
    const { Op, literal } = db.Sequelize;

    const users = await db.userPrimaryInfo.findAll({
      attributes: ["id", "full_name"], // Columns from userPrimaryInfo
      where: { is_deleted: false },
      include: [
        {
          model: db.status,
          as: "preferredStatus",
          attributes: ["id", "status_name", "type_id"], // Columns from status
          through: {
            model: db.userContries,
            attributes: [],
          },
          include: [
            {
              model: db.statusType,
              as: "statusType",
              attributes: ["priority", "type_name"], // Columns from statusType
            },
          ],
          where: {
            id: 1
          }
        },

      ],
    });

    return users;
  } catch (error) {
    console.error("Error in getDataForItTeam:", error.message);
    throw new Error("Failed to fetch IT team data");
  }
};
