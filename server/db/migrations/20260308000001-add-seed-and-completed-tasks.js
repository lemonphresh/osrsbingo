'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add seed to ClanWarsEvents — one deterministic RNG seed per event,
    // used for item drop randomization when approving submissions.
    await queryInterface.addColumn('ClanWarsEvents', 'seed', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Add completedTaskIds to ClanWarsTeams — per-team array of task IDs
    // that this team has completed. Available tasks = all event tasks - completedTaskIds.
    await queryInterface.addColumn('ClanWarsTeams', 'completedTaskIds', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: [],
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ClanWarsEvents', 'seed');
    await queryInterface.removeColumn('ClanWarsTeams', 'completedTaskIds');
  },
};
