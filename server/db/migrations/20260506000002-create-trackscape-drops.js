'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('TrackScapeDrops', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      discordMessageId: { type: Sequelize.STRING, allowNull: false, unique: true },
      player: { type: Sequelize.STRING, allowNull: false },
      type: { type: Sequelize.ENUM('drop', 'pet'), allowNull: false },
      item: { type: Sequelize.STRING, allowNull: true },
      value: { type: Sequelize.BIGINT, allowNull: true },
      droppedAt: { type: Sequelize.DATE, allowNull: false },
      month: { type: Sequelize.STRING(7), allowNull: false },
      rawText: { type: Sequelize.TEXT, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('TrackScapeDrops', ['month']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('TrackScapeDrops');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_TrackScapeDrops_type";');
  },
};
