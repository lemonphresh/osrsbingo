const { SiteStats } = require('../../db/models');

const resolvers = {
  Query: {
    getVisitCount: async () => {
      try {
        const stats = await SiteStats.findByPk(1);
        const count = parseInt(stats?.visitCount) || 0;
        return count;
      } catch (error) {
        console.error('[getVisitCount] Error:', error);
        return 0;
      }
    },
  },
  Mutation: {
    incrementVisit: async () => {
      try {
        const [stats, created] = await SiteStats.findOrCreate({
          where: { id: 1 },
          defaults: {
            id: 1,
            visitCount: 0,
          },
        });

        // PARSE AS INTEGER to avoid string concatenation!
        const currentCount = parseInt(stats.visitCount) || 0;
        const newCount = currentCount + 1;
        stats.visitCount = newCount;

        await stats.save();

        // Return as integer
        return parseInt(stats.visitCount);
      } catch (error) {
        console.error('[incrementVisit] Error:', error);
        console.error('[incrementVisit] Stack:', error.stack);
        return 1;
      }
    },
  },
};

module.exports = resolvers;
