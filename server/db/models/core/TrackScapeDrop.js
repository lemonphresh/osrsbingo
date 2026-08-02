'use strict';

module.exports = (sequelize, DataTypes) => {
  const TrackScapeDrop = sequelize.define(
    'TrackScapeDrop',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      discordMessageId: { type: DataTypes.STRING, allowNull: false, unique: true },
      player: { type: DataTypes.STRING, allowNull: false },
      type: { type: DataTypes.ENUM('drop', 'pet'), allowNull: false },
      item: { type: DataTypes.STRING, allowNull: true },
      value: { type: DataTypes.BIGINT, allowNull: true },
      droppedAt: { type: DataTypes.DATE, allowNull: false },
      month: { type: DataTypes.STRING(7), allowNull: false },
      rawText: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'TrackScapeDrops' }
  );
  return TrackScapeDrop;
};
