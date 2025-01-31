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
    queryInterface.changeColumn("previous_visa_declines", "visa_type", {
      type: Sequelize.STRING(100),
      allowNull: true
    })

    queryInterface.changeColumn("previous_visa_declines", "rejection_reason", {
      type: Sequelize.STRING(500),
      allowNull: true
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    queryInterface.changeColumn("previous_visa_declines", "visa_type", {
      type: Sequelize.STRING(100),
      allowNull: false
    })

    queryInterface.changeColumn("previous_visa_declines", "rejection_reason", {
      type: Sequelize.STRING(500),
      allowNull: false
    })
  }
};
