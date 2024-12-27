const IdsFromEnv = require("../constants/ids");
const {
  transformOfficeToStackData,
  processCardData,
  getDataForItTeam,
  getDataForCreTl,
  getDataForCre,
  transformOfficeToBarData,
  getDataForCounselor,
} = require("../utils/dashboard_controller_helpers");

exports.getDashboard = async (req, res) => {
  const { role_id, userDecodeId } = req;
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
  let categories;
  let series;

  try {
    switch (role_id) {
      case IdsFromEnv.IT_TEAM_ID:
        console.log("<===============it IT_TEAM==============>")
        result = await getDataForItTeam(filterArgs, role_id, userDecodeId);
        break;
      case IdsFromEnv.CRE_TL_ID:
        console.log("<===============it CRE_TL_ID==============>")
        result = await getDataForCreTl(filterArgs, role_id, userDecodeId);
        break;
      case IdsFromEnv.CRE_ID:
        console.log("<===============it CRE_ID==============>")
        result = await getDataForCre(filterArgs, role_id, userDecodeId);
        break;
      case IdsFromEnv.COUNSELLOR_ROLE_ID:
        console.log("<===============it COUNSELLOR_ROLE_ID==============>")
        result = await getDataForCounselor(filterArgs, role_id, userDecodeId);
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

    const { roleWiseData, leadCount, graphCategory, statustyps, latestLeadsCount } = result;
    const { statCards } = processCardData(leadCount);
    if (role_id === IdsFromEnv.CRE_ID) {
      const { barCategories, barSeries } = transformOfficeToBarData(roleWiseData, statustyps);
      categories = barCategories;
      series = barSeries;
    } else {
      const { stackCategories, stackSeries } = transformOfficeToStackData(roleWiseData, graphCategory, statustyps);
      categories = stackCategories;
      series = stackSeries;
    }

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
