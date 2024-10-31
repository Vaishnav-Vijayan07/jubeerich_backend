module.exports = (sequelize, Sequelize) => {
  const EligibilityChecks = sequelize.define("eligibility_checks", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    application_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "application_details",
        key: "id",
      },
    },
    availability_check: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    campus_check: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    entry_requirement_check: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    quantity_check: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    quality_check: {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {
        formatting: false,
        checks: false,
        clarity: false,
      },
    },
    immigration_check: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
  });

  return EligibilityChecks;
};

