'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename table from "AcademicInfos" to "academicinfos"
    await queryInterface.renameTable('AcademicInfos', 'academicinfos');
  },

  async down(queryInterface, Sequelize) {
    // Revert table name change
    await queryInterface.renameTable('academicinfos', 'AcademicInfos');
  }
};
