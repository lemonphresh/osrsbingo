'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('TreasureTeams', 'nodeProgress', {
      type: Sequelize.JSONB,
      defaultValue: {},
      allowNull: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('TreasureTeams', 'nodeProgress');
  },
};
