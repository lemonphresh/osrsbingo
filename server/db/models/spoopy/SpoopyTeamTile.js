'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SpoopyTeamTile extends Model {
    static associate(models) {
      SpoopyTeamTile.belongsTo(models.SpoopyTeam, { foreignKey: 'teamId', as: 'team' });
    }
  }

  SpoopyTeamTile.init(
    {
      teamTileId:   { type: DataTypes.STRING, primaryKey: true },
      teamId:       { type: DataTypes.STRING, allowNull: false },
      eventId:      { type: DataTypes.STRING, allowNull: false },
      tileId:       { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('locked', 'unlocked', 'submitted', 'complete'),
        allowNull: false,
        defaultValue: 'locked',
      },
      choice:       { type: DataTypes.STRING, allowNull: true },   // 'a' | 'b' | null (house tiles only)
      outcome:      { type: DataTypes.STRING, allowNull: true },   // 'trick' | 'treat' | null
      submissionId: { type: DataTypes.STRING, allowNull: true },
      completedAt:  { type: DataTypes.DATE,   allowNull: true },
      rewardEarned: { type: DataTypes.INTEGER, allowNull: true },
      progress:     { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    {
      sequelize,
      modelName: 'SpoopyTeamTile',
      indexes: [{ fields: ['teamId', 'tileId'], unique: true }],
    },
  );

  return SpoopyTeamTile;
};
