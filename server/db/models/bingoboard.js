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
    }
  }

  BingoBoard.init(
    {
      type: {
        type: DataTypes.ENUM('FIVE', 'SEVEN'),
        allowNull: false,
      },
      editors: {
        type: DataTypes.ARRAY(DataTypes.INTEGER), // Assuming 'editors' is an array of user IDs
        allowNull: true,
        defaultValue: [],
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
