'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TreasureNodes', {
      nodeId: {
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
      nodeType: {
        type: Sequelize.ENUM('START', 'STANDARD', 'INN', 'TREASURE'),
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      coordinates: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      mapLocation: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      prerequisites: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        allowNull: false,
      },
      unlocks: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        allowNull: false,
      },
      paths: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        allowNull: false,
      },
      objective: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      rewards: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      difficultyTier: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      innTier: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      availableRewards: {
        type: Sequelize.JSONB,
        allowNull: true,
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

    await queryInterface.addIndex('TreasureNodes', ['eventId']);
    await queryInterface.addIndex('TreasureNodes', ['nodeType']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TreasureNodes');
  },
};
