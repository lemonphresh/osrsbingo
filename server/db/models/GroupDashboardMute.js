'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class GroupDashboardMute extends Model {
    static associate() {}
  }

  GroupDashboardMute.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      dashboardId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      modelName: 'GroupDashboardMute',
      tableName: 'GroupDashboardMutes',
      timestamps: false,
    }
  );

  return GroupDashboardMute;
};
