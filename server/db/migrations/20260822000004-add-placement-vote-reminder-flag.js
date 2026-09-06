'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BattleshipEvents', 'placementVoteReminderSentAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('BattleshipEvents', 'placementVoteReminderSentAt');
  },
};
