'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('CalendarEvents', 'eventType', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'MISC',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('CalendarEvents', 'eventType');
  },
};
