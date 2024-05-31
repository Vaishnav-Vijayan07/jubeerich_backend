module.exports = (sequelize, Sequelize) => {
    const Country = sequelize.define("country", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      country_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
    });
  
    return Country;
  };
  