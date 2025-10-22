'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SiteStats extends Model {}

  SiteStats.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      visitCount: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'SiteStats',
      tableName: 'SiteStats',
      timestamps: true,
    }
  );

  return SiteStats;
};
