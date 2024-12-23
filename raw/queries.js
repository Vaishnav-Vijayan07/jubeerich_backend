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

module.exports = {
  getLeadStatusWiseCountQuery,
  getLeadStatusOfficeWiseCountQuery,
};
