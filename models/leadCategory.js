module.exports = (sequelize, Sequelize) => {
  const LeadCategory = sequelize.define("lead_category", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    category_name: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    category_description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    status: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    updated_by: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
  });
  return LeadCategory
};
