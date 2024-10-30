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
          allowNull: true,
        },
        counselor_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "admin_users",
            key: "id",
          },
          allowNull: true,
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
  