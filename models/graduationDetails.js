const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const GraduationDetails = sequelize.define(
    "GraduationDetails",
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
        allowNull: false,
      },
      university_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      college_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
      },
      conversion_formula: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      grading_scale_info: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      registration_certificate: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      certificate: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      admit_card: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      },
      backlog_certificate: {
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
      tableName: "graduation_details",
      timestamps: true, // Disable automatic timestamps
      underscored: true, // Use snake_case for column names
    }
  );

  return GraduationDetails;
};
