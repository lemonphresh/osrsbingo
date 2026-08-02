'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CFSubmission extends Model {
    static associate(models) {
      CFSubmission.belongsTo(models.CFEvent, { foreignKey: 'eventId', as: 'event' });
      CFSubmission.belongsTo(models.CFTeam,  { foreignKey: 'teamId', as: 'team' });
    }
  }

  CFSubmission.init(
    {
      submissionId:      { type: DataTypes.STRING, primaryKey: true },
      eventId:           { type: DataTypes.STRING, allowNull: false },
      teamId:            { type: DataTypes.STRING, allowNull: false },
      submittedBy:       { type: DataTypes.STRING, allowNull: false },
      submittedUsername: { type: DataTypes.STRING, allowNull: true },
      channelId:         { type: DataTypes.STRING, allowNull: true },
      taskId:            { type: DataTypes.STRING, allowNull: false },
      taskLabel:         { type: DataTypes.STRING, allowNull: true },
      difficulty: {
        type: DataTypes.ENUM('initiate', 'adept', 'master'),
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('SKILLER', 'PVMER'),
        allowNull: true,
      },
      screenshot:   { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'DENIED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      rewardSlot:   { type: DataTypes.STRING, allowNull: true },
      rewardItemId: { type: DataTypes.STRING, allowNull: true },
      reviewedBy:   { type: DataTypes.STRING, allowNull: true },
      reviewNote:   { type: DataTypes.STRING, allowNull: true },
      reviewedAt:   { type: DataTypes.DATE, allowNull: true },
      submittedAt:  { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, modelName: 'CFSubmission', tableName: 'ClanWarsSubmissions' }
  );

  return CFSubmission;
};
