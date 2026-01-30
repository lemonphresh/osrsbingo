'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDescription = await queryInterface.describeTable('Users');

    // Add discordUsername if it doesn't exist
    if (!tableDescription.discordUsername) {
      await queryInterface.addColumn('Users', 'discordUsername', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Add discordAvatar if it doesn't exist
    if (!tableDescription.discordAvatar) {
      await queryInterface.addColumn('Users', 'discordAvatar', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'discordUsername');
    await queryInterface.removeColumn('Users', 'discordAvatar');
  },
};
