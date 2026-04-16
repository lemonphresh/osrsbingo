'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('GroupDashboards', 'leaguesWomGroupId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('GroupDashboards', 'leaguesWomGroupId');
  },
};
