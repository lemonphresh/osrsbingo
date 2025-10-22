// migrations/YYYYMMDDHHMMSS-add-location-group-id.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('TreasureNodes', 'locationGroupId', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'mapLocation', // Places it after the mapLocation column
    });

    // Add index for faster queries by locationGroupId
    await queryInterface.addIndex('TreasureNodes', ['locationGroupId'], {
      name: 'treasure_nodes_location_group_id_index',
    });

    console.log('Added locationGroupId column to TreasureNodes');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove index first
    await queryInterface.removeIndex('TreasureNodes', 'treasure_nodes_location_group_id_index');

    // Then remove column
    await queryInterface.removeColumn('TreasureNodes', 'locationGroupId');

    console.log('Removed locationGroupId column from TreasureNodes');
  },
};
