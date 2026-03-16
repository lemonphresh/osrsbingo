'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('TreasureSubmissions', ['teamId', 'nodeId', 'status'], {
      name: 'idx_submissions_teamid_nodeid_status',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('TreasureSubmissions', 'idx_submissions_teamid_nodeid_status');
  },
};
