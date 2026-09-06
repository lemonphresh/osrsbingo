'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BattleshipEvents', 'scheduledPlacementStart', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('BattleshipEvents', 'scheduledPlacementStart');
  },
};
