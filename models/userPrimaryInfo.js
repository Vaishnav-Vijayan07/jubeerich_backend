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
      lead_type_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "lead_types",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        allowNull: true,
      },
      source_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "lead_sources",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
        allowNull: true,
      },
      channel_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "lead_channels",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
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
      flag_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "flags",
          key: "id",
        },
        allowNull: true,
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      region_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "regions",
          key: "id",
        },
        allowNull: true,
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      assigned_cre_tl: {
        type: Sequelize.INTEGER,
        references: {
          model: "admin_users",
          key: "id",
        },
        allowNull: true,
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      assigned_counsellor_tl: {
        type: Sequelize.INTEGER,
        references: {
          model: "admin_users",
          key: "id",
        },
        allowNull: true,
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      assigned_branch_counselor: {
        type: Sequelize.INTEGER,
        references: {
          model: "admin_users",
          key: "id",
        },
        allowNull: true,
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      assigned_regional_manager: {
        type: Sequelize.INTEGER,
        references: {
          model: "admin_users",
          key: "id",
        },
        allowNull: true,
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      franchise_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "franchise",
          key: "id",
        },
        allowNull: true,
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      assigned_cre: {
        type: Sequelize.INTEGER,
        references: {
          model: "admin_users",
          key: "id",
        },
        allowNull: true,
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      branch_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "branches",
          key: "id",
        },
        allowNull: true,
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      status_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "status",
          key: "id",
        },
        allowNull: true,
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      ielts: {
        type: Sequelize.BOOLEAN,
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
        type: Sequelize.ENUM("direct_assign", "auto_assign"),
        allowNull: true,
      },
      remark_details: {
        type: Sequelize.JSONB,
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
          name: "idx_lead_type_id",
          fields: ["lead_type_id"],
        },
        {
          name: "idx_source_id",
          fields: ["source_id"],
        },
        {
          name: "idx_channel_id",
          fields: ["channel_id"],
        },
        {
          name: "idx_flag_id",
          fields: ["flag_id"],
        },
        {
          name: "idx_region_id",
          fields: ["region_id"],
        },
      ],
    }
  );

  return UserPrimaryInfo;
};
