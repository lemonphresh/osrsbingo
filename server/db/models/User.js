const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rsn: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  //   //   permissions: {
  //   //     type: DataTypes.JSONB,
  //   //     allowNull: true,
  //   //   },
  //   teams: {
  //     type: DataTypes.JSONB,
  //     allowNull: true,
  //   },
});

sequelize.sync({ alter: true }).catch((error) => {
  console.error('Error during database synchronization:', error);
});

module.exports = User;
