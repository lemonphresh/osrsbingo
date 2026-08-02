'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CFTeam extends Model {
    static associate(models) {
      CFTeam.belongsTo(models.CFEvent,     { foreignKey: 'eventId', as: 'event' });
      CFTeam.hasMany(models.CFItem,        { foreignKey: 'teamId', as: 'items' });
      CFTeam.hasMany(models.CFSubmission,  { foreignKey: 'teamId', as: 'submissions' });
    }
  }

  CFTeam.init(
    {
      teamId:           { type: DataTypes.STRING, primaryKey: true },
      eventId:          { type: DataTypes.STRING, allowNull: false },
      teamName:         { type: DataTypes.STRING, allowNull: false },
      discordRoleId:    { type: DataTypes.STRING, allowNull: true },
      members:          { type: DataTypes.JSONB, allowNull: true },
      officialLoadout:  { type: DataTypes.JSONB, allowNull: true },
      loadoutLocked:    { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      captainDiscordId: { type: DataTypes.STRING, allowNull: true },
      completedTaskIds: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      taskProgress:        { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
      numericTaskProgress: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    },
    { sequelize, modelName: 'CFTeam', tableName: 'ClanWarsTeams' }
  );

  return CFTeam;
};
