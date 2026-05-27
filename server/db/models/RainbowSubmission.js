'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class RainbowSubmission extends Model {
    static associate(models) {
      RainbowSubmission.belongsTo(models.RainbowEvent, { foreignKey: 'eventId', as: 'event' });
      RainbowSubmission.belongsTo(models.RainbowTeam,  { foreignKey: 'teamId',  as: 'team' });
    }
  }

  RainbowSubmission.init(
    {
      submissionId:     { type: DataTypes.STRING, primaryKey: true },
      teamId:           { type: DataTypes.STRING, allowNull: false },
      eventId:          { type: DataTypes.STRING, allowNull: false },
      tileCode:         { type: DataTypes.STRING, allowNull: false },
      type: {
        type: DataTypes.ENUM('PRE', 'FINAL'),
        allowNull: false,
      },
      screenshotUrl:    { type: DataTypes.TEXT,   allowNull: true },
      discordMessageId: { type: DataTypes.STRING, allowNull: true },
      channelId:        { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'DENIED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      discordUsername:  { type: DataTypes.STRING, allowNull: true },
      discordUserId:    { type: DataTypes.STRING, allowNull: true },
      reviewedBy:       { type: DataTypes.STRING, allowNull: true },
      reviewedAt:       { type: DataTypes.DATE,   allowNull: true },
      denialReason:     { type: DataTypes.TEXT,   allowNull: true },
      submittedAt:      { type: DataTypes.DATE,   allowNull: true },
    },
    { sequelize, modelName: 'RainbowSubmission' },
  );

  return RainbowSubmission;
};
