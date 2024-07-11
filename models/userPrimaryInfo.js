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
      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
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
      city: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      preferred_country: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "countries",
          key: "id",
        },
      },
      office_type: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "office_types",
          key: "id",
        },
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "admin_users",
          key: "id",
        },
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "admin_users",
          key: "id",
        },
      },
      region_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "regions",
          key: "id",
        },
        allowNull: true,
      },
      counsiler_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "admin_users",
          key: "id",
        },
        allowNull: true,
      },
      branch_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "branches",
          key: "id",
        },
        allowNull: true,
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lead_received_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
    },
    {
      underscored: true,
      tableName: "user_primary_info",
      indexes: [
        {
          name: "email_unique",
          unique: true,
          fields: ["email"],
        },
        {
          name: "phone_unique",
          unique: true,
          fields: ["phone"],
        },
        {
          name: "category_id_index",
          fields: ["category_id"],
        },
        {
          name: "source_id_index",
          fields: ["source_id"],
        },
        {
          name: "channel_id_index",
          fields: ["channel_id"],
        },
        {
          name: "preferred_country_index",
          fields: ["preferred_country"],
        },
        {
          name: "office_type_index",
          fields: ["office_type"],
        },
        {
          name: "region_id_index",
          fields: ["region_id"],
        },
        {
          name: "counsiler_id_index",
          fields: ["counsiler_id"],
        },
        {
          name: "branch_id_index",
          fields: ["branch_id"],
        },
        {
          name: "updated_by_index",
          fields: ["updated_by"],
        },
      ],
    }
  );

  return UserPrimaryInfo;
};
