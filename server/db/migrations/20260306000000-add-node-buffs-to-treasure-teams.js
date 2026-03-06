'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('TreasureTeams', 'nodeBuffs', {
      type: Sequelize.JSONB,
      defaultValue: {},
      allowNull: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('TreasureTeams', 'nodeBuffs');
  },
};
