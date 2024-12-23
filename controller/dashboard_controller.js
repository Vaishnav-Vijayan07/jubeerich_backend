const { QueryTypes } = require("sequelize");
const IdsFromEnv = require("../constants/ids");
const db = require("../models");
const { getLeadStatusOfficeWiseCountQuery, getLeadStatusWiseCountQuery } = require("../raw/queries");
const { formatToDbDate, getWeeklyDateRange, getDateRangeCondition } = require("../utils/date_helpers");

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

const getDataForItTeam = async (filterArgs) => {
  const { type } = filterArgs;
  const { whereRaw} = getDateRangeCondition(filterArgs, type);

  console.log("whereClause", whereRaw);

  const leadWiseQuery = getLeadStatusWiseCountQuery(whereRaw);
  const leadStatusOfficeWiseCountQuery = getLeadStatusOfficeWiseCountQuery(whereRaw);

  try {
    const officeTypes = await db.officeType.findAll({
      attributes: ["office_type_name"],
      raw: true,
    });

    const statustyps = await db.statusType.findAll({
      attributes: ["type_name"],
      raw: true,
    });

    const latestLeadsCount = await db.userPrimaryInfo.findAll({
      attributes: ["id", "office_type", "stage", "full_name"],
      include: [
        {
          model: db.status,
          as: "preferredStatus",
          attributes: ["status_name"],
          through: { attributes: [] },
        },
        {
          model: db.country,
          as: "preferredCountries",
          attributes: ["country_name"],
          through: { attributes: [] },
        },
        {
          model: db.officeType,
          as: "office_type_name",
          attributes: ["office_type_name"],
        },
      ],
      limit: 6,
    });

    const leadCount = await db.sequelize.query(leadWiseQuery, {
      type: QueryTypes.SELECT,
    });

    const officeWiseCount = await db.sequelize.query(leadStatusOfficeWiseCountQuery, {
      type: QueryTypes.SELECT,
    });

    return { leadCount, officeWiseCount, officeTypes, statustyps, latestLeadsCount };
  } catch (error) {
    console.error("Error in getDataForItTeam:", error.message);
    throw new Error("Failed to fetch IT team data");
  }
};

const processCardData = (counts) => {
  const totalLeads = counts[0]?.total_lead_count || 0;
  // Define the base structure of the cards
  const defaultCards = [
    { id: 1, title: "total leads", stats: totalLeads, icon: "fe-users", bgColor: "#5bc0de" }, // Blue for general data
    { id: 2, title: "spam leads", stats: "0", icon: "fe-alert-triangle", bgColor: "#f0ad4e" }, // Orange for warnings
    { id: 3, title: "closed leads", stats: "0", icon: "fe-check-circle", bgColor: "#5cb85c" }, // Green for success
    { id: 4, title: "prospective leads", stats: "0", icon: "fe-briefcase", bgColor: "#5bc0de" }, // Green for success
    { id: 5, title: "failed Leads", stats: "0", icon: "fe-x-circle", bgColor: "#d9534f" }, // Red for errors
  ];

  const metaData = {
    spam_leads: {
      id: 2,
      icon: "fe-alert-triangle",
      bgColor: "#f0ad4e",
    },
    closed_leads: {
      id: 3,
      icon: "fe-check-circle",
      bgColor: "#5cb85c",
    },
    prospective_leads: {
      id: 4,
      icon: "fe-check-circle",
      bgColor: "#5cb85c",
    },
    failed_leads: {
      id: 5,
      icon: "fe-x-circle",
      bgColor: "#d9534f",
    },
  };

  let statCards = [...defaultCards];

  counts.forEach((count) => {
    const card = metaData[count.type_name];
    if (card) {
      statCards[card.id - 1].stats = count.count;
    }
  });

  return { statCards };
};

const transformOfficeWiseCountToChartData = (officeWiseCount, officeTypes, statustyps) => {
  const seriesMap = new Map(statustyps.map((type) => [type.type_name, []]));

  officeWiseCount.forEach((item) => {
    seriesMap.get(item.type_name).push(parseInt(item.count, 10));
  });

  const categories = officeTypes.map((office) => office.office_type_name);
  const series = Array.from(seriesMap.entries()).map(([name, data]) => ({
    name: name.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase()),
    data,
  }));


  console.log("office==>",officeWiseCount)

  return { categories, series : officeWiseCount.length > 0 ? series : [] };
};
