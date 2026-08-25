'use strict';

// PRE-submissions are informational (proof of the starting state) and don't
// advance the tile. FINAL submissions transition the tile to SUBMITTED for
// ref review. Mirrors the Rainbow Bingo pattern.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('SpoopySubmissions', 'type', {
      type: Sequelize.ENUM('PRE', 'FINAL'),
      allowNull: false,
      defaultValue: 'FINAL',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('SpoopySubmissions', 'type');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_SpoopySubmissions_type";');
  },
};
