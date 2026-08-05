'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BSBoard extends Model {
    static associate(models) {
      BSBoard.belongsTo(models.BSEvent, { foreignKey: 'eventId', as: 'event' });
      BSBoard.belongsTo(models.BSTeam,  { foreignKey: 'teamId',  as: 'team' });
      BSBoard.hasMany(models.BSShipPlacement, { foreignKey: 'boardId', as: 'shipPlacements' });
      BSBoard.hasMany(models.BSTile,          { foreignKey: 'boardId', as: 'tiles' });
    }
  }

  BSBoard.init(
    {
      boardId:           { type: DataTypes.STRING, primaryKey: true },
      eventId:           { type: DataTypes.STRING, allowNull: false },
      teamId:            { type: DataTypes.STRING, allowNull: false },
      isPlacementLocked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { sequelize, modelName: 'BSBoard', tableName: 'BattleshipBoards' }
  );

  return BSBoard;
};
