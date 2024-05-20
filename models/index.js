const { Sequelize, DataTypes, Op }= require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(process.env.DB_dbname, process.env.DB_user, process.env.DB_pss, {
    dialect: "mysql",
    host: process.env.DB_host
});

db = {}
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Op = Op;

db.user = require('./user')(sequelize, Sequelize);

module.exports = db;