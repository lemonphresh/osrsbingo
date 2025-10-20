'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add adminIds column to TreasureEvents table
    await queryInterface.addColumn('TreasureEvents', 'adminIds', {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: false,
      defaultValue: [],
      comment: 'Array of user IDs who have admin access to this event',
    });

    // Migrate existing events: add creator to adminIds array
    // This ensures all existing events have their creator as an admin
    await queryInterface.sequelize.query(`
      UPDATE "TreasureEvents"
      SET "adminIds" = ARRAY["creatorId"]
      WHERE "creatorId" IS NOT NULL AND "adminIds" = '{}';
    `);

    console.log('✓ Added adminIds column to TreasureEvents');
    console.log('✓ Migrated existing events to include creator in adminIds');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the adminIds column
    await queryInterface.removeColumn('TreasureEvents', 'adminIds');

    console.log('✓ Removed adminIds column from TreasureEvents');
  },
};
