'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('BattleshipSubmissions', 'submissionType', {
      type: Sequelize.ENUM('PRESCREENSHOT', 'SUBMISSION'),
      allowNull: false,
      defaultValue: 'SUBMISSION',
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('BattleshipSubmissions', 'submissionType');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_BattleshipSubmissions_submissionType";');
  },
};
