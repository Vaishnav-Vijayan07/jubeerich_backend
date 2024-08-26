module.exports = (sequelize, Sequelize) => {
  const AdminUser = sequelize.define("admin_user", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    employee_id: {
      type: Sequelize.STRING(10),
      unique: true,
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: Sequelize.STRING(20),
      allowNull: false,
    },
    address: {
      type: Sequelize.TEXT,
    },
    username: {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
    },
    password: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    role_id: {
      type: Sequelize.INTEGER,
      references: {
        model: "access_roles", // name of the target table
        key: "id",
      },
      onDelete: "SET NULL",
    },
    country_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "countries", // name of the target table
        key: "id",
      },
      onDelete: "SET NULL",
    },
    franchise_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "franchise", // name of the target table
        key: "id",
      },
      onDelete: "SET NULL",
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

  return AdminUser
};
