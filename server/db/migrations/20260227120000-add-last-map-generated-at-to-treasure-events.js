'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('TreasureEvents', 'lastMapGeneratedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('TreasureEvents', 'lastMapGeneratedAt');
  },
};
