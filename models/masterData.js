module.exports = (sequelize, Sequelize) => {
    const masterData = sequelize.define("master_data", {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        task_prefix: {
            type: Sequelize.STRING(10),
            allowNull: false
        },
        active: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
    },{
        paranoid: true,
        timestamps: true,
        deletedAt: 'deleted_at',
      });
    return masterData;
};
