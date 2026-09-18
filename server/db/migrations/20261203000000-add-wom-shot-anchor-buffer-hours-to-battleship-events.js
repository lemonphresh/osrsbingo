'use strict';

// Per-event configurable buffer for the WOM sync anchor. OSRS hiscores only
// update on logout; if no snapshot exists near shotAt, the sync under-credits
// gains. Admins can nudge this up to widen the anchor window if their event's
// player base tends to stay logged in for long stretches.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('BattleshipEvents', 'womShotAnchorBufferHours', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 3,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('BattleshipEvents', 'womShotAnchorBufferHours');
  },
};
