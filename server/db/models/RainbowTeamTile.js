'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class RainbowTeamTile extends Model {
    static associate(models) {
      RainbowTeamTile.belongsTo(models.RainbowTeam, { foreignKey: 'teamId', as: 'team' });
    }
  }

  RainbowTeamTile.init(
    {
      teamTileId: { type: DataTypes.STRING, primaryKey: true },
      teamId:     { type: DataTypes.STRING, allowNull: false },
      eventId:    { type: DataTypes.STRING, allowNull: false },
      tileCode:   { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('LOCKED', 'UNLOCKED', 'SUBMITTED', 'COMPLETE'),
        allowNull: false,
        defaultValue: 'LOCKED',
      },
      progress:    { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      womBaseline: { type: DataTypes.FLOAT,   allowNull: true },
      unlockedAt:  { type: DataTypes.DATE, allowNull: true },
      completedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, modelName: 'RainbowTeamTile' },
  );

  return RainbowTeamTile;
};
