'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SpoopyEvent extends Model {
    static associate(models) {
      SpoopyEvent.hasMany(models.SpoopyTeam,       { foreignKey: 'eventId', as: 'teams' });
      SpoopyEvent.hasMany(models.SpoopySubmission, { foreignKey: 'eventId', as: 'submissions' });
    }
  }

  SpoopyEvent.init(
    {
      eventId:          { type: DataTypes.STRING, primaryKey: true },
      eventName:        { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('SETUP', 'ACTIVE', 'COMPLETE'),
        allowNull: false,
        defaultValue: 'SETUP',
      },
      curfewStart:      { type: DataTypes.DATE,   allowNull: true },
      curfewEnd:        { type: DataTypes.DATE,   allowNull: true },
      adminIds:         { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
      staffChannelId:   { type: DataTypes.STRING, allowNull: true },
      // Board layout + tile adjacency, produced by spoopyBoardImporter.parseBoard.
      board:            { type: DataTypes.JSONB,  allowNull: false, defaultValue: { dimensions: { rows: 0, cols: 0 }, tiles: [], candybagTileId: null } },
      // Per-tile content keyed by tile id, produced by spoopyContentImporter.parseContent.
      contentById:      { type: DataTypes.JSONB,  allowNull: false, defaultValue: {} },
      // Haunted-house warning tiers, bonus task, and bonus gp reward.
      hauntedHouse:     { type: DataTypes.JSONB,  allowNull: true },
      startingTileIds:  { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
    },
    { sequelize, modelName: 'SpoopyEvent' },
  );

  return SpoopyEvent;
};
