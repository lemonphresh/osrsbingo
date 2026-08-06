'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BattleshipEvents', 'initialSkipTokens', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 2,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('BattleshipEvents', 'initialSkipTokens');
  },
};
