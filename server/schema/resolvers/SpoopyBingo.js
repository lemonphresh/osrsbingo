'use strict';

const { UserInputError, AuthenticationError, ForbiddenError } = require('apollo-server-express');
const { pubsub } = require('../pubsub');
const {
  loadTeamState,
  persistTeamState,
  createInitialTeamTiles,
  toEventDefinition,
  generateId,
} = require('../../utils/spoopy/spoopyPersistence');
const sm = require('../../utils/spoopy/spoopyStateMachine');

const getModels = () => require('../../db/models');

// ── Auth helpers ──────────────────────────────────────────────────────────
//
// Every mutation and every "sensitive" read requires a logged-in site user.
// Team-scoped data (a team's board, its submissions, its member actions) is
// additionally gated to (a) site admins, (b) event admins, or (c) team
// members — verified by the user's linked discordUserId being present in
// the team's `members` array (mirrors the battleship pattern).
//
// Discord bot workflows do NOT hit this resolver — they use direct DB access
// via `bot/commands/spoopy.js`, exactly like `bot/commands/battleship.js` does.

function requireUser(context) {
  if (!context?.user) throw new AuthenticationError('Must be logged in');
  return context.user;
}

function isAdmin(event, user) {
  if (!user) return false;
  if (user.admin) return true;
  return event.adminIds?.includes(String(user.id)) ?? false;
}

function requireAdmin(event, user) {
  if (!isAdmin(event, user)) throw new AuthenticationError('Admin only');
}

function isTeamMember(team, discordUserId) {
  if (!discordUserId) return false;
  return (team.members ?? []).includes(String(discordUserId));
}

// Passes for site admins, event admins, or Discord-linked team members.
function requireTeamMemberOrStaff(event, team, user) {
  if (isAdmin(event, user)) return;
  if (isTeamMember(team, user.discordUserId)) return;
  throw new ForbiddenError('You must be a team member to do that');
}

// ── Lookups ───────────────────────────────────────────────────────────────

async function getEventOrThrow(eventId) {
  const { SpoopyEvent } = getModels();
  const event = await SpoopyEvent.findByPk(eventId);
  if (!event) throw new UserInputError(`SpoopyEvent ${eventId} not found`);
  return event;
}

async function getTeamOrThrow(teamId) {
  const { SpoopyTeam } = getModels();
  const team = await SpoopyTeam.findByPk(teamId);
  if (!team) throw new UserInputError(`SpoopyTeam ${teamId} not found`);
  return team;
}

function requireEventActive(event) {
  if (event.status === 'SETUP')    throw new UserInputError('Event has not started yet');
  if (event.status === 'COMPLETE') throw new UserInputError('Event has ended');
  if (event.status !== 'ACTIVE')   throw new UserInputError('No active event');
}

async function publishBoardUpdated(team) {
  await pubsub.publish(`SPOOPY_TEAM_BOARD_UPDATED_${team.teamId}`, {
    spoopyTeamBoardUpdated: await loadTeamState(team.teamId),
  });
}

// ── Queries ───────────────────────────────────────────────────────────────

const Query = {
  // Event metadata (name, curfew, board layout, content) is auth-gated but not
  // team-scoped — any logged-in user can see it. Content authoring rights are
  // separately gated on mutations.
  spoopyEvent: async (_, { eventId }, context) => {
    requireUser(context);
    return getEventOrThrow(eventId);
  },

  spoopyEvents: async (_, __, context) => {
    requireUser(context);
    const { SpoopyEvent } = getModels();
    return SpoopyEvent.findAll({ order: [['createdAt', 'DESC']] });
  },

  // Convention: only one spoopy event is ACTIVE at a time. Returns null if
  // none. Used by `/spoopy-event` to figure out "which event are we in."
  getActiveSpoopyEvent: async (_, __, context) => {
    requireUser(context);
    const { SpoopyEvent } = getModels();
    return SpoopyEvent.findOne({ where: { status: 'ACTIVE' }, order: [['createdAt', 'DESC']] });
  },

  // One-shot query used by `/spoopy-event` to render the caller's view:
  // returns the "current" event (any status — SETUP shows placeholder, ACTIVE
  // shows team board, COMPLETE shows recap), the caller's team on that event
  // (if any), and that team's board state. All fields can be null so the page
  // can render empty states without extra roundtrips.
  //
  // When no eventId is passed, prefers the most recent SETUP/ACTIVE event, and
  // falls back to the most recent COMPLETE one — assumes at most one spoopy
  // event exists at a time per the operator convention.
  mySpoopySituation: async (_, { eventId }, context) => {
    const user = requireUser(context);
    const { SpoopyEvent, SpoopyTeam } = getModels();

    let event;
    if (eventId) {
      event = await SpoopyEvent.findByPk(eventId);
    } else {
      event =
        (await SpoopyEvent.findOne({
          where: { status: ['SETUP', 'ACTIVE'] },
          order: [['createdAt', 'DESC']],
        })) ||
        (await SpoopyEvent.findOne({ order: [['createdAt', 'DESC']] }));
    }
    if (!event) return { event: null, myTeam: null, teamBoard: null };

    const discordUserId = user.discordUserId ? String(user.discordUserId) : null;
    let myTeam = null;
    if (discordUserId) {
      const teams = await SpoopyTeam.findAll({ where: { eventId: event.eventId } });
      myTeam = teams.find((t) => (t.members ?? []).includes(discordUserId)) ?? null;
    }

    const teamBoard = myTeam ? await loadTeamState(myTeam.teamId) : null;
    return { event, myTeam, teamBoard };
  },

  spoopyTeam: async (_, { teamId }, context) => {
    const user = requireUser(context);
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    requireTeamMemberOrStaff(event, team, user);
    return team;
  },

  spoopyTeamBoard: async (_, { teamId }, context) => {
    const user = requireUser(context);
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    requireTeamMemberOrStaff(event, team, user);
    return loadTeamState(teamId);
  },

  // Token-scoped access — the token is the auth. Kept public so a team can
  // share a board link without every viewer needing to log in.
  spoopyTeamBoardByToken: async (_, { token }) => {
    const { SpoopyTeam } = getModels();
    const team = await SpoopyTeam.findOne({ where: { teamToken: token } });
    if (!team) throw new UserInputError('Team not found for this token');
    return loadTeamState(team.teamId);
  },

  spoopySubmissions: async (_, { eventId, status }, context) => {
    const user = requireUser(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user);
    const { SpoopySubmission } = getModels();
    const where = { eventId };
    if (status) where.status = status;
    return SpoopySubmission.findAll({ where, order: [['submittedAt', 'DESC']] });
  },
};

// ── Mutations ─────────────────────────────────────────────────────────────

const Mutation = {
  // ── Admin-gated ────────────────────────────────────────────────────

  createSpoopyEvent: async (_, { input }, context) => {
    const user = requireUser(context);
    const { SpoopyEvent } = getModels();
    return SpoopyEvent.create({
      eventId: generateId('sp'),
      eventName: input.eventName,
      status: 'SETUP',
      curfewStart: input.curfewStart ?? null,
      curfewEnd: input.curfewEnd ?? null,
      adminIds: [String(user.id)],
      staffChannelId: input.staffChannelId ?? null,
      board: input.board ?? { dimensions: { rows: 0, cols: 0 }, tiles: [], candybagTileId: null },
      contentById: input.contentById ?? {},
      hauntedHouse: input.hauntedHouse ?? null,
      startingTileIds: input.startingTileIds ?? [],
    });
  },

  updateSpoopyEventStatus: async (_, { eventId, status }, context) => {
    const user = requireUser(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user);
    await event.update({ status });
    return event;
  },

  updateSpoopyEventBoard: async (_, { eventId, board, contentById, hauntedHouse, startingTileIds }, context) => {
    const user = requireUser(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user);
    const patch = {};
    if (board !== undefined) patch.board = board;
    if (contentById !== undefined) patch.contentById = contentById;
    if (hauntedHouse !== undefined) patch.hauntedHouse = hauntedHouse;
    if (startingTileIds !== undefined) patch.startingTileIds = startingTileIds;
    await event.update(patch);
    return event;
  },

  createSpoopyTeam: async (_, { eventId, input }, context) => {
    const user = requireUser(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user);
    const { SpoopyTeam } = getModels();

    const team = await SpoopyTeam.create({
      teamId: generateId('spt'),
      eventId,
      teamName: input.teamName,
      color: input.color ?? null,
      members: input.members ?? [],
      discordChannelId: input.discordChannelId,
      discordRoleId: input.discordRoleId ?? null,
      teamToken: generateId('tok').slice(0, 16),
    });

    await createInitialTeamTiles(eventId, team.teamId, event.board, event.startingTileIds);
    return team;
  },

  updateSpoopyTeamMembers: async (_, { teamId, members }, context) => {
    const user = requireUser(context);
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    requireAdmin(event, user);
    await team.update({ members });
    return team;
  },

  addSpoopyAdmin: async (_, { eventId, userId }, context) => {
    const user = requireUser(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user);
    if (!event.adminIds.includes(String(userId))) {
      await event.update({ adminIds: [...event.adminIds, String(userId)] });
    }
    return event;
  },

  removeSpoopyAdmin: async (_, { eventId, userId }, context) => {
    const user = requireUser(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user);
    await event.update({ adminIds: event.adminIds.filter((id) => id !== String(userId)) });
    return event;
  },

  reviewSpoopySubmission: async (_, { submissionId, approved, denialReason }, context) => {
    const user = requireUser(context);
    const { SpoopySubmission } = getModels();
    const submission = await SpoopySubmission.findByPk(submissionId);
    if (!submission) throw new UserInputError('Submission not found');

    const event = await getEventOrThrow(submission.eventId);
    requireAdmin(event, user);
    const team = await getTeamOrThrow(submission.teamId);

    await submission.update({
      status: approved ? 'APPROVED' : 'DENIED',
      reviewedBy: String(user.id),
      reviewedAt: new Date(),
      denialReason: approved ? null : denialReason ?? null,
    });

    const prev = await loadTeamState(team.teamId);
    const eventDef = toEventDefinition(event);
    const next = approved
      ? sm.approveSubmission(prev, eventDef, submission.tileId)
      : sm.denySubmission(prev, eventDef, submission.tileId);
    await persistTeamState(prev, next);

    await pubsub.publish(`SPOOPY_SUBMISSION_REVIEWED_${submission.eventId}`, {
      spoopySubmissionReviewed: submission,
    });
    await publishBoardUpdated(team);

    return submission;
  },

  // ── Team-member gated (site-invoked) ───────────────────────────────
  //
  // These live under the same auth roof as staff mutations: the caller must
  // be logged in AND either be a member of the team (Discord id linked to
  // their site profile matches `team.members`) or hold staff privileges.
  //
  // If the bot triggers the same behavior, it does so via direct DB access
  // in bot/commands/spoopy.js — not this resolver.

  createSpoopyChoice: async (_, { input }, context) => {
    const user = requireUser(context);
    const team = await getTeamOrThrow(input.teamId);
    const event = await getEventOrThrow(team.eventId);
    requireTeamMemberOrStaff(event, team, user);
    requireEventActive(event);

    const prev = await loadTeamState(team.teamId);
    const next = sm.chooseOption(prev, toEventDefinition(event), input.tileId, input.option);
    await persistTeamState(prev, next);
    await publishBoardUpdated(team);
    return loadTeamState(team.teamId);
  },

  createSpoopySubmission: async (_, { input }, context) => {
    const user = requireUser(context);
    const team = await getTeamOrThrow(input.teamId);
    const event = await getEventOrThrow(team.eventId);
    requireTeamMemberOrStaff(event, team, user);
    requireEventActive(event);

    const { SpoopySubmission } = getModels();
    const submissionId = generateId('sps');

    // Staff can spoof discordUserId (dev/testing), members can only submit as
    // themselves — mirrors the battleship submissions gating.
    const isStaff = isAdmin(event, user);
    const submitterDiscordId = isStaff
      ? (input.discordUserId ?? user.discordUserId ?? null)
      : (user.discordUserId ?? null);
    const submitterDiscordName = isStaff
      ? (input.discordUsername ?? null)
      : null;

    const submission = await SpoopySubmission.create({
      submissionId,
      teamId: team.teamId,
      eventId: event.eventId,
      tileId: input.tileId,
      screenshotUrl: input.screenshotUrl ?? null,
      discordMessageId: input.discordMessageId ?? null,
      channelId: team.discordChannelId,
      status: 'PENDING',
      submittedAt: input.submittedAt ?? new Date(),
      discordUsername: submitterDiscordName,
      discordUserId: submitterDiscordId,
    });

    const prev = await loadTeamState(team.teamId);
    const next = sm.submitProof(prev, toEventDefinition(event), input.tileId, submissionId);
    await persistTeamState(prev, next);

    await pubsub.publish(`SPOOPY_SUBMISSION_ADDED_${event.eventId}`, {
      spoopySubmissionAdded: submission,
    });
    await publishBoardUpdated(team);

    return submission;
  },

  enterSpoopyHauntedHouse: async (_, { input }, context) => {
    const user = requireUser(context);
    const team = await getTeamOrThrow(input.teamId);
    const event = await getEventOrThrow(team.eventId);
    requireTeamMemberOrStaff(event, team, user);
    requireEventActive(event);

    const state = await loadTeamState(team.teamId);
    const { warningTier, msRemaining } = sm.enterHauntedHouse(state, toEventDefinition(event));

    return {
      warningDialog: warningTier?.dialog ?? null,
      msRemaining,
      candybagTileId: event.board.candybagTileId,
      currentGp: state.gpEarned,
    };
  },
};

// ── Subscriptions ─────────────────────────────────────────────────────────
// Topic-isolated per eventId / teamId. Follows the Rainbow / BS pattern of
// relying on topic scoping rather than per-subscription auth.

function makeSubscription(topicFn) {
  return { subscribe: (_, args) => pubsub.asyncIterator(topicFn(args)) };
}

const Subscription = {
  spoopySubmissionAdded:    makeSubscription(({ eventId }) => `SPOOPY_SUBMISSION_ADDED_${eventId}`),
  spoopySubmissionReviewed: makeSubscription(({ eventId }) => `SPOOPY_SUBMISSION_REVIEWED_${eventId}`),
  spoopyTeamBoardUpdated:   makeSubscription(({ teamId })  => `SPOOPY_TEAM_BOARD_UPDATED_${teamId}`),
};

module.exports = { Query, Mutation, Subscription };
