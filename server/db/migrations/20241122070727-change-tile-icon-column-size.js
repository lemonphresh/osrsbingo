'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('BingoTiles', 'icon', {
      type: Sequelize.TEXT, // Or Sequelize.STRING(1024)
      allowNull: true, // Make sure this matches the original column settings
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('BingoTiles', 'icon', {
      type: Sequelize.STRING(255), // Revert back to original column size
      allowNull: true,
    });
  },
};
