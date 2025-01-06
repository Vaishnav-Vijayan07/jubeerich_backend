module.exports = (sequelize, Sequelize) => {
  const EligibilityRemarks = sequelize.define("eligibility_remarks", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    eligibilty_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "eligibility_checks",
        key: "id",
      },
    },
    availability_check: {
      type: Sequelize.STRING(255),
      allowNull: true, // Allows NULL values in the column
      defaultValue: null,
    },
    campus_check: {
      type: Sequelize.STRING(255),
      allowNull: true, // Allows NULL values in the column
      defaultValue: null,
    },
    entry_requirement_check: {
      type: Sequelize.STRING(255),
      allowNull: true, // Allows NULL values in the column
      defaultValue: null,
    },
    quantity_check: {
      type: Sequelize.STRING(255),
      allowNull: true, // Allows NULL values in the column
      defaultValue: null,
    },
    quality_check: {
      type: Sequelize.STRING(255),
      allowNull: true, // Allows NULL values in the column
      defaultValue: null,
    },
    immigration_check: {
      type: Sequelize.STRING(255),
      allowNull: true, // Allows NULL values in the column
      defaultValue: null,
    },
    application_fee_check: {
      type: Sequelize.STRING(255),
      allowNull: true, // Allows NULL values in the column
      defaultValue: null,
    },
  });

  return EligibilityRemarks;
};
