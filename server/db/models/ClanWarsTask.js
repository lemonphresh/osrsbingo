'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ClanWarsTask extends Model {
    static associate(models) {
      ClanWarsTask.belongsTo(models.ClanWarsEvent, { foreignKey: 'eventId', as: 'event' });
    }
  }

  ClanWarsTask.init(
    {
      taskId:      { type: DataTypes.STRING, primaryKey: true },
      eventId:     { type: DataTypes.STRING, allowNull: false },
      label:       { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.STRING, allowNull: true },
      difficulty: {
        type: DataTypes.ENUM('initiate', 'adept', 'master'),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('SKILLER', 'PVMER'),
        allowNull: false,
      },
      isActive:        { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      acceptableItems: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
      quantity:        { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    },
    { sequelize, modelName: 'ClanWarsTask' }
  );

  return ClanWarsTask;
};
