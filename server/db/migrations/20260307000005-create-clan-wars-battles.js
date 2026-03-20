'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ClanWarsBattles', {
      battleId: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      eventId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'ClanWarsEvents', key: 'eventId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      team1Id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'ClanWarsTeams', key: 'teamId' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      team2Id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'ClanWarsTeams', key: 'teamId' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      status: {
        type: Sequelize.ENUM('WAITING', 'IN_PROGRESS', 'COMPLETED'),
        allowNull: false,
        defaultValue: 'WAITING',
      },
      championSnapshots: { type: Sequelize.JSONB, allowNull: true },
      battleState:       { type: Sequelize.JSONB, allowNull: true },
      rngSeed:           { type: Sequelize.STRING, allowNull: true },
      winnerId:          { type: Sequelize.STRING, allowNull: true },
      startedAt:         { type: Sequelize.DATE, allowNull: true },
      endedAt:           { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ClanWarsBattles');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ClanWarsBattles_status"');
  },
};
