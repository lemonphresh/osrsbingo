'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ClanWarsEvents', 'scheduledGatheringStart', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ClanWarsEvents', 'scheduledGatheringStart');
  },
};
