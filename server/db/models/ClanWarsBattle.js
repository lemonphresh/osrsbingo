'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ClanWarsBattle extends Model {
    static associate(models) {
      ClanWarsBattle.belongsTo(models.ClanWarsEvent,      { foreignKey: 'eventId', as: 'event' });
      ClanWarsBattle.hasMany(models.ClanWarsBattleEvent,  { foreignKey: 'battleId', as: 'battleLog' });
    }
  }

  ClanWarsBattle.init(
    {
      battleId:          { type: DataTypes.STRING, primaryKey: true },
      eventId:           { type: DataTypes.STRING, allowNull: false },
      team1Id:           { type: DataTypes.STRING, allowNull: false },
      team2Id:           { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('WAITING', 'IN_PROGRESS', 'COMPLETED'),
        allowNull: false,
        defaultValue: 'WAITING',
      },
      championSnapshots: { type: DataTypes.JSONB, allowNull: true },
      battleState:       { type: DataTypes.JSONB, allowNull: true },
      rngSeed:           { type: DataTypes.STRING, allowNull: true },
      winnerId:          { type: DataTypes.STRING, allowNull: true },
      startedAt:         { type: DataTypes.DATE, allowNull: true },
      endedAt:           { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, modelName: 'ClanWarsBattle' }
  );

  return ClanWarsBattle;
};
