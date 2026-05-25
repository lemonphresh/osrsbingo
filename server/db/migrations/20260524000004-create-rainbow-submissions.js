'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RainbowSubmissions', {
      submissionId:     { type: Sequelize.STRING, primaryKey: true },
      teamId:           { type: Sequelize.STRING, allowNull: false, references: { model: 'RainbowTeams',  key: 'teamId'  } },
      eventId:          { type: Sequelize.STRING, allowNull: false, references: { model: 'RainbowEvents', key: 'eventId' } },
      tileCode:         { type: Sequelize.STRING, allowNull: false },
      type:             { type: Sequelize.ENUM('PRE', 'FINAL'), allowNull: false },
      screenshotUrl:    { type: Sequelize.TEXT,   allowNull: true },
      discordMessageId: { type: Sequelize.STRING, allowNull: true },
      channelId:        { type: Sequelize.STRING, allowNull: false },
      status:           { type: Sequelize.ENUM('PENDING', 'APPROVED', 'DENIED'), allowNull: false, defaultValue: 'PENDING' },
      reviewedBy:       { type: Sequelize.STRING, allowNull: true },
      reviewedAt:       { type: Sequelize.DATE,   allowNull: true },
      denialReason:     { type: Sequelize.TEXT,   allowNull: true },
      submittedAt:      { type: Sequelize.DATE,   allowNull: true },
      createdAt:        { type: Sequelize.DATE,   allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt:        { type: Sequelize.DATE,   allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('RainbowSubmissions', ['teamId', 'tileCode']);
    await queryInterface.addIndex('RainbowSubmissions', ['eventId', 'status']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('RainbowSubmissions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_RainbowSubmissions_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_RainbowSubmissions_status";');
  },
};
