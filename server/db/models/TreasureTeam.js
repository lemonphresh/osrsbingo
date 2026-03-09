// TreasureTeam.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class TreasureTeam extends Model {
    static associate(models) {
      TreasureTeam.belongsTo(models.TreasureEvent, {
        foreignKey: 'eventId',
        as: 'event',
      });
      TreasureTeam.hasMany(models.TreasureSubmission, {
        foreignKey: 'teamId',
        as: 'submissions',
      });
    }
  }

  TreasureTeam.init(
    {
      teamId: {
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
      teamName: DataTypes.STRING,
      discordRoleId: DataTypes.STRING,
      members: DataTypes.ARRAY(DataTypes.STRING), // Discord IDs
      currentPot: {
        type: DataTypes.BIGINT,
        defaultValue: 0,
      },
      activeBuffs: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'Available buffs that can be applied to objectives',
      },
      buffHistory: {
        type: DataTypes.JSONB,
        defaultValue: [],
        comment: 'History of buff usage',
      },
      keysHeld: DataTypes.JSONB,
      completedNodes: DataTypes.ARRAY(DataTypes.STRING),
      availableNodes: DataTypes.ARRAY(DataTypes.STRING),
      innTransactions: DataTypes.JSONB,
      nodeNotes: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      nodeBuffs: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Per-node buff applications for this team, keyed by nodeId',
      },
      nodeProgress: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'Current progress toward each node objective, keyed by nodeId',
      },
      inProgressNodes: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        comment: 'Node IDs the team has bookmarked as actively in progress',
      },
      nodeUnlockTimes: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: 'ISO timestamp of when each node was unlocked, keyed by nodeId',
      },
    },
    {
      sequelize,
      modelName: 'TreasureTeam',
    }
  );

  return TreasureTeam;
};
