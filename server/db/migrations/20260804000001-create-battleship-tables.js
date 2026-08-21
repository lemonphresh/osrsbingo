'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BattleshipEvents', {
      eventId:             { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      eventName:           { type: Sequelize.STRING, allowNull: false },
      status: {
        type: Sequelize.ENUM('DRAFT', 'PLACEMENT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      placementPhaseHours: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 24 },
      cooldownMinutes:     { type: Sequelize.INTEGER, allowNull: false, defaultValue: 10 },
      placementStartsAt:   { type: Sequelize.DATE, allowNull: true },
      placementEndsAt:     { type: Sequelize.DATE, allowNull: true },
      creatorId:           { type: Sequelize.STRING, allowNull: true },
      adminIds: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      refIds: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      guildId:                { type: Sequelize.STRING, allowNull: true },
      announcementsChannelId: { type: Sequelize.STRING, allowNull: true },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('BattleshipTeams', {
      teamId:     { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      eventId:    { type: Sequelize.STRING, allowNull: false, references: { model: 'BattleshipEvents', key: 'eventId' } },
      teamName:   { type: Sequelize.STRING, allowNull: false },
      color:      { type: Sequelize.STRING, allowNull: true },
      members:    { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false, defaultValue: [] },
      skipTokens: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      lastShotAt: { type: Sequelize.DATE, allowNull: true },
      createdAt:  { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt:  { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('BattleshipTasks', {
      taskId:      { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      eventId:     { type: Sequelize.STRING, allowNull: false, references: { model: 'BattleshipEvents', key: 'eventId' } },
      label:       { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT,   allowNull: true },
      isActive:    { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt:   { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt:   { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('BattleshipShipTemplates', {
      templateId: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      eventId:    { type: Sequelize.STRING, allowNull: false, references: { model: 'BattleshipEvents', key: 'eventId' } },
      shipType: {
        type: Sequelize.ENUM('CARRIER', 'BATTLESHIP', 'CRUISER', 'SUBMARINE', 'DESTROYER'),
        allowNull: false,
      },
      cellIndex:  { type: Sequelize.INTEGER, allowNull: false },
      taskId:     { type: Sequelize.STRING, allowNull: true, references: { model: 'BattleshipTasks', key: 'taskId' } },
      createdAt:  { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt:  { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('BattleshipBoards', {
      boardId:           { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      eventId:           { type: Sequelize.STRING, allowNull: false, references: { model: 'BattleshipEvents', key: 'eventId' } },
      teamId:            { type: Sequelize.STRING, allowNull: false, references: { model: 'BattleshipTeams', key: 'teamId' } },
      isPlacementLocked: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt:         { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt:         { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('BattleshipShipPlacements', {
      placementId: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      boardId:     { type: Sequelize.STRING, allowNull: false, references: { model: 'BattleshipBoards', key: 'boardId' } },
      shipType: {
        type: Sequelize.ENUM('CARRIER', 'BATTLESHIP', 'CRUISER', 'SUBMARINE', 'DESTROYER'),
        allowNull: false,
      },
      orientation: {
        type: Sequelize.ENUM('HORIZONTAL', 'VERTICAL'),
        allowNull: false,
      },
      startRow:   { type: Sequelize.INTEGER, allowNull: false },
      startCol:   { type: Sequelize.INTEGER, allowNull: false },
      createdAt:  { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt:  { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('BattleshipTiles', {
      tileId:   { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      boardId:  { type: Sequelize.STRING, allowNull: false, references: { model: 'BattleshipBoards', key: 'boardId' } },
      row:      { type: Sequelize.INTEGER, allowNull: false },
      col:      { type: Sequelize.INTEGER, allowNull: false },
      shipType: {
        type: Sequelize.ENUM('CARRIER', 'BATTLESHIP', 'CRUISER', 'SUBMARINE', 'DESTROYER'),
        allowNull: true,
      },
      cellIndex:       { type: Sequelize.INTEGER, allowNull: true },
      taskId:          { type: Sequelize.STRING,  allowNull: true, references: { model: 'BattleshipTasks', key: 'taskId' } },
      isShot:          { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      taskCompleted:   { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      skipped:         { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      shotAt:          { type: Sequelize.DATE, allowNull: true },
      taskCompletedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt:       { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt:       { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('BattleshipShotLogs', {
      shotId:        { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      eventId:       { type: Sequelize.STRING, allowNull: false, references: { model: 'BattleshipEvents', key: 'eventId' } },
      firingTeamId:  { type: Sequelize.STRING, allowNull: false },
      targetBoardId: { type: Sequelize.STRING, allowNull: false },
      tileId:        { type: Sequelize.STRING, allowNull: false },
      row:           { type: Sequelize.INTEGER, allowNull: false },
      col:           { type: Sequelize.INTEGER, allowNull: false },
      result: {
        type: Sequelize.ENUM('HIT', 'MISS'),
        allowNull: false,
      },
      taskId:   { type: Sequelize.STRING, allowNull: true },
      shotAt:   { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('BattleshipTeams',        ['eventId'], { name: 'idx_bs_teams_event_id' });
    await queryInterface.addIndex('BattleshipTasks',        ['eventId'], { name: 'idx_bs_tasks_event_id' });
    await queryInterface.addIndex('BattleshipShipTemplates',['eventId'], { name: 'idx_bs_ship_templates_event_id' });
    await queryInterface.addIndex('BattleshipBoards',       ['eventId'], { name: 'idx_bs_boards_event_id' });
    await queryInterface.addIndex('BattleshipBoards',       ['teamId'],  { name: 'idx_bs_boards_team_id' });
    await queryInterface.addIndex('BattleshipTiles',        ['boardId'], { name: 'idx_bs_tiles_board_id' });
    await queryInterface.addIndex('BattleshipShotLogs',     ['eventId'], { name: 'idx_bs_shots_event_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('BattleshipShotLogs');
    await queryInterface.dropTable('BattleshipTiles');
    await queryInterface.dropTable('BattleshipShipPlacements');
    await queryInterface.dropTable('BattleshipBoards');
    await queryInterface.dropTable('BattleshipShipTemplates');
    await queryInterface.dropTable('BattleshipTasks');
    await queryInterface.dropTable('BattleshipTeams');
    await queryInterface.dropTable('BattleshipEvents');
  },
};
