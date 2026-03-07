'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('TreasureTeams', 'inProgressNodes', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: [],
      allowNull: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('TreasureTeams', 'inProgressNodes');
  },
};
