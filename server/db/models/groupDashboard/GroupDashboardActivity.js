'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class GroupDashboardActivity extends Model {
    static associate(models) {
      GroupDashboardActivity.belongsTo(models.GroupDashboard, { foreignKey: 'dashboardId', as: 'dashboard' });
      GroupDashboardActivity.belongsTo(models.GroupGoalEvent, { foreignKey: 'eventId', as: 'event' });
    }
  }

  GroupDashboardActivity.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      dashboardId: { type: DataTypes.INTEGER, allowNull: false },
      eventId: { type: DataTypes.INTEGER, allowNull: true },
      type: { type: DataTypes.STRING, allowNull: false },
      metadata: { type: DataTypes.JSONB, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      modelName: 'GroupDashboardActivity',
      tableName: 'GroupDashboardActivities',
      updatedAt: false,
    }
  );

  return GroupDashboardActivity;
};
