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
        model: "user_primary_info", // References the user_primary_info table
        key: "id",
      },
      allowNull: false,
    },
    type: {
      type: Sequelize.STRING(50), // Loan, Savings, FD
      allowNull: false,
    },
    fund_origin: {
      type: Sequelize.STRING(50), // Loan, Savings, FD
      allowNull: true,
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
    relation_with_sponsor: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    sponsorship_amount: {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    },
    name_of_bank: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    has_min_6_months_backup: {
      type: Sequelize.BOOLEAN,
      allowNull: true,
    },
    source_of_funds: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    supporting_document: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    updated_at: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      allowNull: true,
    },
    updated_by: {
      type: Sequelize.INTEGER,
      references: {
        model: "admin_users",
        key: "id",
      },
      allowNull: true,
    },
  });

  return FundPlan;
};
