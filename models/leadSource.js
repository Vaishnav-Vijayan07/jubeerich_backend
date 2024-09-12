module.exports = (sequelize, Sequelize) => {
  const LeadSource = sequelize.define("lead_source", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    source_name: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    source_description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    slug: {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true,
    },
    updated_by: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    lead_type_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'lead_types',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE', 
    },
  });
  return LeadSource;
};
