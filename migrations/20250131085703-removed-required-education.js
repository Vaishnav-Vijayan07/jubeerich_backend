'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    queryInterface.changeColumn("education_details", "qualification", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    queryInterface.changeColumn("education_details", "board_name", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    queryInterface.changeColumn("education_details", "school_name", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    queryInterface.changeColumn("education_details", "start_date", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    queryInterface.changeColumn("education_details", "percentage", {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    queryInterface.changeColumn("education_details", "qualification", {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    queryInterface.changeColumn("education_details", "board_name", {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    queryInterface.changeColumn("education_details", "school_name", {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    queryInterface.changeColumn("education_details", "start_date", {
      type: Sequelize.DATE,
      allowNull: false,
    });

    queryInterface.changeColumn("education_details", "percentage", {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
    });
  }
};
