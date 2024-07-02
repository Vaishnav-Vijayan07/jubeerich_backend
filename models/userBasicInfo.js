module.exports = (sequelize, Sequelize) => {
  const UserBasicInfo = sequelize.define(
    "user_basic_info",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      passport_no: {
        type: Sequelize.STRING(10),
        allowNull: true,
        unique: true,
      },
      dob: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      gender: {
        type: Sequelize.ENUM("Male", "Female", "Other"),
        allowNull: false,
      },
      marital_status: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "marital_statuses",
          key: "id",
        },
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "user_primary_info",
          key: "id",
        },
        allowNull: true,
      },
    },
    {
      underscored: true,
      tableName: "user_basic_info",
    }
  );

  return UserBasicInfo;
};
