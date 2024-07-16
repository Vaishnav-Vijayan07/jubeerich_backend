module.exports = (sequelize, Sequelize) => {
  const UserAccadamicInfo = sequelize.define(
    "user_accadamic_info",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      qualification: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      place: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
      },
      year_of_passing: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      backlogs: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      work_experience: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      designation: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      company: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      years: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "user_primary_info",
          key: "id",
        },
        allowNull: false,
      },
    },
    {
      underscored: true,
      tableName: "user_accadamic_info",
    }
  );

  return UserAccadamicInfo;
};
