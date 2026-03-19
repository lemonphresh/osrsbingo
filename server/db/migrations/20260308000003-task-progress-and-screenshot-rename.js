'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add taskProgress JSONB to ClanWarsTeams for in-progress task tracking
    await queryInterface.addColumn('ClanWarsTeams', 'taskProgress', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    });

    // Rename proofUrl → screenshot in ClanWarsSubmissions
    // (submissions come from Discord attachments, not user-entered URLs)
    await queryInterface.renameColumn('ClanWarsSubmissions', 'proofUrl', 'screenshot');

    // Widen the column to TEXT to handle long Discord CDN URLs
    await queryInterface.changeColumn('ClanWarsSubmissions', 'screenshot', {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ClanWarsTeams', 'taskProgress');
    await queryInterface.renameColumn('ClanWarsSubmissions', 'screenshot', 'proofUrl');
    await queryInterface.changeColumn('ClanWarsSubmissions', 'proofUrl', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
