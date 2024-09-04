'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Rename table from "AcademicInfos" to "academicinfos"
    await queryInterface.renameTable('academicinfos', 'academic_infos');
  },

  async down(queryInterface, Sequelize) {
    // Revert table name change
    await queryInterface.renameTable('academic_infos', 'academicinfos');
  }
};
