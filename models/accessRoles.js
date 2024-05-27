module.exports = (sequelize, Sequelize) => {
  const AccessRoles = sequelize.define("access_role", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    power_ids: {
      type: Sequelize.STRING(100),
    },
    role_name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    updated_by: {
      type: Sequelize.INTEGER,
    },
    status: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  });

  return AccessRoles;
};
