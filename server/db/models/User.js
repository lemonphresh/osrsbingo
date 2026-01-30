'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.BingoBoard, {
        foreignKey: 'userId',
        as: 'bingoBoards',
      });
      User.belongsToMany(models.BingoBoard, {
        through: 'BoardEditors',
        as: 'editorBoards',
        foreignKey: 'userId',
      });
      // invitations sent by this user
      User.hasMany(models.EditorInvitation, {
        foreignKey: 'inviterUserId',
        as: 'sentInvitations',
      });

      // invitations received by this user
      User.hasMany(models.EditorInvitation, {
        foreignKey: 'invitedUserId',
        as: 'receivedInvitations',
      });
    }
  }

  User.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      discordUserId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        comment: 'Discord user ID for linking Discord bot interactions',
      },
      discordUsername: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Discord username from OAuth',
      },
      discordAvatar: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Discord avatar hash for building CDN URL',
      },
      rsn: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      teams: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      displayName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'User',
    }
  );

  return User;
};
