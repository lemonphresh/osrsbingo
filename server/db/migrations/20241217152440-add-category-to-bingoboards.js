'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('BingoBoards', 'category', {
      type: Sequelize.ENUM('PvM', 'PvP', 'Skilling', 'Social', 'Featured', 'Other'),
      allowNull: false,
      defaultValue: 'Other',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('BingoBoards', 'category');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_BingoBoards_category";');
  },
};
