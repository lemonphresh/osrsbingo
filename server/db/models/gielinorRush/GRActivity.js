module.exports = (sequelize, DataTypes) => {
  const GRActivity = sequelize.define('GRActivity', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    eventId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    teamId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    data: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'TreasureActivities',
  });

  return GRActivity;
};
