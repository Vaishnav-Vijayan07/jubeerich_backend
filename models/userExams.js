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
        // exam_name: {
        //   type: Sequelize.STRING(100),
        //   allowNull: false,
        // },
        exam_type: {
          type: Sequelize.STRING(100),
          allowNull: false,
        },        
        // marks: {
        //   type: Sequelize.FLOAT,
        //   allowNull: true,
        // },
        // document: {
        //   type: Sequelize.STRING,
        //   allowNull: true,
        // },
        score_card: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        exam_date: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        listening_score: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        speaking_score: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        reading_score: {
          type: Sequelize.INTEGER,
          allowNull: false,
        },
        writing_score: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        overall_score: {
          type: Sequelize.INTEGER,
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
  