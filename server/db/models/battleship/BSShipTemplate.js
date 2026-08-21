'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BSShipTemplate extends Model {
    static associate(models) {
      BSShipTemplate.belongsTo(models.BSEvent, { foreignKey: 'eventId', as: 'event' });
      BSShipTemplate.belongsTo(models.BSTask,  { foreignKey: 'taskId',  as: 'task' });
    }
  }

  BSShipTemplate.init(
    {
      templateId: { type: DataTypes.STRING, primaryKey: true },
      eventId:    { type: DataTypes.STRING, allowNull: false },
      shipType: {
        type: DataTypes.ENUM('CARRIER', 'BATTLESHIP', 'CRUISER', 'SUBMARINE', 'DESTROYER'),
        allowNull: false,
      },
      cellIndex: { type: DataTypes.INTEGER, allowNull: false },
      taskId:    { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, modelName: 'BSShipTemplate', tableName: 'BattleshipShipTemplates' }
  );

  return BSShipTemplate;
};
