'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class GroupDashboard extends Model {
    static associate(models) {
      GroupDashboard.hasMany(models.GroupGoalEvent, { foreignKey: 'dashboardId', as: 'events' });
      GroupDashboard.hasMany(models.GroupDashboardFollower, { foreignKey: 'dashboardId', as: 'followers' });
      GroupDashboard.hasMany(models.GroupDashboardActivity, { foreignKey: 'dashboardId', as: 'activities' });
    }
  }

  GroupDashboard.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      slug: { type: DataTypes.STRING, allowNull: false, unique: true },
      groupName: { type: DataTypes.STRING, allowNull: false },
      womGroupId: { type: DataTypes.STRING, allowNull: false },
      creatorId: { type: DataTypes.INTEGER, allowNull: false },
      adminIds: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
        defaultValue: [],
      },
      theme: { type: DataTypes.JSONB, allowNull: true },
      discordConfig: { type: DataTypes.JSONB, allowNull: true },
      goalTemplates: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      leaguesWomGroupId: { type: DataTypes.STRING, allowNull: true },
    },
    {
      sequelize,
      modelName: 'GroupDashboard',
      tableName: 'GroupDashboards',
    }
  );

  return GroupDashboard;
};
