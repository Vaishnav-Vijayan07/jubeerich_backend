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
    queryInterface.changeColumn("travel_histories", "start_date", {
      type: Sequelize.DATE,
      allowNull: true
    })

    queryInterface.changeColumn("travel_histories", "end_date", {
      type: Sequelize.DATE,
      allowNull: true
    })

    queryInterface.changeColumn("travel_histories", "purpose_of_travel", {
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
    queryInterface.changeColumn("travel_histories", "start_date", {
      type: Sequelize.DATE,
      allowNull: false
    })

    queryInterface.changeColumn("travel_histories", "end_date", {
      type: Sequelize.DATE,
      allowNull: false
    })

    queryInterface.changeColumn("travel_histories", "purpose_of_travel", {
      type: Sequelize.STRING(500),
      allowNull: false
    })
  }
};
