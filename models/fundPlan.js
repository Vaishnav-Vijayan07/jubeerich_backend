
module.exports = (sequelize, Sequelize) => {
    const FundPlan = sequelize.define("fund_plan", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      student_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'user_primary_info', // References the user_primary_info table
          key: 'id',
        },
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(50), // Loan, Savings, FD
        allowNull: false,
      },
      sponsor_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      approx_annual_income: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      itr_status: {
        type: Sequelize.BOOLEAN, // true (Filed), false (Yet to File)
        allowNull: false,
      },
      supporting_document: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW, // Default to current timestamp
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'admin_users', // References the adminUsers table
          key: 'id',
        },
        allowNull: true,
      },
    });
  
    return FundPlan;
  };
  