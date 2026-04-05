'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('CalendarEvents', 'publishStatus', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'OFFICIAL',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('CalendarEvents', 'publishStatus');
  },
};
