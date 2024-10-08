module.exports = (sequelize, Sequelize) => {
  const FamilyInformation = sequelize.define(
    "family_information",
    {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "user_primary_info",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      father: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      mother: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      number_of_siblings: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      siblings_info: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      number_of_children: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      children_info: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      spouse: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      accompanying_spouse: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      accompanying_child: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      relatives_info: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    },
    {
      underscored: true,
      tableName: "family_information",
    }
  );

  return FamilyInformation;
};
