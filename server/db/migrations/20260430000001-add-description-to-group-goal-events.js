'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('GroupGoalEvents', 'description', {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: null,
    });
    console.log('✓ Added description column to GroupGoalEvents');
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('GroupGoalEvents', 'description');
    console.log('✓ Removed description column from GroupGoalEvents');
  },
};
