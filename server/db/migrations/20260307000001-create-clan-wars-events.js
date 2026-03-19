'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ClanWarsEvents', {
      eventId: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      clanId: { type: Sequelize.STRING, allowNull: true },
      eventName: { type: Sequelize.STRING, allowNull: false },
      status: {
        type: Sequelize.ENUM('DRAFT', 'GATHERING', 'OUTFITTING', 'BATTLE', 'COMPLETED', 'ARCHIVED'),
        allowNull: false,
        defaultValue: 'DRAFT',
      },
      gatheringStart: { type: Sequelize.DATE, allowNull: true },
      gatheringEnd:   { type: Sequelize.DATE, allowNull: true },
      outfittingEnd:  { type: Sequelize.DATE, allowNull: true },
      eventConfig: { type: Sequelize.JSONB, allowNull: true },
      bracket:     { type: Sequelize.JSONB, allowNull: true },
      creatorId:   { type: Sequelize.STRING, allowNull: true },
      adminIds: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ClanWarsEvents');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ClanWarsEvents_status"');
  },
};
