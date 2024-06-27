module.exports = (sequelize, Sequelize) => {
    const UserBranches = sequelize.define("user_branch", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "admin_users", // name of the target table
          key: "id",
        },
        onDelete: "SET NULL",
      },
      branch_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "branches", // name of the target table
          key: "id",
        },
        onDelete: "SET NULL",
      }
    });
  
    return UserBranches;
  };
  