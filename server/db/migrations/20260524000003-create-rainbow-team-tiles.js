'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RainbowTeamTiles', {
      teamTileId:          { type: Sequelize.STRING, primaryKey: true },
      teamId:              { type: Sequelize.STRING, allowNull: false, references: { model: 'RainbowTeams', key: 'teamId' } },
      eventId:             { type: Sequelize.STRING, allowNull: false },
      tileCode:            { type: Sequelize.STRING, allowNull: false },
      status: {
        type: Sequelize.ENUM('LOCKED', 'UNLOCKED', 'PRE_SUBMITTED', 'PRE_APPROVED', 'SUBMITTED', 'COMPLETE', 'DENIED'),
        allowNull: false,
        defaultValue: 'LOCKED',
      },
      unlockedAt:          { type: Sequelize.DATE,   allowNull: true },
      completedAt:         { type: Sequelize.DATE,   allowNull: true },
      activeSubmissionId:  { type: Sequelize.STRING, allowNull: true },
      createdAt:           { type: Sequelize.DATE,   allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt:           { type: Sequelize.DATE,   allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('RainbowTeamTiles', ['teamId']);
    await queryInterface.addIndex('RainbowTeamTiles', ['teamId', 'tileCode'], { unique: true });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('RainbowTeamTiles');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_RainbowTeamTiles_status";');
  },
};
