module.exports = (sequelize, Sequelize) => {
  const UserBasicInfo = sequelize.define(
    "user_basic_info",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      passport_no: {
        type: Sequelize.STRING(10),
        allowNull: true,
        unique: true,
      },
      dob: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // gender: {
      //   type: Sequelize.ENUM("Male", "Female", "Other"),
      //   allowNull: false,
      // },
      gender: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      marital_status: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "marital_statuses",
          key: "id",
        },
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "user_primary_info",
          key: "id",
        },
        allowNull: true,
      },
      nationality: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      secondary_number: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      emergency_contact_name: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      emergency_contact_relationship: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      emergency_contact_phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      concern_on_medical_condition: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      criminal_offence: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      criminal_offence_details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      concern_on_medical_condition_details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      police_clearance_docs: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
    },
    {
      underscored: true,
      tableName: "user_basic_info",
    }
  );

  return UserBasicInfo;
};
