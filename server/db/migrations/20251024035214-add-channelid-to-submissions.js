// migrations/YYYYMMDDHHMMSS-add-discord-fields-to-submissions.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add channelId column
    await queryInterface.addColumn('TreasureSubmissions', 'channelId', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Discord channel ID where submission was made',
      after: 'submittedBy', // Optional: positions the column
    });

    // Add submittedByUsername column
    await queryInterface.addColumn('TreasureSubmissions', 'submittedByUsername', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Discord username of submitter for display purposes',
      after: 'channelId', // Optional: positions the column
    });

    console.log('✅ Added channelId and submittedByUsername columns to TreasureSubmissions');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove channelId column
    await queryInterface.removeColumn('TreasureSubmissions', 'channelId');

    // Remove submittedByUsername column
    await queryInterface.removeColumn('TreasureSubmissions', 'submittedByUsername');

    console.log('✅ Removed channelId and submittedByUsername columns from TreasureSubmissions');
  },
};
