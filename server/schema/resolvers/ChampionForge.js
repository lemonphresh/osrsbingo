'use strict';

const Query = require('./championForge/queries');
const { CFEvent, CFTeam, CFSubmission, CFBattle } = require('./championForge/fieldResolvers');

const Mutation = {
  ...require('./championForge/mutations/event'),
  ...require('./championForge/mutations/teams'),
  ...require('./championForge/mutations/gathering'),
  ...require('./championForge/mutations/outfitting'),
  ...require('./championForge/mutations/battle'),
  ...require('./championForge/mutations/admin'),
  ...require('./championForge/mutations/viewers'),
};

module.exports = { Query, Mutation, CFEvent, CFTeam, CFSubmission, CFBattle };
