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
    queryInterface.changeColumn("fund_plans", "type", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    queryInterface.changeColumn("fund_plans", "itr_status", {
      type: Sequelize.BOOLEAN,
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
    queryInterface.changeColumn("fund_plans", "type", {
      type: Sequelize.STRING(50),
      allowNull: false,
    });

    queryInterface.changeColumn("fund_plans", "itr_status", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    });
  }
};
