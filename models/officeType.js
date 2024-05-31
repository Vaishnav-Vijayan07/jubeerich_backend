module.exports = (sequelize, Sequelize) => {
  const OfficeType = sequelize.define("office_type", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    office_type_name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    office_type_description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    updated_by: {
      type: Sequelize.INTEGER,
    },
  });

  return OfficeType;
};
