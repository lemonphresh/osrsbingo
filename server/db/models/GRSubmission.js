// GRSubmission.js
'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class GRSubmission extends Model {
    static associate(models) {
      GRSubmission.belongsTo(models.GRTeam, {
        foreignKey: 'teamId',
        as: 'team',
      });
    }
  }

  GRSubmission.init(
    {
      submissionId: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      teamId: DataTypes.STRING,
      nodeId: DataTypes.STRING,
      submittedBy: DataTypes.STRING, // Discord ID
      submittedByUsername: DataTypes.STRING, // Discord username
      channelId: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Discord channel ID where submission was made',
      },
      proofUrl: DataTypes.STRING,
      status: {
        type: DataTypes.ENUM('pending_review', 'approved', 'denied'),
        defaultValue: 'pending_review',
      },
      reviewedBy: DataTypes.STRING,
      reviewedAt: DataTypes.DATE,
      submittedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'GRSubmission',
      tableName: 'TreasureSubmissions',
    }
  );

  return GRSubmission;
};
