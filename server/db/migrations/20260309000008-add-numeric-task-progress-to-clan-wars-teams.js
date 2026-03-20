'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ClanWarsTeams', 'numericTaskProgress', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ClanWarsTeams', 'numericTaskProgress');
  },
};
