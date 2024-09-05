module.exports = (sequelize, Sequelize) => {
    const StudyPreference = sequelize.define(
        "study_preference",
        {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            userPrimaryInfoId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "user_primary_info",
                    key: "id",
                },
            },
            countryId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "countries",
                    key: "id",
                },
            },
        },
        {
            tableName: "study_preferences",
            timestamps: false,
            indexes: [
                {
                    unique: true,
                    fields: ["userPrimaryInfoId", "countryId"],
                },
            ],
        }
    );

    return StudyPreference;
};
