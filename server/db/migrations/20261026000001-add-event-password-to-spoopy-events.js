'use strict';

// Optional password teams include visibly in their submitted screenshots as
// proof (mirrors the Rainbow Bingo convention). Shown under the event title
// on /spoopy-event so teams can copy it while playing.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('SpoopyEvents', 'eventPassword', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('SpoopyEvents', 'eventPassword');
  },
};
