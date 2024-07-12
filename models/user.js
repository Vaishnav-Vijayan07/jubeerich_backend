module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define('user', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        username: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        mobile: {
            type: Sequelize.STRING,
        },
        password: {
            type: Sequelize.STRING
        },

        bio: {
            type: Sequelize.STRING
        },
        branch_id: {
            type: Sequelize.INTEGER,
            references: {
                model: "branches",
                key: "id",
            },
            allowNull: true,
        },
        region_id: {
            type: Sequelize.INTEGER,
            references: {
                model: "regions",
                key: "id",
            },
            allowNull: true,
        },

    });

    return User;
}
