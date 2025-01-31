const addHistoryTracking = require("../mixins/historyMixin");

module.exports = (sequelize, Sequelize) => {
  const LeadType = sequelize.define("lead_type", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    updated_by: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    slug: {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true,
    },
  });

  addHistoryTracking(LeadType, "lead_type");

  return LeadType;
};
