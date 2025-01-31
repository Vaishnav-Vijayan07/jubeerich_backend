const addHistoryTracking = require("../mixins/historyMixin");

module.exports = (sequelize, Sequelize) => {
    const MaritalStatus = sequelize.define("marital_status", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      marital_status_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      marital_status_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.INTEGER,
      },
    });
  
    addHistoryTracking(MaritalStatus, "marital_status");
  
    return MaritalStatus;
  };
  