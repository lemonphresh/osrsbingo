'use strict';

const { requireAuth, getBoardOrThrow } = require('../helpers');
const { UserInputError } = require('apollo-server-express');

module.exports = {
  placeBSShip: async (_, { boardId, input }, context) => {
    requireAuth(context);
    await getBoardOrThrow(boardId);
    void input;
    throw new UserInputError(
      'Direct ship placement is disabled. Share a placement suggestion for the team vote instead.'
    );
  },
};
