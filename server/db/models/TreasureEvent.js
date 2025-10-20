// TreasureEvent.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class TreasureEvent extends Model {
    static associate(models) {
      TreasureEvent.belongsTo(models.User, {
        foreignKey: 'creatorId',
        as: 'creator',
      });
      TreasureEvent.hasMany(models.TreasureTeam, {
        foreignKey: 'eventId',
        as: 'teams',
      });
      TreasureEvent.hasMany(models.TreasureNode, {
        foreignKey: 'eventId',
        as: 'nodes',
      });
    }
  }

  TreasureEvent.init(
    {
      eventId: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      clanId: DataTypes.STRING,
      eventName: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM('draft', 'active', 'completed', 'archived'),
        defaultValue: 'draft',
      },
      startDate: DataTypes.DATE,
      endDate: DataTypes.DATE,
      eventConfig: DataTypes.JSONB, // stores the config object
      derivedValues: DataTypes.JSONB,
      mapStructure: DataTypes.JSONB, // stores paths, edges
      discordConfig: DataTypes.JSONB,
      creatorId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
    },
    {
      sequelize,
      modelName: 'TreasureEvent',
    }
  );

  return TreasureEvent;
};
