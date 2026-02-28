'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('TreasureEvents');
    if (!tableDescription.startMessageSent) {
      await queryInterface.addColumn('TreasureEvents', 'startMessageSent', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('TreasureEvents', 'startMessageSent');
  },
};
