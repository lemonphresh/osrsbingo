'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ClanWarsEvents', 'difficulty', {
      type: Sequelize.ENUM('casual', 'standard', 'hardcore'),
      allowNull: false,
      defaultValue: 'standard',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('ClanWarsEvents', 'difficulty');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_ClanWarsEvents_difficulty";'
    );
  },
};
