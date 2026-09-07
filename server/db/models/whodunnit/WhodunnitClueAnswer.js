'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class WhodunnitClueAnswer extends Model {
    static associate(models) {
      WhodunnitClueAnswer.belongsTo(models.WhodunnitCampaign, { foreignKey: 'campaignId', as: 'campaign' });
    }
  }

  WhodunnitClueAnswer.init(
    {
      answerId:          { type: DataTypes.STRING, primaryKey: true },
      campaignId:        { type: DataTypes.STRING, allowNull: false },
      nodeId:            { type: DataTypes.STRING, allowNull: false },
      clueId:            { type: DataTypes.STRING, allowNull: false },
      answer:            { type: DataTypes.TEXT, allowNull: false },
      correct:           { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      submittedByUserId: { type: DataTypes.STRING, allowNull: false },
      submittedAt:       { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'WhodunnitClueAnswer',
      tableName: 'WhodunnitClueAnswers',
      timestamps: false,
    },
  );

  return WhodunnitClueAnswer;
};
