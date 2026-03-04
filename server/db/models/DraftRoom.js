'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class DraftRoom extends Model {
    static associate(models) {
      DraftRoom.belongsTo(models.User, {
        foreignKey: 'organizerUserId',
        as: 'organizer',
      });
      DraftRoom.hasMany(models.DraftPlayer, {
        foreignKey: 'roomId',
        as: 'players',
      });
    }
  }

  DraftRoom.init(
    {
      roomId: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      organizerUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
      },
      roomName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('LOBBY', 'DRAFTING', 'REVEALED', 'COMPLETED'),
        defaultValue: 'LOBBY',
      },
      draftFormat: {
        type: DataTypes.ENUM('SNAKE', 'LINEAR', 'AUCTION'),
        allowNull: false,
      },
      numberOfTeams: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      // [{index, name, captainToken, captainUserId, captainJoined, budget}]
      teams: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      // e.g. ['combatLevel','totalLevel','ehp','ehb','topBossKcs','slayerLevel']
      statCategories: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      // {ehpWeight, ehbWeight, totalLevelWeight} — null if no tier badges
      tierFormula: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      pickTimeSeconds: {
        type: DataTypes.INTEGER,
        defaultValue: 60,
      },
      picksPerTurn: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      currentPickIndex: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      // stored so clients can compute remaining time on reconnect
      currentPickStartedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      // Auction format only: {currentPlayerId, bids:{teamIndex:amount}, phase:'BIDDING'|'RESOLVED'}
      auctionState: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      // bcrypt-hashed PIN for captain join, null if no PIN required
      roomPin: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: 'DraftRoom',
    }
  );

  return DraftRoom;
};
