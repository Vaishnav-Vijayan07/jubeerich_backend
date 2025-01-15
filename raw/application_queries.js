const getCheckWiseData = (where) => {
  return `
  WITH all_checks AS (
    SELECT unnest(ARRAY[
        'availability_check',
        'campus_check',
        'entry_requirement_check',
        'quantity_check',
        'quality_check',
        'immigration_check',
        'application_fee_check'
    ]) AS check_name
),
failed_checks AS (
    SELECT 
        CASE 
            WHEN NOT ec.availability_check THEN 'availability_check'
            WHEN NOT ec.campus_check THEN 'campus_check'
            WHEN NOT ec.entry_requirement_check THEN 'entry_requirement_check'
            WHEN NOT ec.quantity_check THEN 'quantity_check'
            WHEN NOT (ec.quality_check->>'clarity')::boolean THEN 'quality_check'
            WHEN NOT ec.immigration_check THEN 'immigration_check'
            WHEN NOT ec.application_fee_check THEN 'application_fee_check'
        END AS first_false_check,
        COUNT(*) AS application_count
    FROM 
        eligibility_checks ec
    JOIN 
        application_details a ON ec.application_id = a.id
    ${where}
    GROUP BY 
        first_false_check
)
SELECT 
    all_checks.check_name AS title,
    COALESCE(failed_checks.application_count, 0) AS stats
FROM 
    all_checks
LEFT JOIN 
    failed_checks ON all_checks.check_name = failed_checks.first_false_check
ORDER BY 
    check_name;

  `;
};

const getMemberWiseChecks = (where) => {
  return `
   WITH failed_checks AS (
    SELECT 
        a.assigned_user,
        CASE 
            WHEN NOT ec.availability_check THEN 'availability_check'
            WHEN NOT ec.campus_check THEN 'campus_check'
            WHEN NOT ec.entry_requirement_check THEN 'entry_requirement_check'
            WHEN NOT ec.quantity_check THEN 'quantity_check'
            WHEN NOT (ec.quality_check->>'clarity')::boolean THEN 'quality_check_clarity'
            WHEN NOT (ec.quality_check->>'scanning')::boolean THEN 'quality_check_scanning'
            WHEN NOT (ec.quality_check->>'formatting')::boolean THEN 'quality_check_formatting'
            WHEN NOT ec.immigration_check THEN 'immigration_check'
            WHEN NOT ec.application_fee_check THEN 'application_fee_check'
        END AS check_status
    FROM 
        eligibility_checks ec
    JOIN 
        application_details a ON ec.application_id = a.id
    ${where}
  )
SELECT 
    au.name AS "user",
    json_build_object(
        'availability_check', COALESCE(SUM(CASE WHEN fc.check_status = 'availability_check' THEN 1 ELSE 0 END), 0),
        'campus_check', COALESCE(SUM(CASE WHEN fc.check_status = 'campus_check' THEN 1 ELSE 0 END), 0),
        'entry_requirement_check', COALESCE(SUM(CASE WHEN fc.check_status = 'entry_requirement_check' THEN 1 ELSE 0 END), 0),
        'quantity_check', COALESCE(SUM(CASE WHEN fc.check_status = 'quantity_check' THEN 1 ELSE 0 END), 0),
        'quality_check_clarity', COALESCE(SUM(CASE WHEN fc.check_status = 'quality_check_clarity' THEN 1 ELSE 0 END), 0),
        'quality_check_scanning', COALESCE(SUM(CASE WHEN fc.check_status = 'quality_check_scanning' THEN 1 ELSE 0 END), 0),
        'quality_check_formatting', COALESCE(SUM(CASE WHEN fc.check_status = 'quality_check_formatting' THEN 1 ELSE 0 END), 0),
        'immigration_check', COALESCE(SUM(CASE WHEN fc.check_status = 'immigration_check' THEN 1 ELSE 0 END), 0),
        'application_fee_check', COALESCE(SUM(CASE WHEN fc.check_status = 'application_fee_check' THEN 1 ELSE 0 END), 0)
    ) AS check_counts
FROM 
    failed_checks fc
JOIN 
    admin_users au ON fc.assigned_user = au.id
GROUP BY 
    au.name
ORDER BY 
    au.name;
  `;
};

module.exports = {
  getCheckWiseData,
  getMemberWiseChecks,
};
