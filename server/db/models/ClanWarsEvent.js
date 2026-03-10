'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ClanWarsEvent extends Model {
    static associate(models) {
      ClanWarsEvent.hasMany(models.ClanWarsTeam,       { foreignKey: 'eventId', as: 'teams' });
      ClanWarsEvent.hasMany(models.ClanWarsItem,       { foreignKey: 'eventId', as: 'items' });
      ClanWarsEvent.hasMany(models.ClanWarsSubmission, { foreignKey: 'eventId', as: 'submissions' });
      ClanWarsEvent.hasMany(models.ClanWarsBattle,     { foreignKey: 'eventId', as: 'battles' });
      ClanWarsEvent.hasMany(models.ClanWarsTask,       { foreignKey: 'eventId', as: 'tasks' });
    }
  }

  ClanWarsEvent.init(
    {
      eventId:   { type: DataTypes.STRING, primaryKey: true },
      clanId:    { type: DataTypes.STRING, allowNull: true },
      eventName: { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('DRAFT', 'GATHERING', 'OUTFITTING', 'BATTLE', 'COMPLETED', 'ARCHIVED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
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
      seed:    { type: DataTypes.STRING, allowNull: true },
      guildId: { type: DataTypes.STRING, allowNull: true },
      difficulty: {
        type: DataTypes.ENUM('casual', 'standard', 'hardcore'),
        allowNull: false,
        defaultValue: 'standard',
      },
    },
    { sequelize, modelName: 'ClanWarsEvent' }
  );

  return ClanWarsEvent;
};
