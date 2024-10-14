module.exports = (sequelize, Sequelize) => {
    const Flag = sequelize.define("flag", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      flag_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      flag_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      color: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.INTEGER,
      },
    });
  
    return Flag;
  };
  