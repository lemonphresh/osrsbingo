'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class WhodunnitNodeProgress extends Model {
    static associate(models) {
      WhodunnitNodeProgress.belongsTo(models.WhodunnitCampaign, { foreignKey: 'campaignId', as: 'campaign' });
    }
  }

  WhodunnitNodeProgress.init(
    {
      progressId:      { type: DataTypes.STRING, primaryKey: true },
      campaignId:      { type: DataTypes.STRING, allowNull: false },
      nodeId:          { type: DataTypes.STRING, allowNull: false },
      startedAt:       { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      endedAt:         { type: DataTypes.DATE, allowNull: true },
      // Array of clue IDs that used a hint on this node.
      hintUsedClueIds: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    },
    {
      sequelize,
      modelName: 'WhodunnitNodeProgress',
      tableName: 'WhodunnitNodeProgress',
    },
  );

  return WhodunnitNodeProgress;
};
