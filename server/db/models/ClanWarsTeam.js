'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ClanWarsTeam extends Model {
    static associate(models) {
      ClanWarsTeam.belongsTo(models.ClanWarsEvent,     { foreignKey: 'eventId', as: 'event' });
      ClanWarsTeam.hasMany(models.ClanWarsItem,        { foreignKey: 'teamId', as: 'items' });
      ClanWarsTeam.hasMany(models.ClanWarsSubmission,  { foreignKey: 'teamId', as: 'submissions' });
    }
  }

  ClanWarsTeam.init(
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
    { sequelize, modelName: 'ClanWarsTeam' }
  );

  return ClanWarsTeam;
};
