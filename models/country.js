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
    country_code: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    isd: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  });

  return Country;
};
