const IdsFromEnv = require("../constants/ids");
const db = require("../models");
const {
  getDataForItTeam,
  getDataForCreTl,
  getDataForCre,
  getDataForCounselor,
  getDataForCountryManager,
  getDataForApplicationManger,
} = require("../utils/dashboard_controller_helpers");
const {
  processCardData,
  transformOfficeToBarData,
  transformOfficeToStackData,
  generateCardForApplication,
  generateStackDataForApplication,
} = require("../utils/dashboard_data_transform_helpers");

exports.getDashboard = async (req, res) => {
  const { role_id, userDecodeId } = req;
  const { filterType, year, month, fromDate, toDate, country_id } = req.query;
  let filterArgs = {};

  switch (filterType) {
    case "monthly":
      filterArgs = { type: filterType, year, month,country_id };
      break;

    case "weekly":
      filterArgs = { type: filterType, year, month, fromDate,country_id };
      break;

    case "custom":
      filterArgs = { type: filterType, fromDate, toDate,country_id };
      break;

    default:
      const today = new Date();
      const tomorrow = new Date(today.setDate(today.getDate() + 1));
      filterArgs = { type: filterType, toDate: tomorrow.toISOString().split("T")[0],country_id };
      break;
  }

  console.log("COUNTRYID", country_id);

  let result;

  try {
    switch (role_id) {
      case IdsFromEnv.IT_TEAM_ID:
        console.log("<=============== IT_TEAM==============>");
        result = await getDataForItTeam(filterArgs, role_id, userDecodeId);
        break;
      case IdsFromEnv.CRE_TL_ID:
        console.log("<=============== CRE_TL_ID==============>");
        result = await getDataForCreTl(filterArgs, role_id, userDecodeId);
        break;
      case IdsFromEnv.CRE_ID:
        console.log("<=============== CRE_ID==============>");
        result = await getDataForCre(filterArgs, role_id, userDecodeId);
        break;
      case IdsFromEnv.COUNSELLOR_ROLE_ID:
        console.log("<=============== COUNSELLOR_ROLE_ID==============>");
        result = await getDataForCounselor(filterArgs, role_id, userDecodeId);
        break;
      case IdsFromEnv.COUNTRY_MANAGER_ID:
        console.log("<=============== COUNTRY_MANAGER ==============>");
        result = await getDataForCountryManager(filterArgs, role_id, userDecodeId);
        break;
      case IdsFromEnv.APPLICATION_MANAGER_ID:
        console.log("<=============== APPLICATION_MANAGER==============>");
        result = await getDataForApplicationManger(filterArgs, role_id, userDecodeId);
        break;
      default:
        return res.status(403).json({
          message: "Unauthorized role",
          status: false,
        });
    }

    const { roleWiseData, leadCount, graphCategory, statustyps, latestLeadsCount, applicationData } = result;

    const cards =
      role_id === IdsFromEnv.APPLICATION_MANAGER_ID ? generateCardForApplication(leadCount).cardData : processCardData(leadCount).statCards;

    let categories, series;
    if (role_id === IdsFromEnv.CRE_ID) {
      ({ barCategories: categories, barSeries: series } = transformOfficeToBarData(roleWiseData, statustyps));
    } else if (role_id === IdsFromEnv.APPLICATION_MANAGER_ID) {
      ({ applicationSeries: series, applicationCategories: categories } = generateStackDataForApplication(roleWiseData));
    } else {
      ({ stackCategories: categories, stackSeries: series } = transformOfficeToStackData(roleWiseData, graphCategory, statustyps));
    }

    const countries = role_id === IdsFromEnv.APPLICATION_MANAGER_ID ? await db.country.findAll({ attributes: ["id", "country_name"] }) : [];

    res.status(200).json({
      message: "Dashboard data fetched successfully",
      status: true,
      categories,
      series,
      statCards: cards,
      latestLeadsCount: latestLeadsCount,
      applicationData: applicationData || null,
      countries,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
