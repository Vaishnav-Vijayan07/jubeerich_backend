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

  if (office_type === branch) {
    return stageDatas.regional_manager;
  }

  if (office_type === franchise) {
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
