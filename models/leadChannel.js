module.exports = (sequelize, Sequelize) => {
  const LeadChannel = sequelize.define("lead_channel", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    source_id: {
      type: Sequelize.INTEGER,
      references: {
        model: "lead_sources", // Reference to Source model
        key: "id",
      },
      allowNull: true,
    },
    channel_name: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    channel_description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    updated_by: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
  });

  return LeadChannel;
};
