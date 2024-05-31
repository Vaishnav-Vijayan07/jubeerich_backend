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
      updated_by: {
        type: Sequelize.INTEGER,
      },
    });
  
    return Region;
  };
  