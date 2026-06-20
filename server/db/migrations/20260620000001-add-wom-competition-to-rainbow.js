'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('RainbowEvents', 'womCompetitionId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('RainbowTeamTiles', 'womBaseline', {
      type: Sequelize.FLOAT,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('RainbowEvents', 'womCompetitionId');
    await queryInterface.removeColumn('RainbowTeamTiles', 'womBaseline');
  },
};
