'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ClanWarsBattleEvents', {
      eventLogId: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      battleId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'ClanWarsBattles', key: 'battleId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      turnNumber:  { type: Sequelize.INTEGER, allowNull: false },
      actorTeamId: { type: Sequelize.STRING, allowNull: true },
      action: {
        type: Sequelize.ENUM(
          'ATTACK', 'DEFEND', 'USE_ITEM', 'SPECIAL',
          'BLEED_TICK', 'AUTO_ATTACK', 'BATTLE_START', 'BATTLE_END'
        ),
        allowNull: false,
      },
      rollInputs:    { type: Sequelize.JSONB, allowNull: true },
      damageDealt:   { type: Sequelize.INTEGER, allowNull: true },
      isCrit:        { type: Sequelize.BOOLEAN, allowNull: true },
      itemUsedId:    { type: Sequelize.STRING, allowNull: true },
      effectApplied: { type: Sequelize.STRING, allowNull: true },
      hpAfter:       { type: Sequelize.JSONB, allowNull: true },
      narrative:     { type: Sequelize.STRING, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('ClanWarsBattleEvents', ['battleId', 'turnNumber']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ClanWarsBattleEvents');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ClanWarsBattleEvents_action"');
  },
};
