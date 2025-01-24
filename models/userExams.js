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
          allowNull: false,
        },
        score_card: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        exam_date: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        listening_score: {
          // type: Sequelize.DECIMAL(5, 2),
          type: Sequelize.STRING,
          allowNull: false,
        },
        speaking_score: {
          // type: Sequelize.DECIMAL(5, 2),
          type: Sequelize.STRING,
          allowNull: false
        },
        reading_score: {
          // type: Sequelize.DECIMAL(5, 2),
          type: Sequelize.STRING,
          allowNull: false,
        },
        writing_score: {
          // type: Sequelize.DECIMAL(5, 2),
          type: Sequelize.STRING,
          allowNull: false
        },
        overall_score: {
          // type: Sequelize.DECIMAL(5, 2),
          type: Sequelize.STRING,
          allowNull: false,
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
  