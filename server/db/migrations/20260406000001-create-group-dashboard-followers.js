'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('GroupDashboardFollowers', {
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      dashboardId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'GroupDashboards', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('GroupDashboardFollowers', {
      fields: ['userId', 'dashboardId'],
      type: 'primary key',
      name: 'group_dashboard_followers_pkey',
    });

    console.log('✓ Created GroupDashboardFollowers table');
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('GroupDashboardFollowers');
    console.log('✓ Dropped GroupDashboardFollowers table');
  },
};
