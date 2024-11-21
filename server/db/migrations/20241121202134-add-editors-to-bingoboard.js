'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('BingoBoards', 'editors', {
      type: Sequelize.ARRAY(Sequelize.INTEGER), // Assuming 'editors' is an array of user IDs
      allowNull: true,
      defaultValue: [],
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('BingoBoards', 'editors');
  },
};
