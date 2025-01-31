module.exports = (sequelize, Sequelize) => {
    const travelHistory = sequelize.define("travel_history", {
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
        start_date: {
            type: Sequelize.DATE,
            allowNull: true
        },
        end_date: {
            type: Sequelize.DATE,
            allowNull: true
        },
        purpose_of_travel: {
            type: Sequelize.STRING(500),
            allowNull: true
        },
    });
    return travelHistory;
};
