const addHistoryTracking = require("../mixins/historyMixin");

module.exports = (sequelize, Sequelize) => {
  const Campus = sequelize.define(
    "campus",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      campus_name: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      university_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "universities", // name of the target table
          key: "id",
        },
        onDelete: "CASCADE",
      },
      updated_by: {
        type: Sequelize.INTEGER,
      },
    },
    {
      underscored: true,
      tableName: "campus",
    }
  );

  addHistoryTracking(Campus, "campus");


  return Campus;
};
