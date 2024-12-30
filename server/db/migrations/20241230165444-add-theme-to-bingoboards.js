'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BingoBoards', 'theme', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'DEFAULT',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('BingoBoards', 'theme');
  },
};
