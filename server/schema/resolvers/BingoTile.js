const { ApolloError } = require('apollo-server-express');
const { BingoTile } = require('../../db/models');
const sequelize = require('../../db/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {
  Query: {
    getPopularTiles: async () => {
      try {
        const { QueryTypes } = require('sequelize');
        const results = await sequelize.query(
          `
  SELECT name, icon, usage_count as "usageCount"
  FROM (
    SELECT DISTINCT ON (name) name, icon, COUNT(*) OVER (PARTITION BY name) as usage_count
    FROM (
      SELECT name, icon, COUNT(*) as usage_count
      FROM "BingoTiles"
      WHERE name IS NOT NULL AND icon IS NOT NULL
      GROUP BY name, icon
    ) sub
    ORDER BY name, usage_count DESC
    LIMIT 1000
  ) top1000
  ORDER BY RANDOM()
  LIMIT 105
`,
          { type: QueryTypes.SELECT }
        );
        return results;
      } catch (e) {
        console.error('[getPopularTiles] error:', e.message);
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
        throw new Error('Failed to update tile');
      }
    },
  },
};
