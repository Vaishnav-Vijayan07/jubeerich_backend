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
    queryInterface.changeColumn("user_exams", "exam_type", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    queryInterface.changeColumn("user_exams", "exam_date", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    queryInterface.changeColumn("user_exams", "listening_score", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    queryInterface.changeColumn("user_exams", "speaking_score", {
      type: Sequelize.STRING,
      allowNull: true
    });

    queryInterface.changeColumn("user_exams", "reading_score", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    queryInterface.changeColumn("user_exams", "writing_score", {
      type: Sequelize.STRING,
      allowNull: true
    });

    queryInterface.changeColumn("user_exams", "overall_score", {
      type: Sequelize.STRING,
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
    queryInterface.changeColumn("user_exams", "exam_type", {
      type: Sequelize.STRING(100),
      allowNull: false,
    });

    queryInterface.changeColumn("user_exams", "exam_date", {
      type: Sequelize.DATE,
      allowNull: false,
    });

    queryInterface.changeColumn("user_exams", "listening_score", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    queryInterface.changeColumn("user_exams", "speaking_score", {
      type: Sequelize.STRING,
      allowNull: false
    });

    queryInterface.changeColumn("user_exams", "reading_score", {
      type: Sequelize.STRING,
      allowNull: false,
    });

    queryInterface.changeColumn("user_exams", "writing_score", {
      type: Sequelize.STRING,
      allowNull: false
    });

    queryInterface.changeColumn("user_exams", "overall_score", {
      type: Sequelize.STRING,
      allowNull: false,
    });
  }
};
