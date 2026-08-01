'use strict';

const Query = require('./clanWars/queries');
const { ClanWarsEvent, ClanWarsTeam, ClanWarsSubmission, ClanWarsBattle } = require('./clanWars/fieldResolvers');

const Mutation = {
  ...require('./clanWars/mutations/event'),
  ...require('./clanWars/mutations/teams'),
  ...require('./clanWars/mutations/gathering'),
  ...require('./clanWars/mutations/outfitting'),
  ...require('./clanWars/mutations/battle'),
  ...require('./clanWars/mutations/admin'),
  ...require('./clanWars/mutations/viewers'),
};

module.exports = { Query, Mutation, ClanWarsEvent, ClanWarsTeam, ClanWarsSubmission, ClanWarsBattle };
