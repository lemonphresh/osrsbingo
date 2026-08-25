'use strict';

// Progress percentage (0-100) that refs update manually from the review panel
// so teams can see where they stand on a multi-step task. Mirrors the
// battleship pattern; not a completion gate (approval still auto-completes),
// just a visible indicator.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('SpoopyTeamTiles', 'progress', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('SpoopyTeamTiles', 'progress');
  },
};
