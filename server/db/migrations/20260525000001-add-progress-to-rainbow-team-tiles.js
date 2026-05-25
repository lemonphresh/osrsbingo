'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('RainbowTeamTiles', 'progress', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('RainbowTeamTiles', 'progress');
  },
};
