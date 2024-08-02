'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('user_primary_info', 'preferred_country');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('user_primary_info', 'preferred_country', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'countries',
        key: 'id',
      },
    });
  }
};
