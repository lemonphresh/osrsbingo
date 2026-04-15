'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('GroupDashboards', 'goalTemplates', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('GroupDashboards', 'goalTemplates');
  },
};
