'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('TreasureTeams', 'activeBuffs', {
      type: Sequelize.JSONB,
      defaultValue: [],
      allowNull: false,
      comment: 'Active buffs that can be applied to objectives',
    });

    await queryInterface.addColumn('TreasureTeams', 'buffHistory', {
      type: Sequelize.JSONB,
      defaultValue: [],
      allowNull: false,
      comment: 'History of buff usage',
    });

    console.log('✅ Added activeBuffs and buffHistory columns to TreasureTeams');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('TreasureTeams', 'activeBuffs');
    await queryInterface.removeColumn('TreasureTeams', 'buffHistory');

    console.log('✅ Removed activeBuffs and buffHistory columns from TreasureTeams');
  },
};
