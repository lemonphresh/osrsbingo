'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class WhodunnitCampaign extends Model {
    static associate(models) {
      WhodunnitCampaign.hasMany(models.WhodunnitTeamMember,     { foreignKey: 'campaignId', as: 'members' });
      WhodunnitCampaign.hasMany(models.WhodunnitNodeProgress,   { foreignKey: 'campaignId', as: 'nodeProgress' });
      WhodunnitCampaign.hasMany(models.WhodunnitClueAnswer,     { foreignKey: 'campaignId', as: 'answers' });
      WhodunnitCampaign.hasMany(models.WhodunnitSuspectHistory, { foreignKey: 'campaignId', as: 'suspectHistory' });
    }
  }

  WhodunnitCampaign.init(
    {
      campaignId:      { type: DataTypes.STRING, primaryKey: true },
      agencyName:      { type: DataTypes.STRING, allowNull: false },
      createdByUserId: { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'COMPLETE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      currentNodeId:   { type: DataTypes.STRING, allowNull: false, defaultValue: 'intro' },
      choiceAPath: {
        type: DataTypes.ENUM('A1', 'A2'),
        allowNull: true,
      },
      choiceBPath: {
        type: DataTypes.ENUM('B1', 'B2'),
        allowNull: true,
      },
      primeSuspect:    { type: DataTypes.STRING, allowNull: true },
      completedAt:     { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: 'WhodunnitCampaign',
      tableName: 'WhodunnitCampaigns',
    },
  );

  return WhodunnitCampaign;
};
