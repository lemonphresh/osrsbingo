'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SpoopyTeam extends Model {
    static associate(models) {
      SpoopyTeam.belongsTo(models.SpoopyEvent,     { foreignKey: 'eventId', as: 'event' });
      SpoopyTeam.hasMany(models.SpoopyTeamTile,    { foreignKey: 'teamId',  as: 'tiles' });
      SpoopyTeam.hasMany(models.SpoopySubmission,  { foreignKey: 'teamId',  as: 'submissions' });
    }
  }

  SpoopyTeam.init(
    {
      teamId:            { type: DataTypes.STRING, primaryKey: true },
      eventId:           { type: DataTypes.STRING, allowNull: false },
      teamName:          { type: DataTypes.STRING, allowNull: false },
      color:             { type: DataTypes.STRING, allowNull: true },
      members:           { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
      discordChannelId:  { type: DataTypes.STRING, allowNull: false },
      discordRoleId:     { type: DataTypes.STRING, allowNull: true },
      teamToken:         { type: DataTypes.STRING(16), allowNull: true },
      gpEarned:          { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      cashedOut:         { type: DataTypes.JSONB,   allowNull: true },  // null | { at, bonusEarned, forfeited }
      // 0 = fresh; 1 after !stepinside; 2 after !imserious; 3 after !nogoingback.
      // Only at 3 can the team run !spoopysubmit <candybagId>. Any other
      // spoopy command sent while 1 or 2 knocks it back to 0.
      hauntedGauntletLevel: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      // Frozen share of event.prizePool set at SETUP→ACTIVE. Every trick-or-
      // treat house pays `poolAllocation / houseCount`; the haunted house
      // pays 3× that on top. Locked at activation so teams added mid-event
      // (currently impossible while ACTIVE, but a safe invariant) can't
      // dilute already-earned rewards.
      poolAllocation:    { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { sequelize, modelName: 'SpoopyTeam' },
  );

  return SpoopyTeam;
};
