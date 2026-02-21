const { Sequelize } = require('sequelize');

const dbUrl = process.env.DATABASE_URL;
const isDev = process.env.NODE_ENV === 'development';

const sharedOptions = {
  dialect: 'postgres',
  benchmark: true,
  logging: (sql, timing) => {
    if (isDev) {
      console.log(`[${timing}ms] ${sql}`);
    } else {
      if (timing > 1000) {
        console.error(`🔴 Critical slow query (${timing}ms):`, sql.substring(0, 300));
      } else if (timing > 500) {
        console.warn(`🐢 Slow query (${timing}ms):`, sql.substring(0, 200));
      } else if (timing > 200) {
        console.log(`🟡 Medium query (${timing}ms):`, sql.substring(0, 100));
      }
    }
  },
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
};

const sequelize = dbUrl
  ? new Sequelize(dbUrl, {
      ...sharedOptions,
      protocol: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    })
  : new Sequelize('osrsbingo', 'postgres', 'password', {
      ...sharedOptions,
      host: 'localhost',
    });

module.exports = sequelize;
