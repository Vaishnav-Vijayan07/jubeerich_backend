module.exports = (sequelize, Sequelize) => {
    const UserExams = sequelize.define(
      "user_exams",
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        student_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "user_primary_info",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        exam_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },
        marks: {
          type: Sequelize.FLOAT,
          allowNull: true,
        },
        document: {
          type: Sequelize.STRING,
          allowNull: true,
        },
      },
      {
        underscored: true,
        tableName: "user_exams",
        indexes: [
          {
            name: "user_exam_name_index",
            fields: ["exam_name"],
          },
        ],
      }
    );
  
    return UserExams;
  };
  