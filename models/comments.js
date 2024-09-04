module.exports = (sequelize, Sequelize) => {
    const Comments = sequelize.define("comments", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        lead_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'user_primary_info', // This should match the name of the referenced table
                key: 'id',
            },
        },
        user_id: {
            type: Sequelize.INTEGER,
            references: {
                model: 'admin_users', // This should match the name of the referenced table
                key: 'id',
            },
        },
        created_at: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW,
        },
        comment: {
            type: Sequelize.TEXT,
            allowNull: false,
        },
        updated_at: {
            type: Sequelize.DATE,
        },
    });

    return Comments;
};
