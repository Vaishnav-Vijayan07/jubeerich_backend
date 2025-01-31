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
    queryInterface.changeColumn("graduation_details", "qualification", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    queryInterface.changeColumn("graduation_details", "university_name", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    queryInterface.changeColumn("graduation_details", "college_name", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    queryInterface.changeColumn("graduation_details", "start_date", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    queryInterface.changeColumn("graduation_details", "percentage", {
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
    queryInterface.changeColumn("graduation_details", "qualification", {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    queryInterface.changeColumn("graduation_details", "university_name", {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    queryInterface.changeColumn("graduation_details", "college_name", {
      type: Sequelize.STRING(255),
      allowNull: false,
    });

    queryInterface.changeColumn("graduation_details", "start_date", {
      type: Sequelize.DATE,
      allowNull: false,
    });

    queryInterface.changeColumn("graduation_details", "percentage", {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
    });
  }
};
