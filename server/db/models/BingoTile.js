'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BingoTile extends Model {
    static associate(models) {
      BingoTile.belongsTo(models.BingoBoard, {
        foreignKey: 'board',
        as: 'boardDetails',
      });
    }
  }

  BingoTile.init(
    {
      isComplete: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      icon: {
        type: DataTypes.STRING,
      },
      dateCompleted: {
        type: DataTypes.DATE,
      },
      completedBy: {
        type: DataTypes.STRING,
      },
      value: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      board: {
        type: DataTypes.INTEGER,
        references: {
          model: 'BingoBoards',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
    },
    {
      sequelize,
      modelName: 'BingoTile',
    }
  );

  return BingoTile;
};
