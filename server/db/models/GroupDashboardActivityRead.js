'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class GroupDashboardActivityRead extends Model {}

  GroupDashboardActivityRead.init(
    {
      userId: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
      lastReadAt: { type: DataTypes.DATE, allowNull: false },
    },
    {
      sequelize,
      modelName: 'GroupDashboardActivityRead',
      tableName: 'GroupDashboardActivityReads',
      timestamps: false,
    }
  );

  return GroupDashboardActivityRead;
};
