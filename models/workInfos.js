module.exports = (sequelize, Sequelize) => {
  const WorkInfo = sequelize.define("work_infos", {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    years: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    company: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    designation: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    from: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    to: {
      type: Sequelize.DATE,
      allowNull: false,
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "user_primary_info", // Ensure this matches the actual table name
        key: "id",
      },
      onUpdate: "CASCADE", // Optional: Update foreign key on referenced table updates
      onDelete: "SET NULL", // Optional: Set foreign key to null on referenced table deletions
    },
    bank_statement: {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    job_offer_document: {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    appointment_document: {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    payslip_document: {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
  });

  return WorkInfo;
};
