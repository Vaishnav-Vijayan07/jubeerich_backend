const IdsFromEnv = {
  // Office IDs
  CORPORATE_OFFICE_ID: parseInt(process.env.CORPORATE_OFFICE_ID, 10),
  FRANCHISE_OFFICE_ID: parseInt(process.env.FRANCHISE_OFFICE_ID, 10),
  BRANCH_OFFICE_ID: parseInt(process.env.BRANCH_OFFICE_ID, 10),

  // Role IDs
  COUNSELLOR_ROLE_ID: parseInt(process.env.COUNSELLOR_ROLE_ID, 10),
  IT_TEAM_ID: parseInt(process.env.IT_TEAM_ID, 10),
  REGIONAL_MANAGER_ID: parseInt(process.env.REGIONAL_MANAGER_ID, 10),
  CRE_RECEPTION_ID: parseInt(process.env.CRE_RECEPTION_ID, 10),
  CRE_TL_ID: parseInt(process.env.CRE_TL_ID, 10),
  CRE_ID: parseInt(process.env.CRE_ID, 10),
  FOLLOWUP_ID: parseInt(process.env.FOLLOWUP_ID, 10),
  FRANCHISE_MANAGER_ID: parseInt(process.env.FRANCHISE_MANAGER_ID, 10),
  FRANCHISE_COUNSELLOR_ID: parseInt(process.env.FRANCHISE_COUNSELLOR_ID, 10),
  COUNSELLOR_TL_ID: parseInt(process.env.COUNSELLOR_TL_ID, 10),
  BRANCH_COUNSELLOR_ID: parseInt(process.env.BRANCH_COUNSELLOR_ID, 10),
  COUNTRY_MANAGER_ID: parseInt(process.env.COUNTRY_MANAGER_ID, 10),
  APPLICATION_MANAGER_ID: parseInt(process.env.APPLICATION_MANAGER_ID, 10),
  APPLICATION_TEAM_ID: parseInt(process.env.APPLICATION_TEAM_ID, 10),
  NEW_LEAD_STATUS_ID: parseInt(process.env.NEW_LEAD_STATUS_ID, 10),
};

module.exports = IdsFromEnv;
