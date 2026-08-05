'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BSTask extends Model {
    static associate(models) {
      BSTask.belongsTo(models.BSEvent, { foreignKey: 'eventId', as: 'event' });
    }
  }

  BSTask.init(
    {
      taskId:      { type: DataTypes.STRING, primaryKey: true },
      eventId:     { type: DataTypes.STRING, allowNull: false },
      label:       { type: DataTypes.STRING, allowNull: false },
      bossOrSkill: { type: DataTypes.STRING, allowNull: true },
      metricType:  { type: DataTypes.STRING, allowNull: true },
      metricTarget:{ type: DataTypes.INTEGER, allowNull: true },
      metricUnit:  { type: DataTypes.STRING, allowNull: true },
      metricLabel: { type: DataTypes.STRING, allowNull: true },
      validDrops:  { type: DataTypes.ARRAY(DataTypes.TEXT), allowNull: false, defaultValue: [] },
      womMetric:   { type: DataTypes.STRING, allowNull: true },
      description: { type: DataTypes.TEXT,   allowNull: true },
      isActive:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { sequelize, modelName: 'BSTask', tableName: 'BattleshipTasks' }
  );

  return BSTask;
};
