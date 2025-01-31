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
    queryInterface.changeColumn("work_infos", "years", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    queryInterface.changeColumn("work_infos", "company", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    queryInterface.changeColumn("work_infos", "designation", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    queryInterface.changeColumn("work_infos", "from", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    queryInterface.changeColumn("work_infos", "to", {
      type: Sequelize.DATE,
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
    queryInterface.changeColumn("work_infos", "years", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    queryInterface.changeColumn("work_infos", "company", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    queryInterface.changeColumn("work_infos", "designation", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    queryInterface.changeColumn("work_infos", "from", {
      type: Sequelize.DATE,
      allowNull: false,
    });

    queryInterface.changeColumn("work_infos", "to", {
      type: Sequelize.DATE,
      allowNull: false,
    });
  }
};
