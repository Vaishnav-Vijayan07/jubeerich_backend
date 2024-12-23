module.exports = (sequelize, Sequelize) => {
  const Status = sequelize.define(
    "status",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      type_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "status_type",
          key: "id",
        },
      },
      status_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      status_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      color: {
        type: Sequelize.STRING(40),
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      underscored: true,
      tableName: "status",
    }
  );
  return Status;
};
