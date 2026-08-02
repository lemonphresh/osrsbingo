'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CFPreScreenshot extends Model {
    static associate(models) {
      CFPreScreenshot.belongsTo(models.CFEvent, { foreignKey: 'eventId', as: 'event' });
    }
  }

  CFPreScreenshot.init(
    {
      preScreenshotId:   { type: DataTypes.STRING, primaryKey: true },
      eventId:           { type: DataTypes.STRING, allowNull: false },
      teamId:            { type: DataTypes.STRING, allowNull: true },
      taskId:            { type: DataTypes.STRING, allowNull: false },
      taskLabel:         { type: DataTypes.STRING, allowNull: true },
      submittedBy:       { type: DataTypes.STRING, allowNull: false },
      submittedUsername: { type: DataTypes.STRING, allowNull: true },
      screenshotUrl:     { type: DataTypes.STRING, allowNull: true },
      channelId:         { type: DataTypes.STRING, allowNull: true },
      messageId:         { type: DataTypes.STRING, allowNull: true },
      submittedAt:       { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, modelName: 'CFPreScreenshot', tableName: 'ClanWarsPreScreenshots' }
  );

  return CFPreScreenshot;
};
