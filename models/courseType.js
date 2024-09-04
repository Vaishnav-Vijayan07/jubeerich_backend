module.exports = (sequelize, Sequelize) => {
    const CourseType = sequelize.define("course_type",
        {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            type_name: {
                type: Sequelize.STRING(100),
                allowNull: false,
                unique: true,
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            updated_by: {
                type: Sequelize.INTEGER,
            },
        },
        {
            underscored: true,
            tableName: "course_type",
        }
    );

    return CourseType;
};
