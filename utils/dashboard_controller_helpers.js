const { QueryTypes } = require("sequelize");
const db = require("../models");
const {
  getLeadStatusWiseCountQuery,
  getLeadStatusOfficeWiseCountQuery,
  getLeadStatusWiseCountCreTlQuery,
  getLeadStatusCreWiseQuery,
} = require("../raw/queries");
const { getDateRangeCondition } = require("./date_helpers");
const IdsFromEnv = require("../constants/ids");

const getDataForItTeam = async (filterArgs, role_id, userDecodeId) => {
  const { type } = filterArgs;
  const { whereRaw } = getDateRangeCondition(filterArgs, type, role_id, userDecodeId);

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

    return { leadCount, roleWiseData: officeWiseCount, graphCategory: officeTypes, statustyps, latestLeadsCount };
  } catch (error) {
    console.error("Error in getDataForItTeam:", error.message);
    throw new Error("Failed to fetch IT team data");
  }
};

const getDataForCreTl = async (filterArgs, role_id, userDecodeId) => {
  const { type } = filterArgs;
  const { whereRaw } = getDateRangeCondition(filterArgs, type, role_id, userDecodeId);

  console.log("whereClause", whereRaw);

  const leadWiseQuery = getLeadStatusWiseCountCreTlQuery(whereRaw);
  const leadStatusCreWiseCountQuery = getLeadStatusCreWiseQuery(whereRaw);

  try {
    const cres = await db.adminUsers.findAll({
      attributes: ["name","id"],
      where: {
        role_id: IdsFromEnv.CRE_ID,
      },
      raw: true,
    });

    const credids = cres.map((cre) => cre.id);

    const statustyps = await db.statusType.findAll({
      attributes: ["type_name"],
      raw: true,
    });


    const latestLeadsCount = await db.userPrimaryInfo.findAll({
      attributes: ["id", "office_type", "stage", "full_name"],
      where: {
        created_by:{
          [db.Sequelize.Op.in]: [...credids,userDecodeId],
        }
      },
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
        {
          model: db.adminUsers,
          as: "cre_name",
          attributes: ["name", "role_id"],
        },
      ],
      limit: 6,
    });

    const leadCount = await db.sequelize.query(leadWiseQuery, {
      type: QueryTypes.SELECT,
    });

    const creWiseCount = await db.sequelize.query(leadStatusCreWiseCountQuery, {
      type: QueryTypes.SELECT,
    });

    return { leadCount, roleWiseData: creWiseCount, graphCategory: cres, statustyps, latestLeadsCount };
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

const transformOfficeWiseCountToChartData = (roleWiseData, graphCategory, statustyps) => {
  console.log("roleWiseData", roleWiseData);
  console.log("graphCategory", graphCategory);
  console.log("statustyps", statustyps);

  const seriesMap = new Map(statustyps.map((type) => [type.type_name, []]));

  roleWiseData.forEach((item) => {
    seriesMap.get(item.type_name).push(parseInt(item.count, 10));
  });

  const categories = graphCategory.map((office) => {
    const nameKey = Object.keys(office).find((key) => key.toLowerCase().includes("name"));
    return nameKey ? office[nameKey] : null;
  });

  const series = Array.from(seriesMap.entries()).map(([name, data]) => ({
    name: name.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase()),
    data,
  }));

  console.log("office==>", roleWiseData);

  return { categories, series: roleWiseData.length > 0 ? series : [] };
};

module.exports = {
  getDataForItTeam,
  processCardData,
  transformOfficeWiseCountToChartData,
  getDataForCreTl,
};
