module.exports = (sequelize, Sequelize) => {
  const Course = sequelize.define(
    "course",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      course_name: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      course_description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      stream_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "stream", // name of the target table
          key: "id",
        },
        onDelete: "SET NULL",
      },
      course_type_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "course_type", // name of the target table
          key: "id",
        },
        onDelete: "SET NULL",
      },
      updated_by: {
        type: Sequelize.INTEGER,
      },
    },
    {
      underscored: true,
      tableName: "course",
    }
  );

  return Course;
};
