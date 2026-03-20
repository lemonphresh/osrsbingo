'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ClanWarsItem extends Model {
    static associate(models) {
      ClanWarsItem.belongsTo(models.ClanWarsTeam,  { foreignKey: 'teamId', as: 'team' });
      ClanWarsItem.belongsTo(models.ClanWarsEvent, { foreignKey: 'eventId', as: 'event' });
    }
  }

  ClanWarsItem.init(
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
    { sequelize, modelName: 'ClanWarsItem' }
  );

  return ClanWarsItem;
};
