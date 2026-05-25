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
        type: DataTypes.ENUM('LOCKED', 'UNLOCKED', 'PRE_SUBMITTED', 'PRE_APPROVED', 'SUBMITTED', 'COMPLETE', 'DENIED'),
        allowNull: false,
        defaultValue: 'LOCKED',
      },
      unlockedAt:          { type: DataTypes.DATE,   allowNull: true },
      completedAt:         { type: DataTypes.DATE,   allowNull: true },
      activeSubmissionId:  { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, modelName: 'RainbowTeamTile' },
  );

  return RainbowTeamTile;
};
