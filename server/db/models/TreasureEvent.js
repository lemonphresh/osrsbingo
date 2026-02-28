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
        type: DataTypes.ENUM('draft', 'PUBLIC', 'completed', 'archived'),
        defaultValue: 'draft',
      },
      startDate: DataTypes.DATE,
      endDate: DataTypes.DATE,
      eventConfig: DataTypes.JSONB, // stores the config object
      derivedValues: DataTypes.JSONB,
      mapStructure: DataTypes.JSONB, // stores paths, edges
      discordConfig: DataTypes.JSONB,
      contentSelections: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      creatorId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      eventPassword: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      adminIds: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        defaultValue: [],
        comment: 'Array of user IDs who have admin access to this event',
      },
      refIds: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        defaultValue: [],
        comment: 'Array of user IDs who have ref access to this event',
      },
      lastMapGeneratedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: 'TreasureEvent',
    }
  );

  return TreasureEvent;
};
