module.exports = (sequelize, Sequelize) => {
    const Stream = sequelize.define("stream",
        {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            stream_name: {
                type: Sequelize.STRING(100),
                allowNull: false,
            },
            stream_description: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            updated_by: {
                type: Sequelize.INTEGER,
            },
        },
        {
            underscored: true,
            tableName: "stream",
        }
    );

    return Stream;
};
