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
db.leadCategory = require("./leadCategory")(sequelize, Sequelize);
db.leadChannel = require("./leadChannel")(sequelize, Sequelize);
db.leadSource = require("./leadSource")(sequelize, Sequelize);
db.officeType = require("./officeType")(sequelize, Sequelize);
db.region = require("./region")(sequelize, Sequelize);
db.flag = require("./flag")(sequelize, Sequelize);
db.maritalStatus = require("./maritalStatus")(sequelize, Sequelize);
db.country = require("./country")(sequelize, Sequelize);
db.university = require("./university")(sequelize, Sequelize);
db.programs = require("./programs")(sequelize, Sequelize);
db.branches = require("./branch")(sequelize, Sequelize);
db.userPrimaryInfo = require("./userPrimaryInfo")(sequelize, Sequelize);
db.userBasicInfo = require("./userBasicInfo")(sequelize, Sequelize);
db.userAcademicInfo = require("./userAcademicInfo")(sequelize, Sequelize);
db.userStudyPreference = require("./userStudyPreference")(sequelize, Sequelize);

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

db.leadChannel.belongsTo(db.leadSource, { foreignKey: "source_id", as: "source" });

// User associations
db.userPrimaryInfo.hasOne(db.userStudyPreference, { foreignKey: "user_id", as: "studyPreference" });
db.userPrimaryInfo.hasOne(db.userBasicInfo, { foreignKey: "user_id", as: "basicInfo" });
db.userPrimaryInfo.hasOne(db.userAcademicInfo, { foreignKey: "user_id", as: "academicInfo" });

db.userStudyPreference.belongsTo(db.userBasicInfo, { foreignKey: "user_id", as: "user" });
db.userAcademicInfo.belongsTo(db.userBasicInfo, { foreignKey: "user_id", as: "user" });

module.exports = db;
