const { ApolloError } = require('apollo-server-express');
const { BingoBoard } = require('../../db/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = {
  Mutation: {
    createBingoBoard: async (_, { type, isPublic, editors, team, bonusSettings }, context) => {
      try {
        const newBingoBoard = await BingoBoard.create({
          type,
          isPublic,
          editors: editors || [context.user.id],
          team,
          bonusSettings,
          userId: context.user.id,
        });

        return newBingoBoard;
      } catch (error) {
        console.error('Error creating BingoBoard:', error);
        throw new ApolloError('Failed to create BingoBoard');
      }
    },
  },
  Query: {},
};
