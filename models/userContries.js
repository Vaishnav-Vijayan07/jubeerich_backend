module.exports = (sequelize, Sequelize) => {
  const UserCountries = sequelize.define(
    "user_countries",
    {
      user_primary_info_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "user_primary_info",
          key: "id",
        },
        allowNull: true,
        onDelete: "CASCADE",
      },
      country_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "countries",
          key: "id",
        },
        allowNull: true,
        onDelete: "CASCADE",
      },
    },
    {
      underscored: true,
      tableName: "user_countries",
      indexes: [
        {
          unique: true,
          fields: ["user_primary_info_id", "country_id"],
        },
      ],
    }
  );

  return UserCountries;
};
