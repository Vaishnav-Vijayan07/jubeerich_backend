module.exports = {
  up: async (queryInterface, Sequelize) => {
      await queryInterface.changeColumn('user_primary_info', 'category_id', {
          type: Sequelize.INTEGER,
          allowNull: true, // Allow NULL values
      });
  },
  down: async (queryInterface, Sequelize) => {
      await queryInterface.changeColumn('user_primary_info', 'category_id', {
          type: Sequelize.INTEGER,
          allowNull: false, // Revert to NOT NULL if needed
      });
  }
};
