'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class EditorInvitation extends Model {
    static associate(models) {
      // Define relationships
      EditorInvitation.belongsTo(models.BingoBoard, {
        foreignKey: 'boardId',
        as: 'boardDetails',
        onDelete: 'CASCADE',
      });
      EditorInvitation.belongsTo(models.User, {
        foreignKey: 'invitedUserId',
        as: 'invitedUser',
      });
      EditorInvitation.belongsTo(models.User, {
        foreignKey: 'inviterUserId',
        as: 'inviterUser',
      });
    }
  }

  EditorInvitation.init(
    {
      boardId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'BingoBoards',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      invitedUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      inviterUserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'PENDING',
        validate: {
          isIn: [['PENDING', 'ACCEPTED', 'DENIED']],
        },
      },
    },
    {
      sequelize,
      modelName: 'EditorInvitation',
    }
  );

  return EditorInvitation;
};
