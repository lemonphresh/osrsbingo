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
      eventPassword:    { type: DataTypes.STRING, allowNull: true },
      adminIds:         { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
      staffChannelId:   { type: DataTypes.STRING, allowNull: true },
      // Board layout + tile adjacency, produced by spoopyBoardImporter.parseBoard.
      board:            { type: DataTypes.JSONB,  allowNull: false, defaultValue: { dimensions: { rows: 0, cols: 0 }, tiles: [], candybagTileId: null } },
      // Per-tile content keyed by tile id, produced by spoopyContentImporter.parseContent.
      contentById:      { type: DataTypes.JSONB,  allowNull: false, defaultValue: {} },
      // Haunted-house warning tiers, bonus task, and bonus gp reward.
      hauntedHouse:     { type: DataTypes.JSONB,  allowNull: true },
      startingTileIds:  { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
      // Total gp budget for house rewards, editable while status=SETUP.
      // Split evenly across teams at SETUP→ACTIVE, then across each team's
      // houses. Haunted house pays 3× the per-house amount on top.
      prizePool:        { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      // WOM team competition id. When set, a background sync auto-fills
      // progress on skilling_xp / boss_kc tiles from the PRE-screenshot
      // approval time → now. Roster match is by team name (must equal the
      // team name on the WOM side) — same as rainbow bingo.
      womCompetitionId: { type: DataTypes.STRING, allowNull: true },
      // Last successful WOM sync; used to enforce a per-event cooldown so
      // we don't hammer the WOM API when refs / cron all fire together.
      lastWomSyncAt:    { type: DataTypes.DATE,   allowNull: true },
    },
    { sequelize, modelName: 'SpoopyEvent' },
  );

  return SpoopyEvent;
};
