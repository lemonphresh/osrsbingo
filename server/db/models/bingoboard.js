'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BingoBoard extends Model {
    static associate(models) {
      BingoBoard.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });

      BingoBoard.hasMany(models.BingoTile, {
        foreignKey: 'board',
        as: 'tiles',
      });

      BingoBoard.belongsToMany(models.User, {
        through: 'BoardEditors',
        as: 'editors',
        foreignKey: 'boardId',
        otherKey: 'userId',
      });
    }
  }

  BingoBoard.init(
    {
      type: {
        type: DataTypes.ENUM('FIVE', 'SEVEN'),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      layout: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      team: {
        type: DataTypes.INTEGER,
      },
      totalValue: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      totalValueCompleted: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      bonusSettings: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
    },
    {
      sequelize,
      modelName: 'BingoBoard',
    }
  );

  return BingoBoard;
};
