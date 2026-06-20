'use strict';
const { Model, DataTypes } = require('sequelize');
const { DEFAULT_TILE_GRAPH } = require('../../utils/rainbowTiles');

module.exports = (sequelize) => {
  class RainbowEvent extends Model {
    static associate(models) {
      RainbowEvent.hasMany(models.RainbowTeam,       { foreignKey: 'eventId', as: 'teams' });
      RainbowEvent.hasMany(models.RainbowSubmission, { foreignKey: 'eventId', as: 'submissions' });
    }
  }

  RainbowEvent.init(
    {
      eventId:   { type: DataTypes.STRING, primaryKey: true },
      eventName: { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('SETUP', 'ACTIVE', 'COMPLETE'),
        allowNull: false,
        defaultValue: 'SETUP',
      },
      startDate:        { type: DataTypes.DATE,  allowNull: true },
      endDate:          { type: DataTypes.DATE,  allowNull: true },
      adminIds:         { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
      staffChannelId:     { type: DataTypes.STRING, allowNull: true },
      womCompetitionId:   { type: DataTypes.STRING, allowNull: true },
      tileGraph:          { type: DataTypes.JSONB, allowNull: false, defaultValue: DEFAULT_TILE_GRAPH },
    },
    { sequelize, modelName: 'RainbowEvent' },
  );

  return RainbowEvent;
};
