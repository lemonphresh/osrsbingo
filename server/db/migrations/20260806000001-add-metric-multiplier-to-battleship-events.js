'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BattleshipEvents', 'metricMultiplier', {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('BattleshipEvents', 'metricMultiplier');
  },
};
