// migrations/XXXXXX-add-performance-indexes.js
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Composite index - perfect for your findOne({ where: { teamId, eventId } })
    await queryInterface.addIndex('TreasureTeams', ['teamId', 'eventId'], {
      name: 'idx_teams_teamid_eventid',
      unique: true, // This combo should be unique anyway
    });

    // Single column indexes
    await queryInterface.addIndex('TreasureTeams', ['eventId'], {
      name: 'idx_teams_eventid',
    });

    await queryInterface.addIndex('TreasureSubmissions', ['status'], {
      name: 'idx_submissions_status',
    });

    await queryInterface.addIndex('TreasureSubmissions', ['teamId'], {
      name: 'idx_submissions_teamid',
    });

    await queryInterface.addIndex('TreasureEvents', ['creatorId'], {
      name: 'idx_events_creatorid',
    });

    await queryInterface.addIndex('TreasureEvents', ['status'], {
      name: 'idx_events_status',
    });

    await queryInterface.addIndex('TreasureNodes', ['eventId'], {
      name: 'idx_nodes_eventid',
    });

    await queryInterface.addIndex('TreasureActivities', ['eventId', 'timestamp'], {
      name: 'idx_activities_eventid_timestamp',
    });

    await queryInterface.addIndex('Users', ['discordUserId'], {
      name: 'idx_users_discordid',
    });

    await queryInterface.addIndex('BingoBoards', ['userId'], {
      name: 'idx_boards_userid',
    });

    await queryInterface.addIndex('BingoBoards', ['isPublic', 'category'], {
      name: 'idx_boards_public_category',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('TreasureTeams', 'idx_teams_teamid_eventid');
    await queryInterface.removeIndex('TreasureTeams', 'idx_teams_eventid');
    await queryInterface.removeIndex('TreasureSubmissions', 'idx_submissions_status');
    await queryInterface.removeIndex('TreasureSubmissions', 'idx_submissions_teamid');
    await queryInterface.removeIndex('TreasureEvents', 'idx_events_creatorid');
    await queryInterface.removeIndex('TreasureEvents', 'idx_events_status');
    await queryInterface.removeIndex('TreasureNodes', 'idx_nodes_eventid');
    await queryInterface.removeIndex('TreasureActivities', 'idx_activities_eventid_timestamp');
    await queryInterface.removeIndex('Users', 'idx_users_discordid');
    await queryInterface.removeIndex('BingoBoards', 'idx_boards_userid');
    await queryInterface.removeIndex('BingoBoards', 'idx_boards_public_category');
  },
};
