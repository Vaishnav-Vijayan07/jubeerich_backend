module.exports = (sequelize, Sequelize) => {
  const VisaConfiguration = sequelize.define(
    "visa_configuration",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      country_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "countries",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      visa_checklist_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "visa_checklist",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1, 
      },
    },
    {
      underscored: true,
      tableName: "visa_configuration",
    }
  );

  return VisaConfiguration;
};
