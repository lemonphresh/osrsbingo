'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('GroupDashboardActivityReads', {
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      lastReadAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    console.log('✓ Created GroupDashboardActivityReads table');
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('GroupDashboardActivityReads');
    console.log('✓ Dropped GroupDashboardActivityReads table');
  },
};
