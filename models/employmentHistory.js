module.exports = (sequelize, Sequelize) => {
    const EmploymentHistory = sequelize.define("employment_history", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      served_notice_period: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        comment: "Have you served notice period as per the requirement of your employer during your last resignation",
      },
      terminated_from_company: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        comment: "Did you get terminated from any organization/company",
      },
      good_relation_with_employers: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        comment: "Are you in very good and friendly relation with all of your previous/current employers",
      },
      submitted_forged_documents: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        comment: "Is there any forged experience or any other documents submitted to us",
      },
      has_abroad_work_evidence: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        comment: "For any abroad work experiences do you still have the visa page, permit card, salary account statement, and all other supporting evidence to prove the same",
      },
      visa_page: {  // Field to store the visa page document
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Filepath or URL to the visa page document",
      },
      permit_card: {  // Field to store the permit card document
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Filepath or URL to the permit card document",
      },
      salary_account_statement: {  // Field to store the salary account statement
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Filepath or URL to the salary account statement",
      },
      supporting_documents: {  // Field to store any other supporting documents
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: "Filepath or URL to other supporting documents",
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
  
    return EmploymentHistory;
  };
  