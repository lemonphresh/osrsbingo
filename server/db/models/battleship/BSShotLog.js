'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BSShotLog extends Model {
    static associate(models) {
      BSShotLog.belongsTo(models.BSEvent, { foreignKey: 'eventId', as: 'event' });
    }
  }

  BSShotLog.init(
    {
      shotId:        { type: DataTypes.STRING, primaryKey: true },
      eventId:       { type: DataTypes.STRING, allowNull: false },
      firingTeamId:  { type: DataTypes.STRING, allowNull: false },
      targetBoardId: { type: DataTypes.STRING, allowNull: false },
      tileId:        { type: DataTypes.STRING, allowNull: false },
      row:           { type: DataTypes.INTEGER, allowNull: false },
      col:           { type: DataTypes.INTEGER, allowNull: false },
      result: {
        type: DataTypes.ENUM('HIT', 'MISS'),
        allowNull: false,
      },
      taskId: { type: DataTypes.STRING, allowNull: true },
      shotAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    { sequelize, modelName: 'BSShotLog', tableName: 'BattleshipShotLogs' }
  );

  return BSShotLog;
};
