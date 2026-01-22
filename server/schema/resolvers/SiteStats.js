const {
  SiteStats,
  BingoBoard,
  BingoTile,
  User,
  TreasureEvent,
  TreasureTeam,
} = require('../../db/models');
const { Op } = require('sequelize');

// Simple in-memory cache
let statsCache = null;
let statsCacheTime = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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

    getSiteStats: async () => {
      try {
        // Return cached if fresh
        if (statsCache && statsCacheTime && Date.now() - statsCacheTime < CACHE_TTL) {
          return statsCache;
        }

        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [
          totalBoards,
          totalUsers,
          totalTiles,
          completedTiles,
          boardsThisWeek,
          usersThisWeek,
          publicBoards,
          visitStats,
        ] = await Promise.all([
          BingoBoard.count(),
          User.count(),
          BingoTile.count(),
          BingoTile.count({ where: { isComplete: true } }),
          BingoBoard.count({ where: { createdAt: { [Op.gte]: oneWeekAgo } } }),
          User.count({ where: { createdAt: { [Op.gte]: oneWeekAgo } } }),
          BingoBoard.count({ where: { isPublic: true } }),
          SiteStats.findByPk(1),
        ]);

        const stats = {
          totalBoards,
          totalUsers,
          totalTiles,
          completedTiles,
          boardsThisWeek,
          usersThisWeek,
          publicBoards,
          totalVisits: parseInt(visitStats?.visitCount) || 0,
          completionRate: totalTiles > 0 ? Math.round((completedTiles / totalTiles) * 100) : 0,
        };

        // Cache it
        statsCache = stats;
        statsCacheTime = Date.now();

        return stats;
      } catch (error) {
        console.error('[getSiteStats] Error:', error);
        throw error;
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

        const currentCount = parseInt(stats.visitCount) || 0;
        const newCount = currentCount + 1;
        stats.visitCount = newCount;

        await stats.save();

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
