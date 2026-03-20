'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ClanWarsPreScreenshots', {
      preScreenshotId: { type: Sequelize.STRING, primaryKey: true, allowNull: false },
      eventId: {
        type: Sequelize.STRING,
        allowNull: false,
        references: { model: 'ClanWarsEvents', key: 'eventId' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      teamId:            { type: Sequelize.STRING, allowNull: true },
      taskId:            { type: Sequelize.STRING, allowNull: false },
      taskLabel:         { type: Sequelize.STRING, allowNull: true },
      submittedBy:       { type: Sequelize.STRING, allowNull: false },
      submittedUsername: { type: Sequelize.STRING, allowNull: true },
      screenshotUrl:     { type: Sequelize.STRING, allowNull: true },
      channelId:         { type: Sequelize.STRING, allowNull: true },
      messageId:         { type: Sequelize.STRING, allowNull: true },
      submittedAt:       { type: Sequelize.DATE, allowNull: true },
      createdAt:         { type: Sequelize.DATE, allowNull: false },
      updatedAt:         { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('ClanWarsPreScreenshots', ['eventId', 'taskId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ClanWarsPreScreenshots');
  },
};
