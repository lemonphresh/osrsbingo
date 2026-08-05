'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BSTile extends Model {
    static associate(models) {
      BSTile.belongsTo(models.BSBoard, { foreignKey: 'boardId', as: 'board' });
      BSTile.belongsTo(models.BSTask,  { foreignKey: 'taskId',  as: 'task' });
    }
  }

  BSTile.init(
    {
      tileId:   { type: DataTypes.STRING, primaryKey: true },
      boardId:  { type: DataTypes.STRING, allowNull: false },
      row:      { type: DataTypes.INTEGER, allowNull: false },
      col:      { type: DataTypes.INTEGER, allowNull: false },
      shipType: {
        type: DataTypes.ENUM('CARRIER', 'BATTLESHIP', 'CRUISER', 'SUBMARINE', 'DESTROYER'),
        allowNull: true,
      },
      cellIndex:       { type: DataTypes.INTEGER, allowNull: true },
      taskId:          { type: DataTypes.STRING,  allowNull: true },
      isShot:          { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      taskCompleted:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      skipped:         { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      progress:        { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      shotAt:          { type: DataTypes.DATE, allowNull: true },
      taskCompletedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, modelName: 'BSTile', tableName: 'BattleshipTiles' }
  );

  return BSTile;
};
