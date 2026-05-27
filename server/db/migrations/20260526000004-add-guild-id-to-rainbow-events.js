'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('rainbow_events', 'guildId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('rainbow_events', 'guildId');
  },
};
