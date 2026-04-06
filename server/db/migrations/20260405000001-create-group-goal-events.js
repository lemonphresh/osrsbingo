'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('GroupGoalEvents', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      dashboardId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'GroupDashboards', key: 'id' },
        onDelete: 'CASCADE',
      },
      eventName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      goals: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      cachedData: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      lastSyncedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      },
      notificationsSent: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    console.log('✓ Created GroupGoalEvents table');
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('GroupGoalEvents');
    console.log('✓ Dropped GroupGoalEvents table');
  },
};
