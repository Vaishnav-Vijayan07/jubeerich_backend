module.exports = (sequelize, Sequelize) => {
    const CampusCourse = sequelize.define(
      "campus_course",
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        course_fee: {
          type: Sequelize.FLOAT,
          allowNull: true,
        },
        application_fee: {
          type: Sequelize.FLOAT,
          allowNull: true,
        },
        course_link: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        campus_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "campus",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        course_id: {
          type: Sequelize.INTEGER,
          references: {
            model: "course",
            key: "id",
          },
          onDelete: "CASCADE",
        },
        updated_by: {
          type: Sequelize.INTEGER,
        },
      },
      {
        underscored: true,
        tableName: "campus_course",
      }
    );
  
    return CampusCourse;
  };
  