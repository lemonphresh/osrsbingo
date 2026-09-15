'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BattleshipProposalLog', {
      logId: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      eventId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'BattleshipEvents', key: 'eventId' },
        onDelete: 'CASCADE',
      },
      kind: {
        type: Sequelize.ENUM('SHOT', 'SKIP'),
        allowNull: false,
      },
      firingTeamId: { type: Sequelize.STRING, allowNull: false },
      targetTeamId: { type: Sequelize.STRING, allowNull: true },
      sourceProposalId: { type: Sequelize.STRING, allowNull: false },
      row: { type: Sequelize.INTEGER, allowNull: true },
      col: { type: Sequelize.INTEGER, allowNull: true },
      tileId: { type: Sequelize.STRING, allowNull: true },
      tileLabel: { type: Sequelize.STRING, allowNull: true },
      proposedBy: { type: Sequelize.STRING, allowNull: false },
      approvals: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      rejections: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      threshold: { type: Sequelize.INTEGER, allowNull: false },
      finalStatus: {
        type: Sequelize.ENUM('APPROVED', 'REJECTED', 'EXPIRED', 'CLEARED'),
        allowNull: false,
      },
      proposedAt: { type: Sequelize.DATE, allowNull: false },
      resolvedAt: { type: Sequelize.DATE, allowNull: false },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('BattleshipProposalLog', ['eventId', 'resolvedAt'], {
      name: 'idx_bs_proposal_log_event_resolved',
    });

    // Idempotency guard: at every terminal transition we may attempt to log the
    // same source proposal twice (e.g. a rejected proposal is later overwritten
    // by a new one — the overwrite path shouldn't produce a second CLEARED row).
    await queryInterface.addIndex('BattleshipProposalLog', ['sourceProposalId'], {
      name: 'uq_bs_proposal_log_source_proposal',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('BattleshipProposalLog', 'uq_bs_proposal_log_source_proposal');
    await queryInterface.removeIndex('BattleshipProposalLog', 'idx_bs_proposal_log_event_resolved');
    await queryInterface.dropTable('BattleshipProposalLog');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_BattleshipProposalLog_kind";');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_BattleshipProposalLog_finalStatus";'
    );
  },
};
