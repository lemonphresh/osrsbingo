'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TreasureEvents', {
      eventId: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      clanId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      eventName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED'),
        defaultValue: 'DRAFT',
        allowNull: false,
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      eventConfig: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      derivedValues: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      mapStructure: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      discordConfig: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      creatorId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TreasureEvents');
  },
};
