'use strict';

// Tracks whether the pre-curfew warning Discord post has already fired for
// an event, so the per-minute scheduler loop doesn't re-post it every tick
// after we cross the 1-hour threshold. Set once by the scheduler when the
// warning goes out.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('SpoopyEvents', 'lastHourWarningSentAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('SpoopyEvents', 'lastHourWarningSentAt');
  },
};
