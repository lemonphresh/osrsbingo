'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BSSubmission extends Model {
    static associate(models) {
      BSSubmission.belongsTo(models.BSEvent, { foreignKey: 'eventId', as: 'event' });
      BSSubmission.belongsTo(models.BSTile,  { foreignKey: 'tileId',  as: 'tile'  });
      BSSubmission.belongsTo(models.BSTeam,  { foreignKey: 'teamId',  as: 'team'  });
    }
  }

  BSSubmission.init(
    {
      submissionId:     { type: DataTypes.STRING, primaryKey: true },
      eventId:          { type: DataTypes.STRING, allowNull: false },
      tileId:           { type: DataTypes.STRING, allowNull: false },
      boardId:          { type: DataTypes.STRING, allowNull: false },
      teamId:           { type: DataTypes.STRING, allowNull: false },
      tileLabel:        { type: DataTypes.TEXT,   allowNull: true },
      discordUserId:    { type: DataTypes.STRING, allowNull: true },
      discordUsername:  { type: DataTypes.STRING, allowNull: true },
      screenshotUrl:    { type: DataTypes.TEXT,   allowNull: true },
      channelId:        { type: DataTypes.STRING, allowNull: true },
      discordMessageId: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'DENIED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      reviewedBy:   { type: DataTypes.STRING, allowNull: true },
      reviewedAt:   { type: DataTypes.DATE,   allowNull: true },
      denialReason: { type: DataTypes.TEXT,   allowNull: true },
      submittedAt:  { type: DataTypes.DATE,   allowNull: true },
    },
    { sequelize, modelName: 'BSSubmission', tableName: 'BattleshipSubmissions' }
  );

  return BSSubmission;
};
