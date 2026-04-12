'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('CalendarSettings', 'monthlyMessages', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('CalendarSettings', 'monthlyMessages');
  },
};
