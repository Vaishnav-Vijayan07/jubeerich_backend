module.exports = (sequelize, Sequelize) => {
    const Status = sequelize.define(
        "status",
        {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false,
            },
            status_name: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            status_description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            color: {
                type: Sequelize.STRING(7),
                allowNull: true,
            },
            updated_by: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
        },
        {
            underscored: true,
            tableName: "status",
        }
    );

    return Status;
};