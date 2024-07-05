module.exports = (sequelize, Sequelize) => {
  const UserStudyPreferenceInfo = sequelize.define(
    "user_study_preference_info",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      intersted_country: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "countries",
          key: "id",
        },
      },
      intrested_institution: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      intake_year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      intake_month: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      estimated_budget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      course_field_of_intrest: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "user_primary_info",
          key: "id",
        },
        allowNull: false,
      },
    },
    {
      underscored: true,
      tableName: "user_study_preference_info",
    }
  );

  return UserStudyPreferenceInfo;
};
