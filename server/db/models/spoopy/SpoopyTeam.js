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
    },
    { sequelize, modelName: 'SpoopyTeam' },
  );

  return SpoopyTeam;
};
