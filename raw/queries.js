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
    office_type_name,
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
    admin_name,
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
          au.name,
          ROW_NUMBER() OVER (PARTITION BY uc.user_primary_info_id ORDER BY st.priority DESC) as rn
      FROM 
          user_countries uc
      LEFT JOIN user_primary_info upi ON uc.user_primary_info_id = upi.id
      LEFT JOIN admin_users au ON upi.assigned_cre = au.id
      LEFT JOIN status s ON uc.status_id = s.id
      LEFT JOIN status_type st ON s.type_id = st.id
  )
  SELECT 
      name,
      type_name,
      COUNT(*) as count
  FROM 
      RankedStatuses
  ${where}
  GROUP BY 
      name, type_name
  ORDER BY 
      name, type_name;`;
};

module.exports = {
  getLeadStatusWiseCountQuery,
  getLeadStatusOfficeWiseCountQuery,
  getLeadStatusWiseCountCreTlQuery,
  getLeadStatusCreTlWiseQuery,
  getLeadStatusWiseCountCreQuery,
  getLeadStatusCreWiseQuery,
};
