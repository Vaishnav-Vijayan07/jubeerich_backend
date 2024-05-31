module.exports = (sequelize, Sequelize) => {
  const Program = sequelize.define("program", {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    program_name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    university_id: {
      type: Sequelize.INTEGER,
      references: {
        model: "universities",
        key: "id",
      },
      onDelete: "SET NULL",
    },
    degree_level: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    duration: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    tuition_fees: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
  });

  return Program;
};
