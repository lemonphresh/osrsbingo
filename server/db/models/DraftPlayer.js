'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class DraftPlayer extends Model {
    static associate(models) {
      DraftPlayer.belongsTo(models.DraftRoom, {
        foreignKey: 'roomId',
        as: 'room',
      });
    }
  }

  DraftPlayer.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      roomId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: { model: 'DraftRooms', key: 'roomId' },
      },
      // hidden until room status = REVEALED — GraphQL resolver strips this field
      rsn: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // i.e. "Raider A", "Raider B"
      alias: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      // full WOM API response (subset sent to client based on statCategories)
      womData: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      // null | 'S' | 'A' | 'B' | 'C' | 'D'
      tierBadge: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      // null until drafted
      teamIndex: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      // global pick number (0-indexed), null until drafted
      pickOrder: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: 'DraftPlayer',
    }
  );

  return DraftPlayer;
};
