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

    queryInterface.changeColumn("user_primary_info", "phone", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });

    queryInterface.changeColumn("user_primary_info", "full_name", {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    queryInterface.changeColumn("user_primary_info", "office_type", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "office_types",
        key: "id",
      },
    });

    queryInterface.changeColumn("user_primary_info", "has_work_exp", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    });

    queryInterface.changeColumn("user_primary_info", "has_work_gap", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    });

    queryInterface.changeColumn("user_primary_info", "has_education_gap", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    });

    queryInterface.changeColumn("user_primary_info", "is_graduated", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
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

    queryInterface.changeColumn("user_primary_info", "phone", {
      type: Sequelize.STRING(20),
      allowNull: false,
    });

    queryInterface.changeColumn("user_primary_info", "full_name", {
      type: Sequelize.STRING(100),
      allowNull: false,
    });

    queryInterface.changeColumn("user_primary_info", "office_type", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "office_types",
        key: "id",
      },
    });

    queryInterface.changeColumn("user_primary_info", "has_work_exp", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    queryInterface.changeColumn("user_primary_info", "has_work_gap", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    queryInterface.changeColumn("user_primary_info", "has_education_gap", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    queryInterface.changeColumn("user_primary_info", "is_graduated", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  }
};
