'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BattleshipShotProposals', {
      proposalId: {
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
      firingTeamId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        references: { model: 'BattleshipTeams', key: 'teamId' },
        onDelete: 'CASCADE',
      },
      targetTeamId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'BattleshipTeams', key: 'teamId' },
        onDelete: 'CASCADE',
      },
      row: { type: Sequelize.INTEGER, allowNull: false },
      col: { type: Sequelize.INTEGER, allowNull: false },
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
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      threshold: { type: Sequelize.INTEGER, allowNull: false },
      proposedAt: { type: Sequelize.DATE, allowNull: false },
      expiresAt: { type: Sequelize.DATE, allowNull: false },
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

    await queryInterface.addIndex('BattleshipShotProposals', ['expiresAt'], {
      name: 'idx_bs_shot_proposals_expires_at',
    });

    // A tile is a single-use target. This is the final database-level guard
    // against two concurrent requests recording the same shot twice.
    await queryInterface.addIndex('BattleshipShotLogs', ['tileId'], {
      name: 'uq_bs_shot_logs_tile_id',
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('BattleshipShotLogs', 'uq_bs_shot_logs_tile_id');
    await queryInterface.dropTable('BattleshipShotProposals');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_BattleshipShotProposals_status";'
    );
  },
};
