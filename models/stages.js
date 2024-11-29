module.exports = (sequelize, Sequelize) => {
  const Stages = sequelize.define(
    "stages",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      stage_name: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return Stages;
};
