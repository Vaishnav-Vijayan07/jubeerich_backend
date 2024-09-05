'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AcademicInfos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      qualification: {
        type: Sequelize.STRING,
        allowNull: false
      },
      place: {
        type: Sequelize.STRING,
        allowNull: false
      },
      percentage: {
        type: Sequelize.DECIMAL(5, 2), // Precision and scale
        allowNull: false
      },
      year_of_passing: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      backlogs: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user_primary_info', // Ensure this matches the actual table name
          key: 'id'
        },
        onUpdate: 'CASCADE', // Optional: Update foreign key on referenced table updates
        onDelete: 'SET NULL' // Optional: Set foreign key to null on referenced table deletions
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AcademicInfos');
  }
};
