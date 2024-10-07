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
        country_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "countries",
                key: "id"
            }
        },
        visa_type: {
            type: Sequelize.STRING(100),
            allowNull: false
        },
        course_applied: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "course",
                key: "id"
            }
        },
        university_applied: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: "universities", // Need to change as Institutions
                key: "id"
            }
        },
        approved_letter: {
            type: Sequelize.STRING,
            allowNull: true,
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
