'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BattleshipPlacementSuggestions', {
      suggestionId: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      eventId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      teamId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      proposerDiscordId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      proposerUsername: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      ships: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      votes: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('BattleshipPlacementSuggestions', ['teamId']);
    await queryInterface.addIndex('BattleshipPlacementSuggestions', ['eventId']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('BattleshipPlacementSuggestions');
  },
};
