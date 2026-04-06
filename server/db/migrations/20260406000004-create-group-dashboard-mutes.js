'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('GroupDashboardMutes', {
      userId: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
      dashboardId: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });
    await queryInterface.addIndex('GroupDashboardMutes', ['userId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('GroupDashboardMutes');
  },
};
