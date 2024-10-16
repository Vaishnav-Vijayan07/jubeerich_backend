module.exports = (sequelize, Sequelize) => {
  const Task = sequelize.define(
    "task",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      studentId: {
        type: Sequelize.INTEGER,
        references: {
          model: "user_primary_info",
          key: "id",
        },
        allowNull: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        references: {
          model: "admin_users",
          key: "id",
        },
        allowNull: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      isCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "tasks",
      timestamps: false, // set to true if you have createdAt and updatedAt fields
    }
  );

  return Task;
};
