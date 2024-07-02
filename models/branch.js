module.exports = (sequelize, Sequelize) => {
  const Branch = sequelize.define("branch", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    branch_name: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    email: {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: Sequelize.STRING(20),
      allowNull: false,
    },
    address: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    city: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    state: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    country: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    pincode: {
      type: Sequelize.STRING(20),
      allowNull: false,
    },
    contact_person_email: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    contact_person_name: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    contact_person_mobile: {
      type: Sequelize.STRING(20),
      allowNull: false,
    },
    contact_person_designation: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    website: {
      type: Sequelize.STRING(255),
    },
    social_media: {
      type: Sequelize.STRING(255),
    },
    account_mail: {
      type: Sequelize.STRING(255),
    },
    support_mail: {
      type: Sequelize.STRING(255),
    },
    office_type: {
      type: Sequelize.INTEGER,
      references: {
        model: "office_types",
        key: "id",
      },
      allowNull: true,
    },
    region_id: {
      type: Sequelize.INTEGER,
      references: {
        model: "regions",
        key: "id",
      },
      allowNull: true,
    },
    updated_by: {
      type: Sequelize.INTEGER,
    },
    status: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  });

  return Branch;
};
