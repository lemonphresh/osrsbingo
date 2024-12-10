'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('BingoBoards', 'userId', {
      type: Sequelize.INTEGER,
      references: {
        model: 'Users', // The name of the table that you're referencing
        key: 'id', // The key you're referencing (typically the primary key of the Users table)
      },
      allowNull: false, // Make it non-nullable (or change this depending on your requirements)
      onDelete: 'CASCADE', // Automatically delete BingoBoards if the associated User is deleted
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('BingoBoards', 'userId');
  },
};
