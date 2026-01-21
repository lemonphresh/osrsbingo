const { Sequelize } = require('sequelize');

const dbUrl = process.env.DATABASE_URL;

const sequelize = dbUrl
  ? new Sequelize(dbUrl, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      benchmark: true,
      hooks: {
        afterQuery: (options, query) => {
          if (options.benchmark && query.duration > 1000) {
            console.warn(`🐢 Slow query (${query.duration}ms):`, options.type);
          }
        },
      },
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
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    });

module.exports = sequelize;
