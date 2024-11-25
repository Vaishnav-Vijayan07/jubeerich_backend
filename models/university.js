module.exports = (sequelize, Sequelize) => {
  const University = sequelize.define("university", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    university_name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    location: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    country_id: {
      type: Sequelize.INTEGER,
      references: {
        model: "countries", // name of the target table
        key: "id",
      },
      onDelete: "SET NULL",
    },
    website_url: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    image_url: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    portal_link: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    username: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    password: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
    updated_by: {
      type: Sequelize.INTEGER,
    },
    description: {
      type: Sequelize.STRING(200),
      allowNull: true,
    },
  });

  return University;
};