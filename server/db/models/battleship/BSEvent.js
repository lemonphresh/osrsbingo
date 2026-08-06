'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BSEvent extends Model {
    static associate(models) {
      BSEvent.hasMany(models.BSTeam,         { foreignKey: 'eventId', as: 'teams' });
      BSEvent.hasMany(models.BSTask,         { foreignKey: 'eventId', as: 'tasks' });
      BSEvent.hasMany(models.BSShipTemplate, { foreignKey: 'eventId', as: 'shipTemplates' });
      BSEvent.hasMany(models.BSBoard,        { foreignKey: 'eventId', as: 'boards' });
      BSEvent.hasMany(models.BSShotLog,      { foreignKey: 'eventId', as: 'shots' });
    }
  }

  BSEvent.init(
    {
      eventId:             { type: DataTypes.STRING, primaryKey: true },
      eventName:           { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('DRAFT', 'PLACEMENT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      placementPhaseHours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 24 },
      cooldownMinutes:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
      initialSkipTokens:   { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
      placementStartsAt:   { type: DataTypes.DATE, allowNull: true },
      placementEndsAt:     { type: DataTypes.DATE, allowNull: true },
      creatorId:           { type: DataTypes.STRING, allowNull: true },
      adminIds: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      refIds: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      guildId:                { type: DataTypes.STRING, allowNull: true },
      announcementsChannelId: { type: DataTypes.STRING, allowNull: true },
      eventPassword:          { type: DataTypes.STRING, allowNull: true },
      winnerId:               { type: DataTypes.STRING, allowNull: true },
      completedAt:            { type: DataTypes.DATE,   allowNull: true },
    },
    { sequelize, modelName: 'BSEvent', tableName: 'BattleshipEvents' }
  );

  return BSEvent;
};
