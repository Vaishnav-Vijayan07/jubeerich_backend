const { QueryTypes } = require("sequelize");
const IdsFromEnv = require("../constants/ids");
const db = require("../models");
const { transformOfficeWiseCountToChartData, processCardData, getDataForItTeam } = require("../utils/dashboard_controller_helpers");

exports.getDashboard = async (req, res) => {
  const { role_id } = req;
  const { filterType, year, month, fromDate, toDate } = req.query;
  let filterArgs = {};

  console.log("filter", filterType);
  console.log("year", year);
  console.log("month", month);
  console.log("fromDate", fromDate);
  console.log("toDate", toDate);

  switch (filterType) {
    case "monthly":
      filterArgs = { type: filterType, year, month };
      break;

    case "weekly":
      filterArgs = { type: filterType, year, month, fromDate };
      break;

    case "custom":
      filterArgs = { type: filterType, fromDate, toDate };
      break;

    default:
      const today = new Date();
      const tomorrow = new Date(today.setDate(today.getDate() + 1));
      filterArgs = { type: filterType, toDate: tomorrow.toISOString().split("T")[0] };
      break;
  }

  let result;

  try {
    switch (role_id) {
      case IdsFromEnv.IT_TEAM_ID:
        result = await getDataForItTeam(filterArgs);
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

    const { officeWiseCount, leadCount, officeTypes, statustyps, latestLeadsCount } = result;
    const { statCards } = processCardData(leadCount);
    const { categories, series } = transformOfficeWiseCountToChartData(officeWiseCount, officeTypes, statustyps);

    res.status(200).json({
      message: "Dashboard data fetched successfully",
      status: true,
      categories,
      series,
      statCards,
      latestLeadsCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};


