// TreasureNode.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class TreasureNode extends Model {
    static associate(models) {
      TreasureNode.belongsTo(models.TreasureEvent, {
        foreignKey: 'eventId',
        as: 'event',
      });
    }
  }

  TreasureNode.init(
    {
      nodeId: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      eventId: {
        type: DataTypes.STRING,
        references: {
          model: 'TreasureEvents',
          key: 'eventId',
        },
      },
      nodeType: DataTypes.ENUM('start', 'standard', 'inn', 'treasure'),
      title: DataTypes.STRING,
      description: DataTypes.TEXT,
      coordinates: DataTypes.JSONB,
      mapLocation: DataTypes.STRING,
      locationGroupId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment:
          'Groups multiple difficulty nodes at the same location. Teams can only complete one node per group.',
      },
      prerequisites: DataTypes.ARRAY(DataTypes.STRING),
      unlocks: DataTypes.ARRAY(DataTypes.STRING),
      paths: DataTypes.ARRAY(DataTypes.STRING),
      objective: DataTypes.JSONB,
      rewards: DataTypes.JSONB,
      difficultyTier: DataTypes.INTEGER,
      innTier: DataTypes.INTEGER,
      availableRewards: DataTypes.JSONB, // for inn nodes
    },
    {
      sequelize,
      modelName: 'TreasureNode',
    }
  );

  return TreasureNode;
};
