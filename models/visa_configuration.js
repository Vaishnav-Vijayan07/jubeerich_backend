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
            model: "countries", // Table name being referenced
            key: "id",        // Column being referenced
          },
          onDelete: "CASCADE", // Ensures cascading delete behavior
        },
        visa_checklist_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "visa_checklist", // Table name being referenced
            key: "id",              // Column being referenced
          },
          onDelete: "CASCADE", // Ensures cascading delete behavior
        }, 
      },
      {
        underscored: true,      // Use snake_case column names
        tableName: "visa_configuration", // Explicit table name
      }
    );
  
    return VisaConfiguration;
  };
  