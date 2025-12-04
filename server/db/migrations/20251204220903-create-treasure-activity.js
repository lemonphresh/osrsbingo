'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TreasureActivities', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      eventId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      teamId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      data: {
        type: Sequelize.JSON,
        defaultValue: {},
      },
      timestamp: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes for faster queries
    await queryInterface.addIndex('TreasureActivities', ['eventId']);
    await queryInterface.addIndex('TreasureActivities', ['teamId']);
    await queryInterface.addIndex('TreasureActivities', ['eventId', 'timestamp']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TreasureActivities');
  },
};
