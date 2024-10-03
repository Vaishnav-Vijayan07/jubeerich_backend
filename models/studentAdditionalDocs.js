module.exports = (sequelize, Sequelize) => {
    const studentAdditionalDocs = sequelize.define("student_additional_docs", {
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
        passport_doc: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        updated_cv: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        profile_assessment_doc: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        pte_cred: {
            type: Sequelize.STRING,
            allowNull: true,
        },
    });
    return studentAdditionalDocs;
};
