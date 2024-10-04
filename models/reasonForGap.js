module.exports = (sequelize, Sequelize) => {
  const ReasonForGap = sequelize.define(
    "reason_for_gap",
    {
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
        onDelete: "CASCADE", // Automatically deletes gaps if the student is deleted
        onUpdate: "CASCADE", // Updates the student_id if the user_primary_info id changes
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      supporting_document: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      type: {
        type: Sequelize.ENUM('education', 'work'), // Restrict values to either "education" or "work"
        allowNull: false,
      },
      // The created_at and updated_at fields are automatically managed by Sequelize
    },
    {
      timestamps: true, // Enables createdAt and updatedAt fields automatically
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return ReasonForGap;
};
