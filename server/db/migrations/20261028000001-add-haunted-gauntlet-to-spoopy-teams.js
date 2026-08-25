'use strict';

// Escalating commitment counter for the "step inside the spooky house"
// gauntlet. Teams have to send three discord commands in order —
// !stepinside → !imserious → !nogoingback — to unlock the candybag
// submission. Any other spoopy command sent while the counter is 1 or 2
// resets it to 0 (that's the "you bailed" branch). Resets to 0 again
// after the candybag is completed.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('SpoopyTeams', 'hauntedGauntletLevel', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('SpoopyTeams', 'hauntedGauntletLevel');
  },
};
