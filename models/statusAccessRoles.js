module.exports = (sequelize, Sequelize) => {
    const StatusAccessRoles = sequelize.define(
        "status_access_roles",
        {
            status_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "status",
                    key: "id",
                },
                allowNull: false,
                primaryKey: true,
            },
            access_role_id: {
                type: Sequelize.INTEGER,
                references: {
                    model: "access_roles",
                    key: "id",
                },
                allowNull: false,
                primaryKey: true,
            }
        },
        {
            underscored: true,
            tableName: "status_access_roles",
        }
    );

    return StatusAccessRoles;
};