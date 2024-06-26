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
db.tasks = require("./task")(sequelize, Sequelize);
db.userBranches = require("./userBranches")(sequelize, Sequelize);

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

//lead associations
db.userPrimaryInfo.belongsTo(db.leadCategory, { as: "category_name", foreignKey: "category_id" });
db.userPrimaryInfo.belongsTo(db.leadSource, { as: "source_name", foreignKey: "source_id" });
db.userPrimaryInfo.belongsTo(db.leadChannel, { as: "channel_name", foreignKey: "channel_id" });
db.userPrimaryInfo.belongsTo(db.country, { as: "country_name", foreignKey: "preferred_country" });
db.userPrimaryInfo.belongsTo(db.officeType, { as: "office_type_name", foreignKey: "office_type" });
db.userPrimaryInfo.belongsTo(db.region, { as: "region_name", foreignKey: "region" });
db.userPrimaryInfo.belongsTo(db.adminUsers, { as: "counsiler_name", foreignKey: "counsiler_id" });
db.userPrimaryInfo.belongsTo(db.branches, { as: "branch_name", foreignKey: "branch_id" });

db.tasks.belongsTo(db.userPrimaryInfo, { as: "student_name", foreignKey: "studentId" });
db.tasks.belongsTo(db.adminUsers, { as: "user_name", foreignKey: "userId" });

// In adminUsers model
db.adminUsers.hasMany(db.tasks, { foreignKey: 'userId' });

// In tasks model
db.tasks.belongsTo(db.adminUsers, { foreignKey: 'userId' });


module.exports = db;
