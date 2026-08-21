'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BSShipPlacement extends Model {
    static associate(models) {
      BSShipPlacement.belongsTo(models.BSBoard, { foreignKey: 'boardId', as: 'board' });
    }
  }

  BSShipPlacement.init(
    {
      placementId: { type: DataTypes.STRING, primaryKey: true },
      boardId:     { type: DataTypes.STRING, allowNull: false },
      shipType: {
        type: DataTypes.ENUM('CARRIER', 'BATTLESHIP', 'CRUISER', 'SUBMARINE', 'DESTROYER'),
        allowNull: false,
      },
      orientation: {
        type: DataTypes.ENUM('HORIZONTAL', 'VERTICAL'),
        allowNull: false,
      },
      startRow: { type: DataTypes.INTEGER, allowNull: false },
      startCol: { type: DataTypes.INTEGER, allowNull: false },
    },
    { sequelize, modelName: 'BSShipPlacement', tableName: 'BattleshipShipPlacements' }
  );

  return BSShipPlacement;
};
