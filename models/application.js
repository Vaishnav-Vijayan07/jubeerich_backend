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
        defaultValue: false,
      },
      proceed_to_application_manager: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      assigned_user: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "admin_users",
          key: "id",
        },
      },
      application_status: {
        type: Sequelize.ENUM("pending", "submitted", "offer_accepted", "rejected"),
        defaultValue: "pending",
      },
      kyc_status: {
        type: Sequelize.ENUM("submitted", "approved", "rejected"),
        defaultValue: "submitted",
      },
      reference_id: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      comments: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      offer_letter: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      offer_letter_type: {
        type: Sequelize.ENUM("conditional", "unconditional"),
        allowNull: true
      },
    },
    {
      tableName: "application_details",
      timestamps: true,
    }
  );
  return ApplicationDetails;
};
