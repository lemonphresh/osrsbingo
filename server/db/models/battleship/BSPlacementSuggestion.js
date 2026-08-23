'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BSPlacementSuggestion extends Model {}

  BSPlacementSuggestion.init(
    {
      suggestionId:      { type: DataTypes.STRING, primaryKey: true },
      eventId:           { type: DataTypes.STRING, allowNull: false },
      teamId:            { type: DataTypes.STRING, allowNull: false },
      proposerDiscordId: { type: DataTypes.STRING, allowNull: false },
      proposerUsername:  { type: DataTypes.STRING, allowNull: true },
      ships:             { type: DataTypes.JSONB,  allowNull: false },
      votes: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
    },
    { sequelize, modelName: 'BSPlacementSuggestion', tableName: 'BattleshipPlacementSuggestions' },
  );

  return BSPlacementSuggestion;
};
