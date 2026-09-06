'use strict';

// Prize pool: the total gp the admin has allocated to house rewards for the
// event. Split evenly across teams first, then across each team's houses.
// Snapshotted onto each team at the SETUP→ACTIVE transition so subsequent
// team additions don't retroactively change what teams have already earned.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('SpoopyEvents', 'prizePool', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn('SpoopyTeams', 'poolAllocation', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('SpoopyTeams', 'poolAllocation');
    await queryInterface.removeColumn('SpoopyEvents', 'prizePool');
  },
};
