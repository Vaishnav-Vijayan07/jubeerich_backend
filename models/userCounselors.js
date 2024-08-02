module.exports = (sequelize, Sequelize) => {
    const UserCounselors = sequelize.define(
      "user_counselors",
      {
        user_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "user_primary_info",
            key: "id",
          },
          allowNull: false,
        },
        counselor_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "admin_users",
            key: "id",
          },
          allowNull: false,
        },
      },
      {
        underscored: true,
        tableName: "user_counselors",
        indexes: [
          {
            unique: true,
            fields: ["user_id", "counselor_id"],
          },
        ],
      }
    );
  
    return UserCounselors;
  };
  