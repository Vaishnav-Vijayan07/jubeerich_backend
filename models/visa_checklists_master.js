module.exports = (sequelize, Sequelize) => {
  const VisaChecklist = sequelize.define(
    "visa_checklist",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      step_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      underscored: true,
      tableName: "visa_checklist",
    }
  );

  return VisaChecklist 
};


