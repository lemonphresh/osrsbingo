'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('CalendarEvents', 'status', {
      type: Sequelize.STRING, // 'ACTIVE' | 'SAVED'
      allowNull: false,
      defaultValue: 'ACTIVE',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('CalendarEvents', 'status');
  },
};
