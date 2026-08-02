'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CFEvent extends Model {
    static associate(models) {
      CFEvent.hasMany(models.CFTeam,       { foreignKey: 'eventId', as: 'teams' });
      CFEvent.hasMany(models.CFItem,       { foreignKey: 'eventId', as: 'items' });
      CFEvent.hasMany(models.CFSubmission, { foreignKey: 'eventId', as: 'submissions' });
      CFEvent.hasMany(models.CFBattle,     { foreignKey: 'eventId', as: 'battles' });
      CFEvent.hasMany(models.CFTask,          { foreignKey: 'eventId', as: 'tasks' });
      CFEvent.hasMany(models.CFPreScreenshot, { foreignKey: 'eventId', as: 'preScreenshots' });
    }
  }

  CFEvent.init(
    {
      eventId:   { type: DataTypes.STRING, primaryKey: true },
      clanId:    { type: DataTypes.STRING, allowNull: true },
      eventName: { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('DRAFT', 'GATHERING', 'OUTFITTING', 'BATTLE', 'COMPLETED', 'ARCHIVED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      scheduledGatheringStart: { type: DataTypes.DATE, allowNull: true },
      gatheringStart: { type: DataTypes.DATE, allowNull: true },
      gatheringEnd:   { type: DataTypes.DATE, allowNull: true },
      outfittingEnd:  { type: DataTypes.DATE, allowNull: true },
      eventConfig:    { type: DataTypes.JSONB, allowNull: true },
      bracket:        { type: DataTypes.JSONB, allowNull: true },
      creatorId:      { type: DataTypes.STRING, allowNull: true },
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
      seed:          { type: DataTypes.STRING, allowNull: true },
      guildId:                { type: DataTypes.STRING, allowNull: true },
      announcementsChannelId: { type: DataTypes.STRING, allowNull: true },
      eventPassword: { type: DataTypes.STRING(30), allowNull: true },
      difficulty: {
        type: DataTypes.ENUM('casual', 'standard', 'hardcore'),
        allowNull: false,
        defaultValue: 'standard',
      },
    },
    { sequelize, modelName: 'CFEvent', tableName: 'ClanWarsEvents' }
  );

  return CFEvent;
};
