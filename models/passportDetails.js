module.exports = (sequelize, Sequelize) => {
  const PassportDetails = sequelize.define(
    "passport_details",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "user_primary_info", // Assuming this is the user table
          key: "id",
        },
        allowNull: false,
      },
      original_passports_in_hand: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      missing_passport_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      visa_immigration_history: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      name_change: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      passports: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
    },
    {
      underscored: true,
      tableName: "passport_details",
    }
  );

  return PassportDetails;
};
