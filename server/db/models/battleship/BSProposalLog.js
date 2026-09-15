'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BSProposalLog extends Model {
    static associate(models) {
      BSProposalLog.belongsTo(models.BSEvent, { foreignKey: 'eventId', as: 'event' });
    }
  }

  BSProposalLog.init(
    {
      logId: { type: DataTypes.STRING, primaryKey: true },
      eventId: { type: DataTypes.STRING, allowNull: false },
      kind: {
        type: DataTypes.ENUM('SHOT', 'SKIP'),
        allowNull: false,
      },
      firingTeamId: { type: DataTypes.STRING, allowNull: false },
      targetTeamId: { type: DataTypes.STRING, allowNull: true },
      sourceProposalId: { type: DataTypes.STRING, allowNull: false, unique: true },
      row: { type: DataTypes.INTEGER, allowNull: true },
      col: { type: DataTypes.INTEGER, allowNull: true },
      tileId: { type: DataTypes.STRING, allowNull: true },
      tileLabel: { type: DataTypes.STRING, allowNull: true },
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
      threshold: { type: DataTypes.INTEGER, allowNull: false },
      finalStatus: {
        type: DataTypes.ENUM('APPROVED', 'REJECTED', 'EXPIRED', 'CLEARED'),
        allowNull: false,
      },
      proposedAt: { type: DataTypes.DATE, allowNull: false },
      resolvedAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      modelName: 'BSProposalLog',
      tableName: 'BattleshipProposalLog',
    }
  );

  return BSProposalLog;
};
