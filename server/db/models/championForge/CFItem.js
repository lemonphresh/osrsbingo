'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CFItem extends Model {
    static associate(models) {
      CFItem.belongsTo(models.CFTeam,  { foreignKey: 'teamId', as: 'team' });
      CFItem.belongsTo(models.CFEvent, { foreignKey: 'eventId', as: 'event' });
    }
  }

  CFItem.init(
    {
      itemId:             { type: DataTypes.STRING, primaryKey: true },
      teamId:             { type: DataTypes.STRING, allowNull: false },
      eventId:            { type: DataTypes.STRING, allowNull: false },
      name:               { type: DataTypes.STRING, allowNull: false },
      slot:               { type: DataTypes.STRING, allowNull: false },
      rarity: {
        type: DataTypes.ENUM('common', 'uncommon', 'rare', 'epic'),
        allowNull: true,
      },
      itemSnapshot:       { type: DataTypes.JSONB, allowNull: false },
      sourceSubmissionId: { type: DataTypes.STRING, allowNull: true },
      earnedAt:           { type: DataTypes.DATE, allowNull: true },
      isEquipped:         { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      isUsed:             { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { sequelize, modelName: 'CFItem', tableName: 'ClanWarsItems' }
  );

  return CFItem;
};
