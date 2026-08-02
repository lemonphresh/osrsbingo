'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CFBattleEvent extends Model {
    static associate(models) {
      CFBattleEvent.belongsTo(models.CFBattle, { foreignKey: 'battleId', as: 'battle' });
    }
  }

  CFBattleEvent.init(
    {
      eventLogId:    { type: DataTypes.STRING, primaryKey: true },
      battleId:      { type: DataTypes.STRING, allowNull: false },
      turnNumber:    { type: DataTypes.INTEGER, allowNull: false },
      actorTeamId:   { type: DataTypes.STRING, allowNull: true },
      action: {
        type: DataTypes.ENUM(
          'ATTACK', 'DEFEND', 'USE_ITEM', 'SPECIAL',
          'BLEED_TICK', 'AUTO_ATTACK', 'BATTLE_START', 'BATTLE_END'
        ),
        allowNull: false,
      },
      rollInputs:    { type: DataTypes.JSONB, allowNull: true },
      damageDealt:   { type: DataTypes.INTEGER, allowNull: true },
      isCrit:        { type: DataTypes.BOOLEAN, allowNull: true },
      itemUsedId:    { type: DataTypes.STRING, allowNull: true },
      effectApplied: { type: DataTypes.STRING, allowNull: true },
      hpAfter:       { type: DataTypes.JSONB, allowNull: true },
      narrative:     { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, modelName: 'CFBattleEvent', tableName: 'ClanWarsBattleEvents' }
  );

  return CFBattleEvent;
};
