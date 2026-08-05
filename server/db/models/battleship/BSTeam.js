'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BSTeam extends Model {
    static associate(models) {
      BSTeam.belongsTo(models.BSEvent, { foreignKey: 'eventId', as: 'event' });
      BSTeam.hasOne(models.BSBoard,    { foreignKey: 'teamId',  as: 'board' });
    }
  }

  BSTeam.init(
    {
      teamId:   { type: DataTypes.STRING, primaryKey: true },
      eventId:  { type: DataTypes.STRING, allowNull: false },
      teamName: { type: DataTypes.STRING, allowNull: false },
      color:    { type: DataTypes.STRING, allowNull: true },
      members: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      skipTokens:       { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      lastShotAt:       { type: DataTypes.DATE,    allowNull: true },
      discordChannelId: { type: DataTypes.STRING,  allowNull: true },
      discordRoleId:    { type: DataTypes.STRING,  allowNull: true },
    },
    { sequelize, modelName: 'BSTeam', tableName: 'BattleshipTeams' }
  );

  return BSTeam;
};
