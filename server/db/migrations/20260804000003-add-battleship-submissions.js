'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add progress to tiles
    await queryInterface.addColumn('BattleshipTiles', 'progress', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    // Add Discord fields to teams
    await queryInterface.addColumn('BattleshipTeams', 'discordChannelId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('BattleshipTeams', 'discordRoleId', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Create submissions table
    await queryInterface.createTable('BattleshipSubmissions', {
      submissionId:     { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      eventId:          { type: Sequelize.STRING, allowNull: false, references: { model: 'BattleshipEvents', key: 'eventId' } },
      tileId:           { type: Sequelize.STRING, allowNull: false, references: { model: 'BattleshipTiles',  key: 'tileId'  } },
      boardId:          { type: Sequelize.STRING, allowNull: false },
      teamId:           { type: Sequelize.STRING, allowNull: false },
      tileLabel:        { type: Sequelize.TEXT,   allowNull: true },
      discordUserId:    { type: Sequelize.STRING, allowNull: true },
      discordUsername:  { type: Sequelize.STRING, allowNull: true },
      screenshotUrl:    { type: Sequelize.TEXT,   allowNull: true },
      channelId:        { type: Sequelize.STRING, allowNull: true },
      discordMessageId: { type: Sequelize.STRING, allowNull: true },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'DENIED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      reviewedBy:   { type: Sequelize.STRING, allowNull: true },
      reviewedAt:   { type: Sequelize.DATE,   allowNull: true },
      denialReason: { type: Sequelize.TEXT,   allowNull: true },
      submittedAt:  { type: Sequelize.DATE,   allowNull: true },
      createdAt:    { type: Sequelize.DATE,   allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt:    { type: Sequelize.DATE,   allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.addIndex('BattleshipSubmissions', ['eventId', 'status'], { name: 'idx_bs_submissions_event_status' });
    await queryInterface.addIndex('BattleshipSubmissions', ['tileId'],            { name: 'idx_bs_submissions_tile_id' });
    await queryInterface.addIndex('BattleshipSubmissions', ['teamId'],            { name: 'idx_bs_submissions_team_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('BattleshipSubmissions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_BattleshipSubmissions_status";');
    await queryInterface.removeColumn('BattleshipTiles',  'progress');
    await queryInterface.removeColumn('BattleshipTeams',  'discordChannelId');
    await queryInterface.removeColumn('BattleshipTeams',  'discordRoleId');
  },
};
