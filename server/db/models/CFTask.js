'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CFTask extends Model {
    static associate(models) {
      CFTask.belongsTo(models.CFEvent, { foreignKey: 'eventId', as: 'event' });
    }
  }

  CFTask.init(
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
    { sequelize, modelName: 'CFTask', tableName: 'ClanWarsTasks' }
  );

  return CFTask;
};
