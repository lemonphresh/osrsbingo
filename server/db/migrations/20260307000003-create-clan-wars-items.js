'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ClanWarsItems', {
      itemId: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      teamId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'ClanWarsTeams', key: 'teamId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      eventId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'ClanWarsEvents', key: 'eventId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name:  { type: Sequelize.STRING, allowNull: false },
      slot:  { type: Sequelize.STRING, allowNull: false },
      rarity: {
        type: Sequelize.ENUM('common', 'uncommon', 'rare', 'epic'),
        allowNull: true,
      },
      itemSnapshot:       { type: Sequelize.JSONB, allowNull: false },
      sourceSubmissionId: { type: Sequelize.STRING, allowNull: true },
      earnedAt:           { type: Sequelize.DATE, allowNull: true },
      isEquipped: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      isUsed:     { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('ClanWarsItems', ['teamId', 'slot']);
    await queryInterface.addIndex('ClanWarsItems', ['teamId', 'name']);
    await queryInterface.addIndex('ClanWarsItems', ['eventId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ClanWarsItems');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ClanWarsItems_rarity"');
  },
};
