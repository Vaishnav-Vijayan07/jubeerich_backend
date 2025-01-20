const db = require("../models");

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
            WHEN NOT ((ec.quality_check->>'clarity')::boolean AND (ec.quality_check->>'scanning')::boolean AND (ec.quality_check->>'formatting')::boolean)::boolean THEN 'quality_check'
            WHEN NOT ec.immigration_check THEN 'immigration_check'
            WHEN NOT ec.application_fee_check THEN 'application_fee_check'
        END AS first_false_check,
        COUNT(*) AS application_count
    FROM 
        eligibility_checks ec
    JOIN 
        application_details a ON ec.application_id = a.id
    JOIN 
        study_preference_details spd ON a.study_prefernce_id = spd.id
    JOIN 
        study_preferences sp ON spd."studyPreferenceId" = sp.id
    JOIN 
        countries c ON sp."countryId" = c.id
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
            WHEN NOT ((ec.quality_check->>'clarity')::boolean AND (ec.quality_check->>'scanning')::boolean AND (ec.quality_check->>'formatting')::boolean)::boolean THEN 'quality_check'
            WHEN NOT ec.immigration_check THEN 'immigration_check'
            WHEN NOT ec.application_fee_check THEN 'application_fee_check'
        END AS check_status
    FROM 
        eligibility_checks ec
    JOIN 
        application_details a ON ec.application_id = a.id
    JOIN 
        study_preference_details spd ON a.study_prefernce_id = spd.id
    JOIN 
        study_preferences sp ON spd."studyPreferenceId" = sp.id
    JOIN 
        countries c ON sp."countryId" = c.id
    ${where}    
  )
SELECT 
    au.name AS "data",
    json_build_object(
        'availability_check', COALESCE(SUM(CASE WHEN fc.check_status = 'availability_check' THEN 1 ELSE 0 END), 0),
        'campus_check', COALESCE(SUM(CASE WHEN fc.check_status = 'campus_check' THEN 1 ELSE 0 END), 0),
        'entry_requirement_check', COALESCE(SUM(CASE WHEN fc.check_status = 'entry_requirement_check' THEN 1 ELSE 0 END), 0),
        'quantity_check', COALESCE(SUM(CASE WHEN fc.check_status = 'quantity_check' THEN 1 ELSE 0 END), 0),
        'quality_check', COALESCE(SUM(CASE WHEN fc.check_status = 'quality_check'  THEN 1 ELSE 0 END), 0),
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

const getCountryWisePieData = (where) => {
  console.log("WHEREINSIDE", where);

  return `
   SELECT 
    ot.office_type_name,
    COALESCE(app_counts.application_count, 0) AS application_count
FROM 
    office_types ot
LEFT JOIN (
    SELECT 
        upi.office_type AS office_type_id,
        COUNT(a.id) AS application_count
    FROM 
        application_details a
    JOIN 
        study_preference_details spd ON a.study_prefernce_id = spd.id
    JOIN 
        study_preferences sp ON spd."studyPreferenceId" = sp.id
    JOIN 
        countries c ON sp."countryId" = c.id    
    JOIN 
        user_primary_info upi ON sp."userPrimaryInfoId" = upi.id
    ${where}    
    GROUP BY 
        upi.office_type
) app_counts ON ot.id = app_counts.office_type_id
ORDER BY 
    ot.office_type_name; `;
};

const getCountryWiseDataForApplicationTeam = (where) => {
  return `
WITH failed_checks AS (
    SELECT 
        c.country_name,
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
    JOIN 
        study_preference_details spd ON a.study_prefernce_id = spd.id
    JOIN 
        study_preferences sp ON spd."studyPreferenceId" = sp.id
    JOIN 
        countries c ON sp."countryId" = c.id
    ${where}    
)
SELECT 
    c.country_name AS "data",
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
    countries c ON fc.country_name = c.country_name
GROUP BY 
    c.country_name
ORDER BY 
    c.country_name;

  `;
};

const getApplications = async (userId) => {
  try {
    const applicationData = await db.application.findAll({
      where: {
        [db.Sequelize.Op.and]: [{ proceed_to_application_manager: true }, { assigned_user: userId }],
      },

      include: [
        {
          model: db.studyPreferenceDetails,
          as: "studyPreferenceDetails",
          attributes: ["id"],
          required: true, // Set this association as required
          include: [
            {
              model: db.studyPreference,
              as: "studyPreference",
              required: true, // Set this association as required
              include: [
                {
                  model: db.country,
                  as: "country",
                  attributes: ["country_name"],
                  required: true, // Set this association as required
                },
                {
                  model: db.userPrimaryInfo,
                  as: "userPrimaryInfo",
                  attributes: ["full_name"],
                  required: true, // Set this association as required
                  include: [
                    {
                      model: db.officeType,
                      as: "office_type_name",
                      attributes: ["office_type_name"],
                      required: true, // Set this association as required
                    },
                  ],
                },
              ],
            },
            {
              model: db.course,
              as: "preferred_courses",
              attributes: ["course_name"],
              required: true, // Set this association as required
            },
            {
              model: db.campus,
              as: "preferred_campus",
              attributes: ["campus_name"],
              required: true, // Set this association as required
            },
            {
              model: db.university,
              as: "preferred_university",
              attributes: ["university_name", "id"],
              required: true, // Set this association as required
            },
          ],
        },
      ],
      attributes: ["id", "kyc_status", "application_status", "offer_letter", "is_application_checks_passed", "comments", "reference_id"],
    });

    return {
      applications: applicationData.length == 0 ? [] : applicationData,
    };
  } catch (error) {
    console.log("Error in getting latest data for application team", error);
    throw new Error("Error in getting latest data for application team");
  }
};

module.exports = {
  getCheckWiseData,
  getMemberWiseChecks,
  getCountryWisePieData,
  getApplications,
  getCountryWiseDataForApplicationTeam,
};
