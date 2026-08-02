// GREvent.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class GREvent extends Model {
    static associate(models) {
      GREvent.belongsTo(models.User, {
        foreignKey: 'creatorId',
        as: 'creator',
      });
      GREvent.hasMany(models.GRTeam, {
        foreignKey: 'eventId',
        as: 'teams',
      });
      GREvent.hasMany(models.GRNode, {
        foreignKey: 'eventId',
        as: 'nodes',
      });
    }
  }

  GREvent.init(
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
      startMessageSent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
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
      modelName: 'GREvent',
      tableName: 'TreasureEvents',
    }
  );

  return GREvent;
};
