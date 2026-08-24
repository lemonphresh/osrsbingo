'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── SpoopyEvents ────────────────────────────────────────────────
    await queryInterface.createTable('SpoopyEvents', {
      eventId:         { type: Sequelize.STRING, primaryKey: true },
      eventName:       { type: Sequelize.STRING, allowNull: false },
      status: {
        type: Sequelize.ENUM('SETUP', 'ACTIVE', 'COMPLETE'),
        allowNull: false,
        defaultValue: 'SETUP',
      },
      curfewStart:     { type: Sequelize.DATE, allowNull: true },
      curfewEnd:       { type: Sequelize.DATE, allowNull: true },
      adminIds:        { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false, defaultValue: [] },
      staffChannelId:  { type: Sequelize.STRING, allowNull: true },
      board:           { type: Sequelize.JSONB, allowNull: false, defaultValue: { dimensions: { rows: 0, cols: 0 }, tiles: [], candybagTileId: null } },
      contentById:     { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      hauntedHouse:    { type: Sequelize.JSONB, allowNull: true },
      startingTileIds: { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false, defaultValue: [] },
      createdAt:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('SpoopyEvents', ['status']);

    // ── SpoopyTeams ─────────────────────────────────────────────────
    await queryInterface.createTable('SpoopyTeams', {
      teamId:            { type: Sequelize.STRING, primaryKey: true },
      eventId:           { type: Sequelize.STRING, allowNull: false, references: { model: 'SpoopyEvents', key: 'eventId' } },
      teamName:          { type: Sequelize.STRING, allowNull: false },
      color:             { type: Sequelize.STRING, allowNull: true },
      members:           { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false, defaultValue: [] },
      discordChannelId:  { type: Sequelize.STRING, allowNull: false },
      discordRoleId:     { type: Sequelize.STRING, allowNull: true },
      teamToken:         { type: Sequelize.STRING(16), allowNull: true },
      gpEarned:          { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      cashedOut:         { type: Sequelize.JSONB, allowNull: true },
      createdAt:         { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt:         { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('SpoopyTeams', ['eventId']);
    await queryInterface.addIndex('SpoopyTeams', ['discordChannelId']);
    await queryInterface.addIndex('SpoopyTeams', ['teamToken']);

    // ── SpoopyTeamTiles ─────────────────────────────────────────────
    await queryInterface.createTable('SpoopyTeamTiles', {
      teamTileId:   { type: Sequelize.STRING, primaryKey: true },
      teamId:       { type: Sequelize.STRING, allowNull: false, references: { model: 'SpoopyTeams', key: 'teamId' } },
      eventId:      { type: Sequelize.STRING, allowNull: false },
      tileId:       { type: Sequelize.STRING, allowNull: false },
      status: {
        type: Sequelize.ENUM('locked', 'unlocked', 'submitted', 'complete'),
        allowNull: false,
        defaultValue: 'locked',
      },
      choice:       { type: Sequelize.STRING, allowNull: true },
      outcome:      { type: Sequelize.STRING, allowNull: true },
      submissionId: { type: Sequelize.STRING, allowNull: true },
      completedAt:  { type: Sequelize.DATE,   allowNull: true },
      rewardEarned: { type: Sequelize.INTEGER, allowNull: true },
      createdAt:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('SpoopyTeamTiles', ['teamId']);
    await queryInterface.addIndex('SpoopyTeamTiles', ['teamId', 'tileId'], { unique: true });

    // ── SpoopySubmissions ───────────────────────────────────────────
    await queryInterface.createTable('SpoopySubmissions', {
      submissionId:     { type: Sequelize.STRING, primaryKey: true },
      teamId:           { type: Sequelize.STRING, allowNull: false, references: { model: 'SpoopyTeams',  key: 'teamId'  } },
      eventId:          { type: Sequelize.STRING, allowNull: false, references: { model: 'SpoopyEvents', key: 'eventId' } },
      tileId:           { type: Sequelize.STRING, allowNull: false },
      screenshotUrl:    { type: Sequelize.TEXT,   allowNull: true },
      discordMessageId: { type: Sequelize.STRING, allowNull: true },
      channelId:        { type: Sequelize.STRING, allowNull: false },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'DENIED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      discordUsername:  { type: Sequelize.STRING, allowNull: true },
      discordUserId:    { type: Sequelize.STRING, allowNull: true },
      reviewedBy:       { type: Sequelize.STRING, allowNull: true },
      reviewedAt:       { type: Sequelize.DATE,   allowNull: true },
      denialReason:     { type: Sequelize.TEXT,   allowNull: true },
      submittedAt:      { type: Sequelize.DATE,   allowNull: true },
      createdAt:        { type: Sequelize.DATE,   allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt:        { type: Sequelize.DATE,   allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('SpoopySubmissions', ['eventId', 'status']);
    await queryInterface.addIndex('SpoopySubmissions', ['teamId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('SpoopySubmissions');
    await queryInterface.dropTable('SpoopyTeamTiles');
    await queryInterface.dropTable('SpoopyTeams');
    await queryInterface.dropTable('SpoopyEvents');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_SpoopyEvents_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_SpoopyTeamTiles_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_SpoopySubmissions_status";');
  },
};
