const { ApolloError } = require('apollo-server-express');
const UserResolvers = require('./resolvers/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const resolvers = {
  Query: {
    ...UserResolvers.Query,
  },
  Mutation: {
    ...UserResolvers.Mutation,
  },
};

module.exports = resolvers;
