module.exports = (sequelize, Sequelize) => {
    const Task = sequelize.define("ordinary_task", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'completed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        allowNull: false,
        defaultValue: 'medium',
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "admin_users",
          key: "id",
        },
        allowNull: true,
      }
    });
  
    return Task;
  };