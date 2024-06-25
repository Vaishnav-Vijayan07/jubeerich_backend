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
