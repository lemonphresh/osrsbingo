'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ClanWarsPreScreenshot extends Model {
    static associate(models) {
      ClanWarsPreScreenshot.belongsTo(models.ClanWarsEvent, { foreignKey: 'eventId', as: 'event' });
    }
  }

  ClanWarsPreScreenshot.init(
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
    { sequelize, modelName: 'ClanWarsPreScreenshot' }
  );

  return ClanWarsPreScreenshot;
};
