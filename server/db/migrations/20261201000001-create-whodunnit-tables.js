'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ── WhodunnitCampaigns ──────────────────────────────────────────
    await queryInterface.createTable('WhodunnitCampaigns', {
      campaignId:      { type: Sequelize.STRING, primaryKey: true },
      // Team-chosen "detective agency name" from Node 1's input.
      agencyName:      { type: Sequelize.STRING, allowNull: false },
      createdByUserId: { type: Sequelize.STRING, allowNull: false },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'COMPLETE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      // Current node the team is viewing. Story tree lives client-side;
      // server just stores the ID so we can gate advances.
      currentNodeId:   { type: Sequelize.STRING, allowNull: false, defaultValue: 'intro' },
      // Recorded once each is chosen. Null while unpicked.
      choiceAPath: {
        type: Sequelize.ENUM('A1', 'A2'),
        allowNull: true,
      },
      choiceBPath: {
        type: Sequelize.ENUM('B1', 'B2'),
        allowNull: true,
      },
      // Latest "prime suspect" guess. History is in WhodunnitSuspectHistory.
      primeSuspect:    { type: Sequelize.STRING, allowNull: true },
      completedAt:     { type: Sequelize.DATE, allowNull: true },
      createdAt:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt:       { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('WhodunnitCampaigns', ['status']);
    await queryInterface.addIndex('WhodunnitCampaigns', ['createdByUserId']);

    // ── WhodunnitTeamMembers ────────────────────────────────────────
    // Up to 4 rows per campaign (creator + up to 3 teammates).
    await queryInterface.createTable('WhodunnitTeamMembers', {
      memberId:    { type: Sequelize.STRING, primaryKey: true },
      campaignId:  { type: Sequelize.STRING, allowNull: false, references: { model: 'WhodunnitCampaigns', key: 'campaignId' }, onDelete: 'CASCADE' },
      userId:      { type: Sequelize.STRING, allowNull: false },
      isCreator:   { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      joinedAt:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('WhodunnitTeamMembers', ['campaignId']);
    await queryInterface.addIndex('WhodunnitTeamMembers', ['userId']);
    await queryInterface.addIndex('WhodunnitTeamMembers', ['campaignId', 'userId'], { unique: true });

    // ── WhodunnitNodeProgress ───────────────────────────────────────
    // One row per (campaign, node). Timer bracket + hint usage.
    await queryInterface.createTable('WhodunnitNodeProgress', {
      progressId:       { type: Sequelize.STRING, primaryKey: true },
      campaignId:       { type: Sequelize.STRING, allowNull: false, references: { model: 'WhodunnitCampaigns', key: 'campaignId' }, onDelete: 'CASCADE' },
      nodeId:           { type: Sequelize.STRING, allowNull: false },
      startedAt:        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      endedAt:          { type: Sequelize.DATE, allowNull: true },
      // Array of clue IDs for which the team revealed a hint on this node.
      hintUsedClueIds:  { type: Sequelize.JSONB, allowNull: false, defaultValue: [] },
      createdAt:        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt:        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('WhodunnitNodeProgress', ['campaignId']);
    await queryInterface.addIndex('WhodunnitNodeProgress', ['campaignId', 'nodeId'], { unique: true });

    // ── WhodunnitClueAnswers ────────────────────────────────────────
    // One row per (campaign, clue) — the final submitted answer.
    await queryInterface.createTable('WhodunnitClueAnswers', {
      answerId:           { type: Sequelize.STRING, primaryKey: true },
      campaignId:         { type: Sequelize.STRING, allowNull: false, references: { model: 'WhodunnitCampaigns', key: 'campaignId' }, onDelete: 'CASCADE' },
      nodeId:             { type: Sequelize.STRING, allowNull: false },
      clueId:             { type: Sequelize.STRING, allowNull: false },
      answer:             { type: Sequelize.TEXT, allowNull: false },
      submittedByUserId:  { type: Sequelize.STRING, allowNull: false },
      submittedAt:        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('WhodunnitClueAnswers', ['campaignId']);
    await queryInterface.addIndex('WhodunnitClueAnswers', ['campaignId', 'clueId'], { unique: true });

    // ── WhodunnitSuspectHistory ─────────────────────────────────────
    // Append-only log of every "prime suspect" edit. Feeds the running-gag
    // count in the final Casebook Report ("You cycled through N suspects").
    await queryInterface.createTable('WhodunnitSuspectHistory', {
      entryId:          { type: Sequelize.STRING, primaryKey: true },
      campaignId:       { type: Sequelize.STRING, allowNull: false, references: { model: 'WhodunnitCampaigns', key: 'campaignId' }, onDelete: 'CASCADE' },
      suspect:          { type: Sequelize.STRING, allowNull: false },
      updatedByUserId:  { type: Sequelize.STRING, allowNull: false },
      updatedAt:        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('WhodunnitSuspectHistory', ['campaignId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('WhodunnitSuspectHistory');
    await queryInterface.dropTable('WhodunnitClueAnswers');
    await queryInterface.dropTable('WhodunnitNodeProgress');
    await queryInterface.dropTable('WhodunnitTeamMembers');
    await queryInterface.dropTable('WhodunnitCampaigns');
    // Drop ENUM types created for the campaign table
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_WhodunnitCampaigns_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_WhodunnitCampaigns_choiceAPath";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_WhodunnitCampaigns_choiceBPath";');
  },
};
