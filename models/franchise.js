const addHistoryTracking = require("../mixins/historyMixin");

module.exports = (sequelize, Sequelize) => {
    const Franchise = sequelize.define(
      "franchise",
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: false,
          unique: true,
          validate: {
            isEmail: true,
          },
        },
        address: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        phone: {
          type: Sequelize.STRING(20),
          allowNull: false,
          validate: {
            isNumeric: true,
          },
        },
        pocName: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        isDeleted: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        slug: {
          type: Sequelize.STRING(255),
          allowNull: true,
          unique: true, // Ensure uniqueness of slugs
        }
      },
      {
        tableName: "franchise",
        timestamps: true, // Adjust as needed for createdAt and updatedAt fields
      }
    );

  addHistoryTracking(Franchise, "franchise");

  
    return Franchise;
  };
  