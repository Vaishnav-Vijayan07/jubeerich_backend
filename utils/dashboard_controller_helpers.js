const { QueryTypes, where } = require("sequelize");
const db = require("../models");
const {
  getLeadStatusWiseCountQuery,
  getLeadStatusOfficeWiseCountQuery,
  getLeadStatusWiseCountCreTlQuery,
  getLeadStatusCreTlWiseQuery,
  getLeadStatusWiseCountCreQuery,
  getLeadStatusCreWiseQuery,
  getLeadStatusWiseCountCounselorQuery,
  getLeadStatusCounselorWiseQuery,
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
  try {
    const { type } = filterArgs;

    const cres = await db.adminUsers.findAll({
      attributes: ["name", "id", "role_id"],
      where: {
        [db.Sequelize.Op.or]: [{ role_id: IdsFromEnv.CRE_ID }, { role_id: IdsFromEnv.CRE_TL_ID }],
      },
      raw: true,
    });

    const credids = cres.map((cre) => cre.id);
    const { whereRaw } = getDateRangeCondition(filterArgs, type, role_id, userDecodeId, credids);

    console.log("whereClause", whereRaw);

    const leadWiseQuery = getLeadStatusWiseCountCreTlQuery(whereRaw);
    const leadStatusCreWiseCountQuery = getLeadStatusCreTlWiseQuery(whereRaw);

    const statustyps = await db.statusType.findAll({
      attributes: ["type_name"],
      raw: true,
    });

    const latestLeadsCount = await db.userPrimaryInfo.findAll({
      attributes: ["id", "office_type", "stage", "full_name"],
      where: {
        created_by: {
          [db.Sequelize.Op.in]: [...credids, userDecodeId],
        },
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

const getDataForCre = async (filterArgs, role_id, userDecodeId) => {
  const { type } = filterArgs;
  const { whereRaw } = getDateRangeCondition(filterArgs, type, role_id, userDecodeId);

  console.log("whereClause", whereRaw);

  const leadCreWiseQuery = getLeadStatusWiseCountCreQuery(whereRaw);
  const leadStatusCreWiseCountQuery = getLeadStatusCreWiseQuery(whereRaw);

  try {
    const statustyps = await db.statusType.findAll({
      attributes: ["type_name"],
      raw: true,
    });

    const latestLeadsCount = await db.userPrimaryInfo.findAll({
      attributes: ["id", "office_type", "stage", "full_name"],
      where: {
        [db.Sequelize.Op.or]: [{ created_by: userDecodeId }, { assigned_cre: userDecodeId }],
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
      ],
      limit: 6,
    });

    const leadCount = await db.sequelize.query(leadCreWiseQuery, {
      type: QueryTypes.SELECT,
    });

    const creWiseCount = await db.sequelize.query(leadStatusCreWiseCountQuery, {
      type: QueryTypes.SELECT,
    });

    return { leadCount, roleWiseData: creWiseCount, graphCategory: [], statustyps, latestLeadsCount };
  } catch (error) {
    console.error("Error in getDataForItTeam:", error.message);
    throw new Error("Failed to fetch IT team data");
  }
};
const getDataForCounselor = async (filterArgs, role_id, userDecodeId) => {
  const { type } = filterArgs;
  const { whereRaw } = getDateRangeCondition(filterArgs, type, role_id, userDecodeId);

  console.log("whereClause", whereRaw);

  const leadCounselorWiseQuery = getLeadStatusWiseCountCounselorQuery(whereRaw);
  const leadStatusCounselorWiseCountQuery = getLeadStatusCounselorWiseQuery(whereRaw);

  try {
    const statustyps = await db.statusType.findAll({
      attributes: ["type_name"],
      raw: true,
    });

    const admin = await db.adminUsers.findByPk(userDecodeId, {
      attributes: ["id", "name"],
      include: {
        model: db.country,
        attributes: ["country_name","id"],
        through: { model: db.adminUserCountries, attributes: [] }, // Exclude join table attributes if not needed
      },
    });

    const adminCountries = admin.countries.map((country) => country.get({ plain: true }));

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
        {
          model: db.adminUsers,
          as: "counselors",
          through: {
            model: db.userCounselors,
            attributes: []
          },
          attributes: ["name", "id"],
          where: { id: userDecodeId }  
        }
      ],
      limit: 6,
    });

    const leadCount = await db.sequelize.query(leadCounselorWiseQuery, {
      type: QueryTypes.SELECT,
    });

    const creWiseCount = await db.sequelize.query(leadStatusCounselorWiseCountQuery, {
      type: QueryTypes.SELECT,
    });

    return { leadCount, roleWiseData: creWiseCount, graphCategory: adminCountries, statustyps, latestLeadsCount };
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

const transformOfficeToStackData = (roleWiseData, graphCategory, statustyps) => {
  console.log("roleWiseData", roleWiseData);
  console.log("graphCategory", graphCategory);
  console.log("statustyps", statustyps);

  // Map categories from graphCategory
  const categories = graphCategory.map((office) => {
    const nameKey = Object.keys(office).find((key) => key.toLowerCase().includes("name"));
    return nameKey ? office[nameKey] : null;
  });

  // Create a map to track series data for each status type
  const seriesMap = new Map(statustyps.map((type) => [type.type_name, Array(categories.length).fill(0)]));

  // Populate the series data based on roleWiseData
  roleWiseData.forEach((item) => {
    const name = item.name;
    const typeName = item.type_name;
    const count = parseInt(item.count, 10);

    // Find the index of the admin name in categories
    const categoryIndex = categories.indexOf(name);
    if (categoryIndex !== -1 && seriesMap.has(typeName)) {
      seriesMap.get(typeName)[categoryIndex] += count;
    }
  });

  // Format series data
  const series = Array.from(seriesMap.entries()).map(([name, data]) => ({
    name: name.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, (letter) => letter.toUpperCase()),
    data,
  }));

  return { stackCategories: categories, stackSeries: series };
};

const transformOfficeToBarData = (roleWiseData, statustyps) => {
  console.log("roleWiseData", statustyps);
  console.log("roleWiseData", roleWiseData);

  // Create a map for roleWiseData counts for easy lookup
  const roleWiseDataMap = roleWiseData.reduce((map, item) => {
    map[item.type_name] = parseInt(item.count, 10) || 0;
    return map;
  }, {});
  // Build the series data using the categories
  const seriesData = statustyps.map((category) => roleWiseDataMap[category.type_name] || 0);

  const series = [
    {
      name: "Count",
      data: seriesData,
    },
  ];

  const categories = statustyps.map(
    (category) =>
      category.type_name
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
        .join(" ") // Join words with a space
  );

  console.log("categories", categories);
  console.log("series", series);

  return { barCategories: categories, barSeries: roleWiseData.length > 0 ? series : [] };
};

module.exports = {
  getDataForItTeam,
  processCardData,
  transformOfficeToStackData,
  getDataForCreTl,
  getDataForCre,
  transformOfficeToBarData,
  getDataForCounselor,
};
