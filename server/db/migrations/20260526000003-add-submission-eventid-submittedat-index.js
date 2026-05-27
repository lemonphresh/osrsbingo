'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('RainbowSubmissions', ['eventId', 'submittedAt'], {
      name: 'rainbow_submissions_event_submitted_at',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex('RainbowSubmissions', 'rainbow_submissions_event_submitted_at');
  },
};
