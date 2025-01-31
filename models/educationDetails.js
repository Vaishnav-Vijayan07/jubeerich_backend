const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const educationDetails = sequelize.define(
    "educationDetails",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: DataTypes.INTEGER,
        references: {
          model: "user_primary_info", // Name of the referenced model
          key: "id",
        },
        allowNull: false,
      },
      qualification: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      board_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      school_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      mark_sheet: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      admit_card: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      certificate: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      updated_by: {
        type: DataTypes.INTEGER,
        references: {
          model: "admin_users", // Name of the referenced model
          key: "id",
        },
        allowNull: true,
      },
    },
    {
      tableName: "education_details",
      timestamps: true, // Disable automatic timestamps
      underscored: true, // Use snake_case for column names
    }
  );

  return educationDetails;
};
