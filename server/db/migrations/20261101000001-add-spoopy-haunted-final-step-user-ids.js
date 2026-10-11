'use strict';

// Tracks which teammates have already sent `!nogoingback` during the
// current scary-house gauntlet attempt. The final step requires three
// unique voices from the team (or everyone, on <3-person teams). Cleared
// whenever the gauntlet level changes — either by advancing to level 3 or
// by resetting to 0 via a stray command.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('SpoopyTeams', 'hauntedFinalStepUserIds', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: [],
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('SpoopyTeams', 'hauntedFinalStepUserIds');
  },
};
