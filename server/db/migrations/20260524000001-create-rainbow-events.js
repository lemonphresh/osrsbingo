'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('RainbowEvents', {
      eventId:        { type: Sequelize.STRING, primaryKey: true },
      eventName:      { type: Sequelize.STRING, allowNull: false },
      status:         { type: Sequelize.ENUM('ACTIVE', 'PAUSED', 'COMPLETE'), allowNull: false, defaultValue: 'ACTIVE' },
      startDate:      { type: Sequelize.DATE,   allowNull: true },
      endDate:        { type: Sequelize.DATE,   allowNull: true },
      adminIds:       { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: false, defaultValue: [] },
      staffChannelId: { type: Sequelize.STRING, allowNull: true },
      tileGraph:      { type: Sequelize.JSONB,  allowNull: false, defaultValue: '{}' },
      createdAt:      { type: Sequelize.DATE,   allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt:      { type: Sequelize.DATE,   allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('RainbowEvents');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_RainbowEvents_status";');
  },
};
