'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BSShotProposal extends Model {
    static associate(models) {
      BSShotProposal.belongsTo(models.BSEvent, { foreignKey: 'eventId', as: 'event' });
      BSShotProposal.belongsTo(models.BSTeam, { foreignKey: 'firingTeamId', as: 'firingTeam' });
      BSShotProposal.belongsTo(models.BSTeam, { foreignKey: 'targetTeamId', as: 'targetTeam' });
    }
  }

  BSShotProposal.init(
    {
      proposalId: { type: DataTypes.STRING, primaryKey: true },
      eventId: { type: DataTypes.STRING, allowNull: false },
      firingTeamId: { type: DataTypes.STRING, allowNull: false, unique: true },
      targetTeamId: { type: DataTypes.STRING, allowNull: false },
      row: { type: DataTypes.INTEGER, allowNull: false },
      col: { type: DataTypes.INTEGER, allowNull: false },
      proposedBy: { type: DataTypes.STRING, allowNull: false },
      approvals: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      rejections: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      threshold: { type: DataTypes.INTEGER, allowNull: false },
      proposedAt: { type: DataTypes.DATE, allowNull: false },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      modelName: 'BSShotProposal',
      tableName: 'BattleshipShotProposals',
    }
  );

  return BSShotProposal;
};
