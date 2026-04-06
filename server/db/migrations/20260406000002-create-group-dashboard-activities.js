'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('GroupDashboardActivities', {
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
      eventId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'GroupGoalEvents', key: 'id' },
        onDelete: 'SET NULL',
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        // event_started | event_ended | milestone_25 | milestone_50 | milestone_75 | milestone_100
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('GroupDashboardActivities', ['dashboardId', 'createdAt']);

    console.log('✓ Created GroupDashboardActivities table');
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('GroupDashboardActivities');
    console.log('✓ Dropped GroupDashboardActivities table');
  },
};
