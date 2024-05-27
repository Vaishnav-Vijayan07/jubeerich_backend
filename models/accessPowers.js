module.exports = (sequelize, Sequelize) => {
  const AccessPowers = sequelize.define("access_power", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    power_name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    updated_by: {
      type: Sequelize.STRING(255),
    },
    status: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  });
  return AccessPowers;
};