'use strict';
module.exports = (sequelize, DataTypes) => {
  const CalendarEvent = sequelize.define(
    'CalendarEvent',
    {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT },
      start: { type: DataTypes.DATE, allowNull: false },
      end: { type: DataTypes.DATE, allowNull: false },
      allDay: { type: DataTypes.BOOLEAN, defaultValue: false },
      eventType: { type: DataTypes.STRING, allowNull: false, defaultValue: 'MISC' },
      status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'ACTIVE' },
      publishStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: 'OFFICIAL' },
      threadUrl: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'CalendarEvents' }
  );
  return CalendarEvent;
};
