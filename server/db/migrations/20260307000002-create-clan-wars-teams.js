'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ClanWarsTeams', {
      teamId: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      eventId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'ClanWarsEvents', key: 'eventId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      teamName:         { type: Sequelize.STRING, allowNull: false },
      discordRoleId:    { type: Sequelize.STRING, allowNull: true },
      members:          { type: Sequelize.JSONB, allowNull: true },
      officialLoadout:  { type: Sequelize.JSONB, allowNull: true },
      loadoutLocked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      captainDiscordId: { type: Sequelize.STRING, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('ClanWarsTeams', ['eventId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ClanWarsTeams');
  },
};
