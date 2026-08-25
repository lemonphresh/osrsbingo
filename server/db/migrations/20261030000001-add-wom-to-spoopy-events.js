'use strict';

// WOM (Wise Old Man) competition integration for Spoopy. Mirrors the pattern
// rainbow bingo uses: admin sets a WOM team competition id on the event,
// then a background sync walks each team's roster and pulls gained xp/kc
// per tile from the pre-screenshot's approval timestamp → now. The tile
// progress bar is updated from that delta so refs don't have to move it by
// hand for skilling / boss kc tasks.
//
// `lastWomSyncAt` is used to enforce a per-event cooldown against WOM rate
// limits (matches the rainbow bingo cooldown pattern).
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('SpoopyEvents', 'womCompetitionId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('SpoopyEvents', 'lastWomSyncAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('SpoopyEvents', 'lastWomSyncAt');
    await queryInterface.removeColumn('SpoopyEvents', 'womCompetitionId');
  },
};
