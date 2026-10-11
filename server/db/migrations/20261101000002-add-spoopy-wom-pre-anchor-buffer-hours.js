'use strict';

// Per-event configurable buffer for the spoopy WOM sync anchor. The sync
// uses each tile's approved PRE submission as the "start" moment, but WOM
// per-metric snapshots can be captured a few hours before the PRE actually
// came in. Backdating the anchor by `womPreAnchorBufferHours` captures xp
// / kc earned in that gap instead of losing it. Default 12 matches the
// previously-hardcoded PRE_BACKDATE_MS. Mirrors Battleship's
// womShotAnchorBufferHours.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('SpoopyEvents', 'womPreAnchorBufferHours', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 12,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('SpoopyEvents', 'womPreAnchorBufferHours');
  },
};
