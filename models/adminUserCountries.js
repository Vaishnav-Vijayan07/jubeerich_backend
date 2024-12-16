module.exports = (sequelize, Sequelize) => {
  const AdminUser = sequelize.define(
    "admin_user_countries",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      admin_user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "admin_users", // Name of the AdminUser table
          key: "id",
        },
        onDelete: "CASCADE",
      },
      country_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "countries", // Name of the Country table
          key: "id",
        },
        onDelete: "CASCADE",
      }
    },
    {
      underscored: true,
      tableName: "admin_user_countries",
    }
  );

  return AdminUser;
};
