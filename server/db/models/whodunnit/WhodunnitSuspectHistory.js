'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class WhodunnitSuspectHistory extends Model {
    static associate(models) {
      WhodunnitSuspectHistory.belongsTo(models.WhodunnitCampaign, { foreignKey: 'campaignId', as: 'campaign' });
    }
  }

  WhodunnitSuspectHistory.init(
    {
      entryId:         { type: DataTypes.STRING, primaryKey: true },
      campaignId:      { type: DataTypes.STRING, allowNull: false },
      suspect:         { type: DataTypes.STRING, allowNull: false },
      updatedByUserId: { type: DataTypes.STRING, allowNull: false },
      updatedAt:       { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'WhodunnitSuspectHistory',
      tableName: 'WhodunnitSuspectHistory',
      timestamps: false,
    },
  );

  return WhodunnitSuspectHistory;
};
