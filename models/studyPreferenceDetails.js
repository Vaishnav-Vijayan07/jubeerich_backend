// models/StudyPreferenceDetails.js
module.exports = (sequelize, Sequelize) => {
  const StudyPreferenceDetails = sequelize.define(
    "study_preference_details",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      studyPreferenceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "study_preferences", // Referencing the parent table
          key: "id",
        },
      },
      universityId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "universities", // Assuming table name for universities
          key: "id",
        },
      },
      campusId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "campus", // Assuming table name for campuses
          key: "id",
        },
      },
      courseTypeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "course_type", // Assuming table name for course types
          key: "id",
        },
      },
      streamId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "stream", // Assuming table name for streams
          key: "id",
        },
      },
      courseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "course", // Assuming table name for courses
          key: "id",
        },
      },
      intakeYear: {
        type: Sequelize.STRING(4),
        allowNull: true,
      },
      intakeMonth: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      estimatedBudget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
    },
    {
      tableName: "study_preference_details",
      timestamps: false, // Set to true if you need createdAt and updatedAt fields
    }
  );
  return StudyPreferenceDetails;
};
