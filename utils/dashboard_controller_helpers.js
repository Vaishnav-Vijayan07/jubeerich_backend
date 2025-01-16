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
  getLeadStatusWiseCountCountryMangerQuery,
  getLeadStatusCountryManagerWiseQuery,
} = require("../raw/queries");
const { getDateRangeCondition } = require("./date_helpers");
const IdsFromEnv = require("../constants/ids");
const {
  getCheckWiseData,
  getMemberWiseChecks,
  getCountryWisePieData,
  getApplications,
  getCountryWiseDataForApplicationTeam,
} = require("../raw/application_queries");
const { generatePieData, generatePieForApplication } = require("./dashboard_data_transform_helpers");

const getDataForItTeam = async (filterArgs, role_id, userDecodeId) => {
  const { type } = filterArgs;
  const { whereRaw } = getDateRangeCondition(filterArgs, type, role_id, userDecodeId);

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
      attributes: ["id", "office_type", "stage", "full_name", "created_at"],
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
      order: [["created_at", "DESC"]],
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

    const leadWiseQuery = getLeadStatusWiseCountCreTlQuery(whereRaw);
    const leadStatusCreWiseCountQuery = getLeadStatusCreTlWiseQuery(whereRaw);

    const statustyps = await db.statusType.findAll({
      attributes: ["type_name"],
      raw: true,
    });

    const latestLeadsCount = await db.userPrimaryInfo.findAll({
      attributes: ["id", "office_type", "stage", "full_name", "created_at"],
      where: {
        [db.Sequelize.Op.or]: [
          {
            created_by: {
              [db.Sequelize.Op.in]: [...credids, userDecodeId],
            },
          },
          {
            assigned_cre_tl: userDecodeId,
          },
        ],
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
      order: [["created_at", "DESC"]],
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

  const leadCreWiseQuery = getLeadStatusWiseCountCreQuery(whereRaw);
  const leadStatusCreWiseCountQuery = getLeadStatusCreWiseQuery(whereRaw);

  try {
    const statustyps = await db.statusType.findAll({
      attributes: ["type_name"],
      raw: true,
    });

    const latestLeadsCount = await db.userPrimaryInfo.findAll({
      attributes: ["id", "office_type", "stage", "full_name", "created_at"],
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
      order: [["created_at", "DESC"]],
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
        attributes: ["country_name", "id"],
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
            attributes: [],
          },
          attributes: ["name", "id"],
          where: { id: userDecodeId },
        },
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

const getDataForCountryManager = async (filterArgs, role_id, userDecodeId) => {
  const { type } = filterArgs;
  const { whereRaw } = getDateRangeCondition(filterArgs, type, role_id, userDecodeId);

  const leadCountryMangerWiseQuery = getLeadStatusWiseCountCountryMangerQuery(whereRaw);
  const leadStatusCountryMangerWiseCountQuery = getLeadStatusCountryManagerWiseQuery(whereRaw);

  try {
    const statustyps = await db.statusType.findAll({
      attributes: ["type_name"],
      raw: true,
    });

    const admin = await db.adminUsers.findByPk(userDecodeId, {
      attributes: ["id", "name"],
      include: {
        model: db.country,
        attributes: ["country_name", "id"],
        through: { model: db.adminUserCountries, attributes: [] }, // Exclude join table attributes if not needed
      },
    });

    const adminCountries = admin.countries.map((country) => country.get({ plain: true }));
    const country_id = adminCountries.map((country) => country.id);

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
            attributes: [],
          },
          attributes: ["name", "id"],
          where: { id: userDecodeId },
        },
      ],
      limit: 6,
    });

    const applicationCounts = await db.sequelize.query(
      `SELECT 
          COALESCE(SUM(CASE WHEN kyc_status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
          COALESCE(SUM(CASE WHEN kyc_status = 'approved' THEN 1 ELSE 0 END), 0) as approved
       FROM application_details ad
       INNER JOIN study_preference_details spd 
           ON ad.study_prefernce_id = spd.id
       INNER JOIN study_preferences sp 
           ON spd."studyPreferenceId" = sp.id
       WHERE 
           ad.is_rejected_kyc = false 
           AND ad.proceed_to_application_manager = false 
           AND ad.counsellor_id = :counsellorId
           AND sp."countryId" IN :countryId`,
      {
        replacements: {
          counsellorId: userDecodeId,
          countryId: [country_id],
        },
        type: db.Sequelize.QueryTypes.SELECT,
      }
    );

    const leadCount = await db.sequelize.query(leadCountryMangerWiseQuery, {
      type: QueryTypes.SELECT,
    });

    const creWiseCount = await db.sequelize.query(leadStatusCountryMangerWiseCountQuery, {
      type: QueryTypes.SELECT,
    });

    const pieData = generatePieData(applicationCounts[0]);

    return {
      leadCount,
      roleWiseData: creWiseCount,
      graphCategory: adminCountries,
      statustyps,
      latestLeadsCount,
      applicationData: pieData,
    };
  } catch (error) {
    console.error("Error in getDataForItTeam:", error.message);
    throw new Error("Failed to fetch IT team data");
  }
};

const getDataForApplicationManger = async (filterArgs, role_id, userDecodeId) => {
  const { type } = filterArgs;
  const { whereRaw } = getDateRangeCondition(filterArgs, type, role_id, userDecodeId);

  const checkWiseData = getCheckWiseData(whereRaw);
  const checkWiseDataMembers = getMemberWiseChecks(whereRaw);
  const officeWiseChecksData = getCountryWisePieData(whereRaw);

  const checkData = await db.sequelize.query(checkWiseData, {
    type: QueryTypes.SELECT,
  });

  const checkDataForMembers = await db.sequelize.query(checkWiseDataMembers, {
    type: QueryTypes.SELECT,
  });

  const officeChecksData = await db.sequelize.query(officeWiseChecksData, {
    type: QueryTypes.SELECT,
  });

  const { applications } = await getApplications(userDecodeId);

  const pieData = generatePieForApplication(officeChecksData);

  return {
    leadCount: checkData,
    roleWiseData: checkDataForMembers,
    graphCategory: [],
    statustyps: [],
    latestLeadsCount: applications,
    applicationData: pieData,
  };
};

const getDataForApplicationTeam = async (filterArgs, role_id, userDecodeId) => {
  const { type } = filterArgs;
  const { whereRaw } = getDateRangeCondition(filterArgs, type, role_id, userDecodeId);

  const checkWiseData = getCheckWiseData(whereRaw);
  const checkWiseDataCountries = getCountryWiseDataForApplicationTeam(whereRaw);

  const checkData = await db.sequelize.query(checkWiseData, {
    type: QueryTypes.SELECT,
  });

  const checkDataForCountries = await db.sequelize.query(checkWiseDataCountries, {
    type: QueryTypes.SELECT,
  });

  const { applications } = await getApplications(userDecodeId);

  return {
    leadCount: checkData,
    roleWiseData: checkDataForCountries,
    graphCategory: [],
    statustyps: [],
    latestLeadsCount: applications,
    applicationData: [],
  };
};

module.exports = {
  getDataForItTeam,
  getDataForCreTl,
  getDataForCre,
  getDataForCounselor,
  getDataForCountryManager,
  getDataForApplicationManger,
  getDataForApplicationTeam,
};
