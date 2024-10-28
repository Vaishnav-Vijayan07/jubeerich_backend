module.exports = (sequelize, Sequelize) => {
  const ApplicationDetails = sequelize.define(
    "application_details",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      studyPrefernceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "study_preference_details",
          key: "id",
        },
      },
      is_rejected_kyc: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      application_status: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }
    },
    {
      tableName: "application_details",
      timestamps: true,
    }
  );
  return ApplicationDetails;
};
