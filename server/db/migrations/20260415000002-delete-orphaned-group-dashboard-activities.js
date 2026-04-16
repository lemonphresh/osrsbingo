'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      DELETE FROM "GroupDashboardActivities"
      WHERE "eventId" IS NOT NULL
        AND "eventId" NOT IN (SELECT id FROM "GroupGoalEvents")
    `);
  },
  down: async () => {
    // Irreversible — deleted rows cannot be restored
  },
};
