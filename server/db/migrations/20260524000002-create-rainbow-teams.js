'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RainbowTeams', {
      teamId:           { type: Sequelize.STRING, primaryKey: true },
      eventId:          { type: Sequelize.STRING, allowNull: false, references: { model: 'RainbowEvents', key: 'eventId' } },
      teamName:         { type: Sequelize.STRING, allowNull: false },
      discordChannelId: { type: Sequelize.STRING, allowNull: false },
      captainDiscordId: { type: Sequelize.STRING, allowNull: true },
      notes:            { type: Sequelize.TEXT,   allowNull: true },
      createdAt:        { type: Sequelize.DATE,   allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt:        { type: Sequelize.DATE,   allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('RainbowTeams', ['eventId']);
    await queryInterface.addIndex('RainbowTeams', ['discordChannelId'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('RainbowTeams');
  },
};
