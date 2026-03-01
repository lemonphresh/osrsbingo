const { ApolloError } = require('apollo-server-express');
const { BingoTile } = require('../../db/models');
const sequelize = require('../../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

let popularTilesCache = { data: null, fetchedAt: null };
const POPULAR_TILES_TTL = 10 * 60 * 1000;

module.exports = {
  Query: {
    getPopularTiles: async () => {
      const now = Date.now();
      if (popularTilesCache.data && now - popularTilesCache.fetchedAt < POPULAR_TILES_TTL) {
        return popularTilesCache.data.sort(() => Math.random() - 0.5).slice(0, 100);
      }

      try {
        const { QueryTypes } = require('sequelize');
        const results = await sequelize.query(
          `
        SELECT DISTINCT ON (name) name, icon, COUNT(*) OVER (PARTITION BY name) as "usageCount"
        FROM (
          SELECT name, icon, COUNT(*) as usage_count
          FROM "BingoTiles"
          WHERE name IS NOT NULL AND icon IS NOT NULL
          GROUP BY name, icon
        ) sub
        ORDER BY name, "usageCount" DESC
        LIMIT 1000
      `,
          { type: QueryTypes.SELECT }
        );

        popularTilesCache = { data: results, fetchedAt: now };
        return results.sort(() => Math.random() - 0.5).slice(0, 100);
      } catch (e) {
        logger.error('[getPopularTiles] error:', e.message);
        return [];
      }
    },
  },
  Mutation: {
    editBingoTile: async (_, { id, input }) => {
      try {
        const tile = await BingoTile.findByPk(id);
        tile.set({
          ...input,
        });
        await tile.save();
        const updatedTile = tile.reload();
        return updatedTile;
      } catch (error) {
        logger.error('Error editing BingoTile:', error);
        throw new ApolloError('Failed to update tile');
      }
    },
  },
};
