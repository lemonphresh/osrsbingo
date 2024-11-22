'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change completedBy from INTEGER to STRING
    await queryInterface.changeColumn('BingoTiles', 'completedBy', {
      type: Sequelize.STRING,
      allowNull: true, // Adjust as per your requirements
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert completedBy back to INTEGER
    await queryInterface.changeColumn('BingoTiles', 'completedBy', {
      type: Sequelize.INTEGER,
      allowNull: true, // Adjust as per your original schema
    });
  },
};
