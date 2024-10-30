module.exports = (sequelize, Sequelize) => {
    const EligibilityChecks = sequelize.define("eligibility_checks", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      },
      immigration_check: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    });
  
    return EligibilityChecks;
  };
  