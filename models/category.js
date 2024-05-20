module.exports = (sequelize, Sequelize) => {
    const Category = sequelize.define('category', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false,
        }
    });

    return Category;
}
