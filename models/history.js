module.exports = (sequelize, Sequelize) => {
    const History = sequelize.define(
      "history",
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        student_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "user_primary_info",
            key: "id",
          },
          allowNull: false,
        },
        action: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        updated_by: {
          type: Sequelize.INTEGER,
          references: {
            model: "admin_users",
            key: "id",
          },
          allowNull: true, // Nullable if no admin user performed the action
        },
        updated_on: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW, // This automatically logs the timestamp when a record is created
        },
      },
      {
        tableName: "history",
        timestamps: false, // Disable Sequelize's default timestamps if using custom fields
      }
    );
  
    return History;
  };
  