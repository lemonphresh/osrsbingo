'use strict';

const { pubsub } = require('../pubsub');
const { AuthenticationError, ForbiddenError } = require('apollo-server-express');

function requireSubscriptionAuth(_args, context) {
  if (!context?.user) throw new AuthenticationError('Not authenticated');
}

async function requireTeamAccess(args, context) {
  requireSubscriptionAuth(args, context);
  const { BSTeam, BSEvent } = require('../../db/models');
  const team = await BSTeam.findByPk(args.teamId);
  if (!team) throw new ForbiddenError('Team access required');
  const event = await BSEvent.findByPk(team.eventId);
  if (!event) throw new ForbiddenError('Team access required');
  const user = context.user;
  const uid = String(user.id);
  const allowed =
    user.admin === true ||
    event.creatorId === uid ||
    (event.adminIds ?? []).includes(uid) ||
    (event.refIds ?? []).includes(uid) ||
    (!!user.discordUserId && (team.members ?? []).includes(user.discordUserId));
  if (!allowed) throw new ForbiddenError('Team access required');
}

async function requirePlacementSuggestionAccess(args, context) {
  requireSubscriptionAuth(args, context);
  const { BSTeam, BSEvent } = require('../../db/models');
  const team = await BSTeam.findByPk(args.teamId);
  if (!team) throw new ForbiddenError('Team access required');
  const event = await BSEvent.findByPk(team.eventId);
  if (!event) throw new ForbiddenError('Team access required');
  const user = context.user;
  const uid = String(user.id);
  const allowed =
    user.admin === true ||
    event.creatorId === uid ||
    (event.adminIds ?? []).includes(uid) ||
    (!!user.discordUserId && (team.members ?? []).includes(user.discordUserId));
  if (!allowed) throw new ForbiddenError('Team access required');
}

function createSubscription(topicFn, authorize = requireSubscriptionAuth) {
  return {
    subscribe: async (_, args, context) => {
      await authorize(args, context);
      return pubsub.asyncIterableIterator(topicFn(args));
    },
  };
}

module.exports = {
  Subscription: {
    bsBoardUpdated: createSubscription((args) => `BS_BOARD_UPDATED_${args.eventId}`),
    bsShotFired: createSubscription((args) => `BS_SHOT_FIRED_${args.eventId}`),
    bsTileUpdated: createSubscription((args) => `BS_TILE_UPDATED_${args.boardId}`),
    bsViewersUpdated: createSubscription((args) => `BS_VIEWERS_${args.eventId}`),
    bsSubmissionAdded: createSubscription((args) => `BS_SUBMISSION_ADDED_${args.eventId}`),
    bsSubmissionReviewed: createSubscription((args) => `BS_SUBMISSION_REVIEWED_${args.eventId}`),
    bsProposalUpdated: createSubscription(
      (args) => `BS_PROPOSAL_${args.teamId}`,
      requireTeamAccess
    ),
    bsGameOver: createSubscription((args) => `BS_GAME_OVER_${args.eventId}`),
    bsSkipProposalUpdated: createSubscription(
      (args) => `BS_SKIP_PROPOSAL_${args.teamId}`,
      requireTeamAccess
    ),
    bsPlacementSuggestionsUpdated: createSubscription(
      (args) => `BS_PLACEMENT_SUGGESTIONS_${args.teamId}`,
      requirePlacementSuggestionAccess
    ),
  },
};
