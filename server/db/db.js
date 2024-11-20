const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('osrsbingo', 'postgres', 'password', {
  host: 'localhost',
  dialect: 'postgres',
  logging: console.log, // Enable SQL query logging
});

module.exports = sequelize;
