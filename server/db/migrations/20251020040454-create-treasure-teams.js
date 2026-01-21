'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TreasureTeams', {
      teamId: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      eventId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'TreasureEvents',
          key: 'eventId',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      teamName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      discordRoleId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      members: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        allowNull: false,
      },
      currentPot: {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false,
      },
      keysHeld: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false,
      },
      completedNodes: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        allowNull: false,
      },
      availableNodes: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        allowNull: false,
      },
      innTransactions: {
        type: Sequelize.JSONB,
        defaultValue: [],
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('TreasureTeams', ['eventId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TreasureTeams');
  },
};
