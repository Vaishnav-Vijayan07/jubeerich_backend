module.exports = (sequelize, Sequelize) => {
    const AdminUserCountries = sequelize.define("admin_user_countries", {
      admin_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "admin_user",
          key: "id",
        },
        onDelete: "CASCADE", // Adjust as needed
      },
      country_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "countries",
          key: "id",
        },
        onDelete: "CASCADE", // Adjust as needed
      },
    });
  
    return AdminUserCountries;
  };