module.exports = (sequelize, Sequelize) => {
    const Region = sequelize.define("region", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      region_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      region_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      regional_manager_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "admin_users",
          key: "id",
        },
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.INTEGER,
      },
    });
  
    return Region;
  };
  