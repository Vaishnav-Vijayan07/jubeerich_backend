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
        allowNull: true,
      },
      lead_type_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "lead_types",
          key: "id",
        },
        allowNull: true,
      },
      source_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "lead_sources",
          key: "id",
        },
        allowNull: true,
      },
      channel_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "lead_channels",
          key: "id",
        },
        allowNull: true,
      },
      city: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      zipcode: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      office_type: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "office_types",
          key: "id",
        },
      },
      region_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "regions",
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
      assigned_cre_tl: {
        type: Sequelize.INTEGER,
        references: {
          model: "admin_users",
          key: "id",
        },
        allowNull: true,
      },
      assigned_regional_manager: {
        type: Sequelize.INTEGER,
        references: {
          model: "admin_users",
          key: "id",
        },
        allowNull: true,
      },
      franchise_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "franchise",
          key: "id",
        },
        allowNull: true,
      },
      assigned_cre: {
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
      status_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "status",
          key: "id",
        },
        allowNull: true,
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      ielts: {
        type: Sequelize.STRING,
        defaultValue: false,
        allowNull: true,
      },
      remarks: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      lead_received_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      followup_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      assign_type: {
        type: Sequelize.ENUM('direct_assign', 'auto_assign'),
        allowNull: true,
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
          name: "office_type_index",
          fields: ["office_type"],
        },
        {
          name: "region_id_index",
          fields: ["region_id"],
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
