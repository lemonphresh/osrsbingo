'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('RainbowEvents', 'womCompetitionId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('RainbowTeams', 'lastWomSync', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('RainbowEvents', 'womCompetitionId');
    await queryInterface.removeColumn('RainbowTeams', 'lastWomSync');
  },
};
