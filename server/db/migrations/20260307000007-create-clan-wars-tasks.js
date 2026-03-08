'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ClanWarsTasks', {
      taskId: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      eventId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'ClanWarsEvents', key: 'eventId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      label:       { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.STRING, allowNull: true },
      difficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard'),
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('SKILLER', 'PVMER'),
        allowNull: false,
      },
      isActive: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('ClanWarsTasks', ['eventId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ClanWarsTasks');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ClanWarsTasks_difficulty"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ClanWarsTasks_role"');
  },
};
