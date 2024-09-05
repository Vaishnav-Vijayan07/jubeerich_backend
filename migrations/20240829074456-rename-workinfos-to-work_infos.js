"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameTable("workinfos", "work_infos");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameTable("work_infos", "workinfos");
  },
};
