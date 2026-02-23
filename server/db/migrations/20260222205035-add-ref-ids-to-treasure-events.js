'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('TreasureEvents', 'refIds', {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: false,
      defaultValue: [],
      comment: 'Array of user IDs who have ref access to this event',
    });

    console.log('✓ Added refIds column to TreasureEvents');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('TreasureEvents', 'refIds');

    console.log('✓ Removed refIds column from TreasureEvents');
  },
};
