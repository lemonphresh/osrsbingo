const { ApolloError } = require('apollo-server-express');
const { BingoTile } = require('../../db/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {
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
  Query: {},
};
