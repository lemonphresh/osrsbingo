'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BattleshipTasks', 'bossOrSkill',  { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('BattleshipTasks', 'metricType',   { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('BattleshipTasks', 'metricTarget', { type: Sequelize.INTEGER, allowNull: true });
    await queryInterface.addColumn('BattleshipTasks', 'metricUnit',   { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('BattleshipTasks', 'metricLabel',  { type: Sequelize.STRING, allowNull: true });
    await queryInterface.addColumn('BattleshipTasks', 'validDrops', {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: false,
      defaultValue: [],
    });
    await queryInterface.addColumn('BattleshipTasks', 'womMetric', { type: Sequelize.STRING, allowNull: true });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('BattleshipTasks', 'bossOrSkill');
    await queryInterface.removeColumn('BattleshipTasks', 'metricType');
    await queryInterface.removeColumn('BattleshipTasks', 'metricTarget');
    await queryInterface.removeColumn('BattleshipTasks', 'metricUnit');
    await queryInterface.removeColumn('BattleshipTasks', 'metricLabel');
    await queryInterface.removeColumn('BattleshipTasks', 'validDrops');
    await queryInterface.removeColumn('BattleshipTasks', 'womMetric');
  },
};
