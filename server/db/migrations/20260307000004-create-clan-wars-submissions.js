'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ClanWarsSubmissions', {
      submissionId: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      eventId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'ClanWarsEvents', key: 'eventId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      teamId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'ClanWarsTeams', key: 'teamId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      submittedBy:      { type: Sequelize.STRING, allowNull: false },
      submittedUsername:{ type: Sequelize.STRING, allowNull: true },
      channelId:        { type: Sequelize.STRING, allowNull: true },
      taskId:           { type: Sequelize.STRING, allowNull: false },
      taskLabel:        { type: Sequelize.STRING, allowNull: true },
      difficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard'),
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('SKILLER', 'PVMER'),
        allowNull: true,
      },
      proofUrl: { type: Sequelize.STRING, allowNull: true },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'DENIED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      rewardSlot:   { type: Sequelize.STRING, allowNull: true },
      rewardItemId: { type: Sequelize.STRING, allowNull: true },
      reviewedBy:   { type: Sequelize.STRING, allowNull: true },
      reviewNote:   { type: Sequelize.STRING, allowNull: true },
      reviewedAt:   { type: Sequelize.DATE, allowNull: true },
      submittedAt:  { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('ClanWarsSubmissions', ['eventId', 'status']);
    await queryInterface.addIndex('ClanWarsSubmissions', ['teamId', 'status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ClanWarsSubmissions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ClanWarsSubmissions_difficulty"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ClanWarsSubmissions_role"');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ClanWarsSubmissions_status"');
  },
};
