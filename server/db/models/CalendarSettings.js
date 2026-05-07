'use strict';
module.exports = (sequelize, DataTypes) => {
  const CalendarSettings = sequelize.define(
    'CalendarSettings',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      discordChannelId: { type: DataTypes.STRING, allowNull: true },
      discordRoleId: { type: DataTypes.STRING, allowNull: true },
      discordMessageId: { type: DataTypes.STRING, allowNull: true },
      discordMessageMonth: { type: DataTypes.STRING, allowNull: true },
      monthlyMessages: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
      trackscapeChannelId: { type: DataTypes.STRING, allowNull: true },
    },
    { tableName: 'CalendarSettings' }
  );
  return CalendarSettings;
};
