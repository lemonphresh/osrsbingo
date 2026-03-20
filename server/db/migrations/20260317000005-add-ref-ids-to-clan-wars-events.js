'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ClanWarsEvents', 'refIds', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: [],
      comment: 'Array of site user IDs who have ref access to this event',
    });
    console.log('✓ Added refIds column to ClanWarsEvents');
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('ClanWarsEvents', 'refIds');
    console.log('✓ Removed refIds column from ClanWarsEvents');
  },
};
