'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class GroupDashboardFollower extends Model {
    static associate(models) {
      GroupDashboardFollower.belongsTo(models.GroupDashboard, { foreignKey: 'dashboardId' });
    }
  }

  GroupDashboardFollower.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      dashboardId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    },
    {
      sequelize,
      modelName: 'GroupDashboardFollower',
      tableName: 'GroupDashboardFollowers',
      timestamps: false,
    }
  );

  return GroupDashboardFollower;
};
