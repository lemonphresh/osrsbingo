'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('TreasureTeams', 'nodeNotes', {
      type: Sequelize.JSONB,
      defaultValue: {},
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('TreasureTeams', 'nodeNotes');
  },
};
