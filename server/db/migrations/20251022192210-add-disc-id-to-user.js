'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Users', 'discordUserId', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });

    // Add index for faster lookups
    await queryInterface.addIndex('Users', ['discordUserId'], {
      name: 'users_discord_user_id_idx',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('Users', 'users_discord_user_id_idx');
    await queryInterface.removeColumn('Users', 'discordUserId');
  },
};
