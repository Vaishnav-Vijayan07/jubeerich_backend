module.exports = (sequelize, Sequelize) => {
  const UserPrimaryInfo = sequelize.define(
    "user_primary_info",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      category_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "lead_categories",
          key: "id",
        },
        allowNull: false,
      },
      source_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "lead_sources",
          key: "id",
        },
        allowNull: false,
      },
      channel_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "lead_channels",
          key: "id",
        },
        allowNull: false,
      },
      region_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "regions",
          key: "id",
        },
        allowNull: false,
      },
      counsiler_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "admin_users",
          key: "id",
        },
        allowNull: false,
      },
      branch_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "branches",
          key: "id",
        },
        allowNull: false,
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "admin_users",
          key: "id",
        },
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    {
      underscored: true,
      tableName: "user_primary_info",
    }
  );

  return UserPrimaryInfo;
};
