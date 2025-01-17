const IdsFromEnv = require("../constants/ids");

const getLeadStatusWiseCountQuery = (where) => {
  return ` WITH RankedStatuses AS (
    SELECT 
        uc.user_primary_info_id,
        uc.country_id,
        upi.created_at,
        s.status_name,
        st.type_name,
        st.priority,
        ROW_NUMBER() OVER (PARTITION BY uc.user_primary_info_id ORDER BY st.priority DESC) as rn
    FROM 
        user_countries uc
    LEFT JOIN user_primary_info upi ON uc.user_primary_info_id = upi.id
    LEFT JOIN status s ON uc.status_id = s.id
    LEFT JOIN status_type st ON s.type_id = st.id
)
SELECT 
    type_name,
    COUNT(*) as count,
    SUM(COUNT(*)) OVER() as total_lead_count
FROM 
    RankedStatuses
${where}
GROUP BY 
    type_name;
`;
};

const getLeadStatusOfficeWiseCountQuery = (where) => {
  return `
WITH RankedStatuses AS (
    SELECT 
        uc.user_primary_info_id,
        uc.country_id,
        s.status_name,
        st.type_name,
        st.priority,
        upi.office_type,
        upi.created_at,
        ot.office_type_name,
        ROW_NUMBER() OVER (PARTITION BY uc.user_primary_info_id ORDER BY st.priority DESC) as rn
    FROM 
        user_countries uc
    LEFT JOIN user_primary_info upi ON uc.user_primary_info_id = upi.id
    LEFT JOIN office_types ot ON upi.office_type = ot.id
    LEFT JOIN status s ON uc.status_id = s.id
    LEFT JOIN status_type st ON s.type_id = st.id
)
SELECT 
    office_type_name as name,
    type_name,
    COUNT(*) as count
FROM 
    RankedStatuses
${where}
GROUP BY 
    office_type_name, type_name
ORDER BY 
    office_type_name, type_name;`;
};

const getLeadStatusWiseCountCreTlQuery = (where) => {
  return ` WITH RankedStatuses AS (
      SELECT 
          uc.user_primary_info_id,
          uc.country_id,
          upi.created_at,
          upi.created_by,
          upi.assigned_cre_tl,
          upi.assigned_cre,
          s.status_name,
          st.type_name,
          st.priority,
          ROW_NUMBER() OVER (PARTITION BY uc.user_primary_info_id ORDER BY st.priority DESC) as rn
      FROM 
          user_countries uc
      LEFT JOIN user_primary_info upi ON uc.user_primary_info_id = upi.id
      LEFT JOIN status s ON uc.status_id = s.id
      LEFT JOIN status_type st ON s.type_id = st.id
  )
  SELECT 
      type_name,
      COUNT(*) as count,
      SUM(COUNT(*)) OVER() as total_lead_count
  FROM 
      RankedStatuses
  ${where}
  GROUP BY 
      type_name;
  `;
};

const getLeadStatusCreTlWiseQuery = (where) => {
  return `
  WITH RankedStatuses AS (
      SELECT 
          uc.user_primary_info_id,
          uc.country_id,
          s.status_name,
          st.type_name,
          st.priority,
          upi.created_at,
          upi.assigned_cre,
          upi.assigned_cre_tl,
          upi.created_by,
          CASE 
            WHEN upi.assigned_cre_tl IS NOT NULL THEN au1.name
            WHEN upi.assigned_cre IS NOT NULL THEN au3.name
            ELSE au2.name
        END as admin_name,
        ROW_NUMBER() OVER (PARTITION BY uc.user_primary_info_id ORDER BY st.priority DESC) as rn
      FROM 
          user_countries uc
      LEFT JOIN user_primary_info upi ON uc.user_primary_info_id = upi.id
      LEFT JOIN admin_users au1 ON upi.assigned_cre_tl = au1.id
    LEFT JOIN admin_users au2 ON upi.created_by = au2.id
    LEFT JOIN admin_users au3 ON upi.assigned_cre = au3.id
      LEFT JOIN status s ON uc.status_id = s.id
      LEFT JOIN status_type st ON s.type_id = st.id
  )
  SELECT 
    admin_name as name,
    type_name,
    COUNT(*) as count
  FROM 
      RankedStatuses
  ${where}
 GROUP BY 
    admin_name,
    type_name
ORDER BY 
    admin_name,
    type_name;`;
};
const getLeadStatusWiseCountCreQuery = (where) => {
  return ` WITH RankedStatuses AS (
      SELECT 
          uc.user_primary_info_id,
          uc.country_id,
          upi.created_at,
          upi.created_by,
          upi.assigned_cre,
          s.status_name,
          st.type_name,
          st.priority,
          ROW_NUMBER() OVER (PARTITION BY uc.user_primary_info_id ORDER BY st.priority DESC) as rn
      FROM 
          user_countries uc
      LEFT JOIN user_primary_info upi ON uc.user_primary_info_id = upi.id
      LEFT JOIN status s ON uc.status_id = s.id
      LEFT JOIN status_type st ON s.type_id = st.id
  )
  SELECT 
      type_name,
      COUNT(*) as count,
      SUM(COUNT(*)) OVER() as total_lead_count
  FROM 
      RankedStatuses
  ${where}
  GROUP BY 
      type_name;
  `;
};

const getLeadStatusCreWiseQuery = (where) => {
  return `
  WITH RankedStatuses AS (
      SELECT 
          uc.user_primary_info_id,
          uc.country_id,
          s.status_name,
          st.type_name,
          st.priority,
          upi.assigned_cre,
          upi.created_at,
          upi.created_by,
         COALESCE(au1.name, au2.name) as admin_name,
          ROW_NUMBER() OVER (PARTITION BY uc.user_primary_info_id ORDER BY st.priority DESC) as rn
      FROM 
          user_countries uc
      LEFT JOIN user_primary_info upi ON uc.user_primary_info_id = upi.id
    LEFT JOIN admin_users au1 ON upi.assigned_cre = au1.id
    LEFT JOIN admin_users au2 ON upi.created_by = au2.id
      LEFT JOIN status s ON uc.status_id = s.id
      LEFT JOIN status_type st ON s.type_id = st.id
  )
  SELECT 
       admin_name as name,
      type_name,
      COUNT(*) as count
  FROM 
      RankedStatuses
  ${where}
  GROUP BY 
      admin_name, type_name
  ORDER BY 
      admin_name, type_name;`;
};

const getLeadStatusWiseCountCounselorQuery = (where) => {
  return ` WITH RankedStatuses AS (
    SELECT 
        uc.user_primary_info_id,
        uc.country_id,
        ucs.counselor_id,
        upi.created_at,
        upi.created_by,
        s.status_name,
        st.type_name,
        st.priority,
        ROW_NUMBER() OVER (PARTITION BY uc.user_primary_info_id ORDER BY st.priority DESC) as rn
    FROM 
        user_countries uc
    LEFT JOIN user_primary_info upi ON uc.user_primary_info_id = upi.id
    LEFT JOIN user_counselors ucs ON upi.id = ucs.user_id
    LEFT JOIN status s ON uc.status_id = s.id
    LEFT JOIN status_type st ON s.type_id = st.id
)
SELECT 
    type_name,
    COUNT(*) as count,
    SUM(COUNT(*)) OVER() as total_lead_count
FROM 
    RankedStatuses
${where}
GROUP BY 
    type_name;
  `;
};

const getLeadStatusCounselorWiseQuery = (where) => {
  return `
    WITH RankedStatuses AS (
        SELECT 
            uc.user_primary_info_id,
            uc.country_id,
            c.country_name as country_name,
            ucs.counselor_id,
            s.status_name,
            st.type_name,
            st.priority,
            upi.created_at,
            upi.created_by,
            au.name as admin_name,
            ROW_NUMBER() OVER (PARTITION BY uc.user_primary_info_id ORDER BY st.priority DESC) as rn
        FROM 
            user_countries uc
        LEFT JOIN countries c ON uc.country_id = c.id  -- Join with countries table
        LEFT JOIN user_primary_info upi ON uc.user_primary_info_id = upi.id
        LEFT JOIN user_counselors ucs ON upi.id = ucs.user_id
        LEFT JOIN admin_users au ON upi.created_by = au.id
        LEFT JOIN status s ON uc.status_id = s.id
        LEFT JOIN status_type st ON s.type_id = st.id
    )
    SELECT 
        country_name as name,  -- Change grouping to country_name
        type_name,
        COUNT(*) as count
    FROM 
        RankedStatuses
    ${where}
    GROUP BY 
        country_name, type_name  -- Change grouping to country_name
    ORDER BY 
        country_name, type_name;`;
};

const getLeadStatusWiseCountCountryMangerQuery = (where) => {
  return ` WITH RankedStatuses AS (
      SELECT 
          uc.user_primary_info_id,
          uc.country_id,
          ucs.counselor_id,
          upi.created_at,
          upi.created_by,
          s.status_name,
          st.type_name,
          st.priority,
          ROW_NUMBER() OVER (PARTITION BY uc.user_primary_info_id ORDER BY st.priority DESC) as rn
      FROM 
          user_countries uc
      LEFT JOIN user_primary_info upi ON uc.user_primary_info_id = upi.id
      LEFT JOIN user_counselors ucs ON upi.id = ucs.user_id
      LEFT JOIN status s ON uc.status_id = s.id
      LEFT JOIN status_type st ON s.type_id = st.id
  )
  SELECT 
      type_name,
      COUNT(*) as count,
      SUM(COUNT(*)) OVER() as total_lead_count
  FROM 
      RankedStatuses
  ${where}
  GROUP BY 
      type_name;
    `;
};

const getLeadStatusCountryManagerWiseQuery = (where) => {
  return `
      WITH RankedStatuses AS (
          SELECT 
              uc.user_primary_info_id,
              uc.country_id,
              c.country_name as country_name,
              ucs.counselor_id,
              s.status_name,
              st.type_name,
              st.priority,
              upi.created_at,
              upi.created_by,
              au.name as admin_name,
              ROW_NUMBER() OVER (PARTITION BY uc.user_primary_info_id ORDER BY st.priority DESC) as rn
          FROM 
              user_countries uc
          LEFT JOIN countries c ON uc.country_id = c.id  -- Join with countries table
          LEFT JOIN user_primary_info upi ON uc.user_primary_info_id = upi.id
          LEFT JOIN user_counselors ucs ON upi.id = ucs.user_id
          LEFT JOIN admin_users au ON upi.created_by = au.id
          LEFT JOIN status s ON uc.status_id = s.id
          LEFT JOIN status_type st ON s.type_id = st.id
      )
      SELECT 
          country_name as name,  -- Change grouping to country_name
          type_name,
          COUNT(*) as count
      FROM 
          RankedStatuses
      ${where}
      GROUP BY 
          country_name, type_name  -- Change grouping to country_name
      ORDER BY 
          country_name, type_name;`;
};

const getCountriesByType = (userId, role_id) => {
  if (role_id == IdsFromEnv.APPLICATION_MANAGER_ID) {
    return `
      SELECT id,country_name FROM countries;
      `;
  } else {
    return `
          SELECT c.country_name,c.id FROM admin_user_countries auc JOIN countries c ON auc.country_id = c.id JOIN admin_users ad ON auc.admin_user_id = ad.id WHERE ad.id = ${userId};
          `;
  }
};

module.exports = {
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
  getCountriesByType,
};
