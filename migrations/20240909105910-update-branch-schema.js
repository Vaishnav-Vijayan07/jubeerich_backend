module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('branch', 'address', {
      type: Sequelize.STRING(255),
      allowNull: true, // Change to true to reflect new schema
    });
    await queryInterface.changeColumn('branch', 'city', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.changeColumn('branch', 'state', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.changeColumn('branch', 'country', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.changeColumn('branch', 'pincode', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.changeColumn('branch', 'contact_person_email', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.changeColumn('branch', 'contact_person_name', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.changeColumn('branch', 'contact_person_mobile', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.changeColumn('branch', 'contact_person_designation', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.changeColumn('branch', 'website', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.changeColumn('branch', 'social_media', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.changeColumn('branch', 'account_mail', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.changeColumn('branch', 'support_mail', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.changeColumn('branch', 'updated_by', {
      type: Sequelize.INTEGER,
      allowNull: true, // Adjust if needed
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the changes if needed
    await queryInterface.changeColumn('branch', 'address', {
      type: Sequelize.STRING(255),
      allowNull: false, // Original settings
    });
    await queryInterface.changeColumn('branch', 'city', {
      type: Sequelize.STRING(100),
      allowNull: false,
    });
    await queryInterface.changeColumn('branch', 'state', {
      type: Sequelize.STRING(100),
      allowNull: false,
    });
    await queryInterface.changeColumn('branch', 'country', {
      type: Sequelize.STRING(100),
      allowNull: false,
    });
    await queryInterface.changeColumn('branch', 'pincode', {
      type: Sequelize.STRING(20),
      allowNull: false,
    });
    await queryInterface.changeColumn('branch', 'contact_person_email', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
    await queryInterface.changeColumn('branch', 'contact_person_name', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
    await queryInterface.changeColumn('branch', 'contact_person_mobile', {
      type: Sequelize.STRING(20),
      allowNull: false,
    });
    await queryInterface.changeColumn('branch', 'contact_person_designation', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
    await queryInterface.changeColumn('branch', 'website', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
    await queryInterface.changeColumn('branch', 'social_media', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
    await queryInterface.changeColumn('branch', 'account_mail', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
    await queryInterface.changeColumn('branch', 'support_mail', {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
    await queryInterface.changeColumn('branch', 'updated_by', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },
};
