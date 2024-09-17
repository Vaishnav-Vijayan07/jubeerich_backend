module.exports = (sequelize, Sequelize) => {
    const previousVisaApproval = sequelize.define("previous_visa_approval", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        student_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "user_primary_info",
                key: "id",
            },
        },
        country_name: {
            type: Sequelize.STRING(100),
            allowNull: false,
        },
        visa_type: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        course_applied: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        institute_applied: {
            type: Sequelize.STRING(255),
            allowNull: false
        },
        updated_by: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "admin_users",
                key: "id"
            }
        }
    });
    return previousVisaApproval;
};
