'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('CalendarSettings', 'discordMessageId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('CalendarSettings', 'discordMessageMonth', {
      type: Sequelize.STRING, // stored as "YYYY-MM"
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('CalendarSettings', 'discordMessageId');
    await queryInterface.removeColumn('CalendarSettings', 'discordMessageMonth');
  },
};
