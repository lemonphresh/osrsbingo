'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class GroupGoalEvent extends Model {
    static associate(models) {
      GroupGoalEvent.belongsTo(models.GroupDashboard, { foreignKey: 'dashboardId', as: 'dashboard' });
    }

    get isVisible() {
      const now = new Date();
      const end = new Date(this.endDate);
      end.setDate(end.getDate() + 5);
      return now >= new Date(this.startDate) && now <= end;
    }
  }

  GroupGoalEvent.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      dashboardId: { type: DataTypes.INTEGER, allowNull: false },
      eventName: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      startDate: { type: DataTypes.DATE, allowNull: false },
      endDate: { type: DataTypes.DATE, allowNull: false },
      goals: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
      cachedData: { type: DataTypes.JSONB, allowNull: true },
      lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
      notificationsSent: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      finalSnapshot: { type: DataTypes.JSONB, allowNull: true },
    },
    {
      sequelize,
      modelName: 'GroupGoalEvent',
      tableName: 'GroupGoalEvents',
    }
  );

  return GroupGoalEvent;
};
