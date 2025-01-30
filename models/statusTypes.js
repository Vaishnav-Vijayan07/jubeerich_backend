const addHistoryTracking = require("../mixins/historyMixin");

module.exports = (sequelize, Sequelize) => {
  const StatusType = sequelize.define(
    "status_type",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      type_name: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
    },
    {
      underscored: true,
      tableName: "status_type",
    }
  );

  addHistoryTracking(StatusType, "status_type");

  return StatusType;
};
