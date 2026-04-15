'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('GroupGoalEvents', 'finalSnapshot', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('GroupGoalEvents', 'finalSnapshot');
  },
};
