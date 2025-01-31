'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    queryInterface.changeColumn("study_preference_details", "intakeYear", {
      type: Sequelize.STRING(4),
      allowNull: true,
    });

    queryInterface.changeColumn("study_preference_details", "intakeMonth", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    queryInterface.changeColumn("study_preference_details", "estimatedBudget", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    queryInterface.changeColumn("study_preference_details", "intakeYear", {
      type: Sequelize.STRING(4),
      allowNull: false,
    });

    queryInterface.changeColumn("study_preference_details", "intakeMonth", {
      type: Sequelize.STRING(20),
      allowNull: false,
    });

    queryInterface.changeColumn("study_preference_details", "estimatedBudget", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });
  }
};
