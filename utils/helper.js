const IdsFromEnv = require("../constants/ids");
const stageDatas = require("../constants/stage_data");
const db = require("../models");

const sequelize = db.sequelize;

exports.checkIfEntityExists = async (modelName, id) => {
  const Model = sequelize.models[modelName];
  if (!Model) {
    throw new Error(`Model ${modelName} not found in Sequelize instance.`);
  }

  const entity = await Model.findByPk(id);
  return !!entity; // Returns true if entity found, false otherwise
};

exports.getStageData = (office_type, role_id) => {
  const corporate = Number(process.env.CORPORATE_OFFICE_ID);
  const franchise = Number(process.env.FRANCHISE_OFFICE_ID);
  const branch = Number(process.env.BRANCH_OFFICE_ID);

  const it_team = Number(process.env.IT_TEAM_ID);
  const cre_tl = Number(process.env.CRE_TL_ID);
  const cre = Number(process.env.CRE_ID);
  const counsellor = Number(process.env.COUNSELLOR_ROLE_ID);
  const country_manager = Number(process.env.COUNTRY_MANAGER_ID);

  if (office_type == corporate) {
    if ([it_team, cre_tl, cre].includes(role_id)) {
      return stageDatas.cre;
    }
    if ([counsellor, country_manager].includes(role_id)) {
      return stageDatas.counsellor;
    }
  }

  if (office_type == branch) {
    return stageDatas.regional_manager;
  }

  if (office_type == franchise) {
    return stageDatas.counsellor;
  }

  return stageDatas.unknown;
};

exports.getEnumValue = async (tableName, field) => {
  console.log(tableName, field);

  const query = `
    SELECT enumlabel AS value
    FROM pg_enum
    WHERE enumtypid = (
      SELECT atttypid
      FROM pg_attribute
      WHERE attrelid = '${tableName}'::regclass
        AND attname = '${field}'
    );
  `;
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT });
};

exports.getDeleteCondition = (role_id, info, cre_id) => {
  switch (role_id) {
    case IdsFromEnv.IT_TEAM_ID.toString():
      console.log(info.office_type)
      switch (info.office_type) {
        case Number(IdsFromEnv.CORPORATE_OFFICE_ID):
          console.log("IT_TEAM======>", info.created_by === cre_id && info.assigned_cre === null);
          return info.created_by === cre_id && info.assigned_cre === null;
        case Number(IdsFromEnv.REGION_OFFICE_ID):
          console.log("IT_TEAM - REGION======>", info.created_by === cre_id && info.assigned_counsellor_tl === null && info.branch_id === null);
          return info.created_by === cre_id && info.assigned_counsellor_tl === null && info.branch_id === null;
          case Number(IdsFromEnv.FRANCHISE_OFFICE_ID):
          console.log("IT_TEAM - FRANCHISE======>", info.created_by === cre_id && info.stage !== stageDatas.kyc);
          return info.created_by === cre_id && info.stage !== stageDatas.kyc;
        default:
          return false;
      }

    case IdsFromEnv.CRE_TL_ID:
      console.log("CRE_TL_ID======>", info.created_by === cre_id && info.assigned_cre === null);
      return info.created_by === cre_id && info.assigned_cre === null;

    case IdsFromEnv.CRE_ID.toString():
      console.log("CRE_ID======>", info.created_by === cre_id && info.counselors.length === 0);
      return info.created_by === cre_id && info.counselors.length === 0;

    case IdsFromEnv.COUNSELLOR_ROLE_ID.toString():
      console.log("COUNSELLOR_ROLE_ID======>", info.created_by === cre_id && info.stage !== stageDatas.kyc);
      return info.created_by === cre_id && info.stage !== stageDatas.kyc;

    case IdsFromEnv.COUNTRY_MANAGER_ID.toString():
      console.log("COUNTRY_MANAGER_ID======>", info.created_by === cre_id && info.stage !== stageDatas.kyc);
      return info.created_by === cre_id && info.stage !== stageDatas.kyc;

    case IdsFromEnv.REGIONAL_MANAGER_ID.toString():
      console.log("REGIONAL_MANAGER_ID======>", info.created_by === cre_id && info.assigned_counsellor_tl === null && info.branch_id === null);
      return info.created_by === cre_id && info.assigned_counsellor_tl === null && info.branch_id === null;

    case IdsFromEnv.COUNSELLOR_TL_ID.toString():
      console.log("COUNSELLOR_TL_ID======>", info.created_by === cre_id && info.counsiler_id === null);
      return info.created_by === cre_id && info.counsiler_id === null;

    case IdsFromEnv.BRANCH_COUNSELLOR_ID.toString():
      console.log("BRANCH_COUNSELLOR_ID======>", info.created_by === cre_id && info.stage !== stageDatas.kyc);
      return info.created_by === cre_id && info.stage !== stageDatas.kyc;

    case IdsFromEnv.FRANCHISE_COUNSELLOR_ID.toString():
      console.log("FRANCHISE_COUNSELLOR_ID======>", info.created_by === cre_id && info.stage !== stageDatas.kyc);
      return info.created_by === cre_id && info.stage !== stageDatas.kyc;

    default:
      console.log("Role ID:", role_id, role_id);
      return info.id === role_id;
  }
};
exports.getAttributesByRole = (role_id) => {
  switch (Number(role_id)) {
    case IdsFromEnv.IT_TEAM_ID:
      return [
        "id",
        "created_by",
        "assigned_cre",
        "full_name",
        "email",
        "phone",
        "source_id",
        "branch_id",
        "assigned_counsellor_tl",
        "city",
        "stage",
        "office_type",
        "lead_received_date",
        "created_at",
        "updated_at",
      ];

    case IdsFromEnv.CRE_TL_ID:
      return [
        "id",
        "created_by",
        "assigned_cre",
        "assign_type",
        "full_name",
        "email",
        "phone",
        "source_id",
        "city",
        "stage",
        "office_type",
        "lead_received_date",
        "created_at",
        "updated_at",
      ];

    case IdsFromEnv.CRE_ID:
      return [
        "id",
        "created_by",
        "assigned_cre",
        "assign_type",
        "full_name",
        "email",
        "phone",
        "source_id",
        "city",
        "stage",
        "office_type",
        "lead_received_date",
        "created_at",
        "updated_at",
      ];

    case IdsFromEnv.COUNSELLOR_ROLE_ID:
      return [
        "id",
        "created_by",
        "assigned_cre",
        "full_name",
        "email",
        "phone",
        "source_id",
        "city",
        "stage",
        "office_type",
        "lead_received_date",
        "created_at",
        "updated_at",
      ];

    case IdsFromEnv.COUNTRY_MANAGER_ID:
      return [
        "id",
        "created_by",
        "assigned_cre",
        "full_name",
        "email",
        "phone",
        "source_id",
        "city",
        "stage",
        "office_type",
        "lead_received_date",
        "created_at",
        "updated_at",
      ];

    case IdsFromEnv.REGIONAL_MANAGER_ID:
      return [
        "id",
        "created_by",
        "full_name",
        "email",
        "phone",
        "source_id",
        "branch_id",
        "assigned_counsellor_tl",
        "city",
        "stage",
        "office_type",
        "lead_received_date",
        "created_at",
        "updated_at",
      ];

    case IdsFromEnv.COUNSELLOR_TL_ID:
      return [
        "id",
        "created_by",
        "full_name",
        "email",
        "phone",
        "source_id",
        "counsiler_id",
        "city",
        "stage",
        "office_type",
        "lead_received_date",
        "created_at",
        "updated_at",
      ];

    case IdsFromEnv.BRANCH_COUNSELLOR_ID:
      return [
        "id",
        "created_by",
        "full_name",
        "email",
        "phone",
        "source_id",
        "counsiler_id",
        "city",
        "stage",
        "office_type",
        "lead_received_date",
        "created_at",
        "updated_at",
      ];

    case IdsFromEnv.FRANCHISE_MANAGER_ID:
    case IdsFromEnv.FRANCHISE_COUNSELLOR_ID:
      return [
        "id",
        "created_by",
        "assigned_cre",
        "full_name",
        "email",
        "phone",
        "source_id",
        "city",
        "stage",
        "office_type",
        "lead_received_date",
        "created_at",
        "updated_at",
      ];

    default:
      return [
        "id",
        "created_by",
        "assigned_cre",
        "full_name",
        "email",
        "phone",
        "source_id",
        "city",
        "stage",
        "office_type",
        "lead_received_date",
        "created_at",
        "updated_at",
      ];
  }
};
