const { Sequelize } = require('sequelize');

const dbUrl = process.env.DATABASE_URL;
const isDev = process.env.NODE_ENV === 'development';

const sharedOptions = {
  dialect: 'postgres',
  benchmark: true,
  logging: isDev ? (sql, timing) => console.log(`[${timing}ms] ${sql}`) : false,
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
};

const isRemoteDb = dbUrl && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');

const sequelize = dbUrl
  ? new Sequelize(dbUrl, {
      ...sharedOptions,
      protocol: 'postgres',
      dialectOptions: {
        ssl: isRemoteDb ? { require: true, rejectUnauthorized: false } : false,
      },
    })
  : new Sequelize('osrsbingo', 'lemon', null, {
      ...sharedOptions,
      host: 'localhost',
    });

module.exports = sequelize;
