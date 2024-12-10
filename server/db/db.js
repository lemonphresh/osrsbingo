const { Sequelize } = require('sequelize');

const dbUrl = process.env.DATABASE_URL || process.env.HEROKU_POSTGRESQL_BLUE_URL;

const sequelize = dbUrl
  ? new Sequelize(dbUrl, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: console.log,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    })
  : new Sequelize('osrsbingo', 'postgres', 'password', {
      host: 'localhost',
      dialect: 'postgres',
      logging: console.log,
    });

module.exports = sequelize;
