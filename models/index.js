const { Sequelize, DataTypes, Op } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const sequelize = new Sequelize(process.env.DB_dbname, process.env.DB_user, process.env.DB_pss, {
  dialect: "postgres",
  host: process.env.DB_host,
  port: process.env.DB_port, // Ensure you have DB_port in your .env file for PostgreSQL
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Op = Op;

db.adminUsers = require("./adminUsers")(sequelize, Sequelize);
db.accessRoles = require("./accessRoles")(sequelize, Sequelize);
db.accessPowers = require("./accessPowers")(sequelize, Sequelize);

db.adminUsers.belongsTo(db.accessRoles, { foreignKey: "role_id" });
db.accessRoles.belongsTo(db.adminUsers, {
  foreignKey: "updated_by",
  as: "updatedByUser",
});

db.accessRoles.belongsToMany(db.accessPowers, {
  through: "accessRolePowers",
  as: "powers",
  foreignKey: "role_id",
});

db.accessPowers.belongsToMany(db.accessRoles, {
  through: "accessRolePowers",
  as: "roles",
  foreignKey: "power_id",
});
module.exports = db;
