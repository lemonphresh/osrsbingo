'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('RainbowTeams', 'teamToken', {
      type: Sequelize.STRING(16),
      allowNull: true,
      unique: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('RainbowTeams', 'teamToken');
  },
};
