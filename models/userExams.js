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
        exam_type: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        score_card: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        exam_date: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        listening_score: {
          // type: Sequelize.DECIMAL(5, 2),
          type: Sequelize.STRING,
          allowNull: true,
        },
        speaking_score: {
          // type: Sequelize.DECIMAL(5, 2),
          type: Sequelize.STRING,
          allowNull: true
        },
        reading_score: {
          // type: Sequelize.DECIMAL(5, 2),
          type: Sequelize.STRING,
          allowNull: true,
        },
        writing_score: {
          // type: Sequelize.DECIMAL(5, 2),
          type: Sequelize.STRING,
          allowNull: true
        },
        overall_score: {
          // type: Sequelize.DECIMAL(5, 2),
          type: Sequelize.STRING,
          allowNull: true,
        },
        updated_by: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "admin_users",
            key: "id",
          },
        }
      },
      {
        underscored: true,
        tableName: "user_exams",
        indexes: [
          {
            // name: "user_exam_name_index",
            // fields: ["exam_name"],
            name: "user_exam_type_index",
            fields: ["exam_type"],
          },
        ],
      }
    );
  
    return UserExams;
  };
  