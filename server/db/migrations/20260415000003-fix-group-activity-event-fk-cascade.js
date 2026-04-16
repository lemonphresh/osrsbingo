'use strict';
module.exports = {
  up: async (queryInterface) => {
    // Remove activities whose event was deleted (eventId set to NULL by old SET NULL constraint)
    await queryInterface.sequelize.query(`
      DELETE FROM "GroupDashboardActivities" WHERE "eventId" IS NULL
    `);

    // Change FK from SET NULL → CASCADE so future event deletes clean up activities automatically
    await queryInterface.sequelize.query(`
      ALTER TABLE "GroupDashboardActivities"
        DROP CONSTRAINT IF EXISTS "GroupDashboardActivities_eventId_fkey";
      ALTER TABLE "GroupDashboardActivities"
        ADD CONSTRAINT "GroupDashboardActivities_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "GroupGoalEvents" (id)
        ON DELETE CASCADE ON UPDATE CASCADE;
    `);
  },
  down: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "GroupDashboardActivities"
        DROP CONSTRAINT IF EXISTS "GroupDashboardActivities_eventId_fkey";
      ALTER TABLE "GroupDashboardActivities"
        ADD CONSTRAINT "GroupDashboardActivities_eventId_fkey"
        FOREIGN KEY ("eventId") REFERENCES "GroupGoalEvents" (id)
        ON DELETE SET NULL ON UPDATE CASCADE;
    `);
  },
};
