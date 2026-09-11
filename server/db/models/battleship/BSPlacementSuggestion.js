'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BSPlacementSuggestion extends Model {
    static associate(models) {
      BSPlacementSuggestion.belongsTo(models.BSEvent, {
        foreignKey: 'eventId',
        as: 'event',
      });
      BSPlacementSuggestion.belongsTo(models.BSTeam, {
        foreignKey: 'teamId',
        as: 'team',
      });
    }
  }

  BSPlacementSuggestion.init(
    {
      suggestionId: { type: DataTypes.STRING, primaryKey: true },
      eventId: { type: DataTypes.STRING, allowNull: false },
      teamId: { type: DataTypes.STRING, allowNull: false },
      proposerDiscordId: { type: DataTypes.STRING, allowNull: false },
      proposerUsername: { type: DataTypes.STRING, allowNull: true },
      ships: { type: DataTypes.JSONB, allowNull: false },
      votes: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      sequelize,
      modelName: 'BSPlacementSuggestion',
      tableName: 'BattleshipPlacementSuggestions',
      indexes: [
        {
          unique: true,
          fields: ['teamId', 'proposerDiscordId'],
          name: 'uq_bs_placement_suggestion_team_proposer',
        },
      ],
    }
  );

  return BSPlacementSuggestion;
};
