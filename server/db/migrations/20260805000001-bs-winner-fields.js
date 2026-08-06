'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BattleshipEvents', 'winnerId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('BattleshipEvents', 'completedAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('BattleshipEvents', 'completedAt');
    await queryInterface.removeColumn('BattleshipEvents', 'winnerId');
  },
};
