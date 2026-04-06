'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('GroupDashboards', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      groupName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      womGroupId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      creatorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'SET NULL',
      },
      adminIds: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: false,
        defaultValue: [],
      },
      theme: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      discordConfig: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null,
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

    console.log('✓ Created GroupDashboards table');
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('GroupDashboards');
    console.log('✓ Dropped GroupDashboards table');
  },
};
