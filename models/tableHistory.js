module.exports = (sequelize, Sequelize) => {
  const TableHistory = sequelize.define("table_history", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    table_name: {
      type: Sequelize.STRING(100),
      allowNull: false,
      comment: "Name of the table being tracked",
    },
    record_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "Primary key of the record in the original table",
    },
    changed_by: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: "User ID who made this change",
    },
    change_type: {
      type: Sequelize.ENUM("CREATE", "UPDATE", "DELETE"),
      allowNull: false,
    },
    changed_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.NOW,
    },
    old_values: {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "Previous values before the change",
    },
    new_values: {
      type: Sequelize.JSON,
      allowNull: true,
      comment: "New values after the change",
    },
  },
  {
    tableName: "table_history",
    timestamps: true, // set to true if you have createdAt and updatedAt fields
    underscored: true,
  });

  return TableHistory;
};