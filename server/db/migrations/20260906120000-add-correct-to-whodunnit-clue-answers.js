'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Adds the server-computed correctness verdict to each submitted answer.
    // Historical rows keep the default `false` — every existing campaign will
    // just have every clue reset to "not yet correct". Since the story data
    // isn't user-generated, teams that already submitted correctly can just
    // resubmit and the server will flip this to true.
    await queryInterface.addColumn('WhodunnitClueAnswers', 'correct', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('WhodunnitClueAnswers', 'correct');
  },
};
