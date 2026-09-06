'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class WhodunnitTeamMember extends Model {
    static associate(models) {
      WhodunnitTeamMember.belongsTo(models.WhodunnitCampaign, { foreignKey: 'campaignId', as: 'campaign' });
    }
  }

  WhodunnitTeamMember.init(
    {
      memberId:   { type: DataTypes.STRING, primaryKey: true },
      campaignId: { type: DataTypes.STRING, allowNull: false },
      userId:     { type: DataTypes.STRING, allowNull: false },
      isCreator:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      joinedAt:   { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'WhodunnitTeamMember',
      tableName: 'WhodunnitTeamMembers',
      timestamps: false,
    },
  );

  return WhodunnitTeamMember;
};
