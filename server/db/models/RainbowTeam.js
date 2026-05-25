'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class RainbowTeam extends Model {
    static associate(models) {
      RainbowTeam.belongsTo(models.RainbowEvent,     { foreignKey: 'eventId', as: 'event' });
      RainbowTeam.hasMany(models.RainbowTeamTile,    { foreignKey: 'teamId',  as: 'tiles' });
      RainbowTeam.hasMany(models.RainbowSubmission,  { foreignKey: 'teamId',  as: 'submissions' });
    }
  }

  RainbowTeam.init(
    {
      teamId:            { type: DataTypes.STRING, primaryKey: true },
      eventId:           { type: DataTypes.STRING, allowNull: false },
      teamName:          { type: DataTypes.STRING, allowNull: false },
      discordChannelId:  { type: DataTypes.STRING, allowNull: false },
      captainDiscordId:  { type: DataTypes.STRING, allowNull: true },
      notes:             { type: DataTypes.TEXT,   allowNull: true },
    },
    { sequelize, modelName: 'RainbowTeam' },
  );

  return RainbowTeam;
};
