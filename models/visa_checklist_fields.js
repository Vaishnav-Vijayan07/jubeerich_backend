module.exports = (sequelize, Sequelize) => {
  const VisaChecklistField = sequelize.define(
    "visa_checklist_field",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
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
      field_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      field_type: {
        type: Sequelize.ENUM("text", "number", "date", "boolean", "radio", "select", "checkbox", "textarea"),
        allowNull: false,
      },
    },
    {
      underscored: true,
      tableName: "visa_checklist_field",
    }
  );

  return VisaChecklistField;
};
