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
const {
  postSpoopySubmissionResult,
  postSpoopyPreScreenshotResult,
  postSpoopyTileComplete,
} = require('../../utils/spoopy/spoopyDiscord');
const {
  syncSpoopyEventWom,
  syncSpoopyTileForPreApproval,
} = require('../../utils/spoopy/spoopyWomSync');

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
      eventPassword: input.eventPassword ?? null,
      adminIds: [String(user.id)],
      staffChannelId: input.staffChannelId ?? null,
      board: input.board ?? { dimensions: { rows: 0, cols: 0 }, tiles: [], candybagTileId: null },
      contentById: input.contentById ?? {},
      hauntedHouse: input.hauntedHouse ?? null,
      startingTileIds: input.startingTileIds ?? [],
    });
  },

  setSpoopyEventPassword: async (_, { eventId, password }, context) => {
    const user = requireUser(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user);
    await event.update({ eventPassword: password ?? null });
    return event;
  },

  updateSpoopyEventSchedule: async (_, { eventId, curfewStart, curfewEnd }, context) => {
    const user = requireUser(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user);
    const patch = {};
    if (curfewStart !== undefined) patch.curfewStart = curfewStart ? new Date(curfewStart) : null;
    if (curfewEnd !== undefined) patch.curfewEnd = curfewEnd ? new Date(curfewEnd) : null;
    if (patch.curfewStart && patch.curfewEnd && patch.curfewStart >= patch.curfewEnd) {
      throw new UserInputError('curfew start must be before curfew end');
    }
    if (Object.keys(patch).length === 0) return event;
    await event.update(patch);
    return event;
  },

  setSpoopyEventPrizePool: async (_, { eventId, prizePool }, context) => {
    const user = requireUser(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user);
    if (event.status !== 'SETUP') {
      throw new UserInputError('Prize pool can only be changed while the event is in SETUP.');
    }
    if (!Number.isFinite(prizePool) || prizePool < 0) {
      throw new UserInputError('Prize pool must be a non-negative integer.');
    }
    await event.update({ prizePool });
    return event;
  },

  setSpoopyEventWomCompetitionId: async (_, { eventId, womCompetitionId }, context) => {
    const user = requireUser(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user);
    const trimmed = typeof womCompetitionId === 'string' ? womCompetitionId.trim() : null;
    await event.update({ womCompetitionId: trimmed || null });
    return event;
  },

  syncSpoopyEventWom: async (_, { eventId }, context) => {
    const user = requireUser(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user);
    if (!event.womCompetitionId) {
      throw new UserInputError('No WOM competition id set on this event.');
    }
    try {
      await syncSpoopyEventWom(eventId);
    } catch (err) {
      // Cooldown / rate-limit errors bubble up as user-facing messages so
      // the admin's toast reads sensibly instead of "an error occurred".
      throw new UserInputError(err.message);
    }
    return getEventOrThrow(eventId);
  },

  updateSpoopyEventStatus: async (_, { eventId, status }, context) => {
    const user = requireUser(context);
    const event = await getEventOrThrow(eventId);
    requireAdmin(event, user);

    // SETUP → ACTIVE freezes each team's share of the prize pool. Divides
    // evenly (integer division); any remainder is dropped rather than
    // handed to an arbitrary team. Once frozen, subsequent teams (unlikely
    // while ACTIVE, but a safe invariant) don't get a share.
    if (event.status === 'SETUP' && status === 'ACTIVE') {
      const { SpoopyTeam } = getModels();
      const teams = await SpoopyTeam.findAll({ where: { eventId } });
      const pool = event.prizePool ?? 0;
      const perTeam = teams.length > 0 ? Math.floor(pool / teams.length) : 0;
      for (const team of teams) {
        if (team.poolAllocation !== perTeam) {
          await team.update({ poolAllocation: perTeam });
        }
      }
    }

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

  // Edit the team's discord channel / role bindings after creation. Common
  // reason: the seed sets placeholder ids ("test-channel-2") and the admin
  // needs to point the team at the real channel before ACTIVE. Either
  // argument may be omitted; only provided ones are patched.
  updateSpoopyTeamDiscord: async (_, { teamId, discordChannelId, discordRoleId }, context) => {
    const user = requireUser(context);
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    requireAdmin(event, user);
    const patch = {};
    if (discordChannelId !== undefined) patch.discordChannelId = discordChannelId;
    if (discordRoleId !== undefined) patch.discordRoleId = discordRoleId;
    if (Object.keys(patch).length === 0) return team;
    await team.update(patch);
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

  // Convenience for local testing — creates the mock event (from
  // server/utils/spoopy/spoopyMockEvent) so the operator can see a live board
  // without hand-crafting one. Site admins only.
  seedSpoopyMockEvent: async (_, __, context) => {
    const user = requireUser(context);
    if (!user.admin) throw new AuthenticationError('Site admin only');
    const { SpoopyEvent, SpoopyTeam } = getModels();
    const { buildRealBoardMockEvent } = require('../../utils/spoopy/spoopyMockEvent');
    const mock = buildRealBoardMockEvent();

    const event = await SpoopyEvent.create({
      eventId: generateId('sp'),
      eventName: mock.name,
      status: 'SETUP',
      curfewStart: mock.curfew.start,
      curfewEnd: mock.curfew.end,
      eventPassword: 'spooptober2026',
      adminIds: [String(user.id)],
      staffChannelId: null,
      board: mock.board,
      contentById: mock.contentById,
      hauntedHouse: mock.hauntedHouse,
      startingTileIds: mock.startingTileIds,
    });

    // Auto-seed two test teams so the seed is immediately playable and the
    // final recap has something to rank. Team 1 gets the operator (lemon)
    // by default; team 2 gets a hand-picked partner discord id.
    const team1MemberDiscordId = user.discordUserId ?? '221415080514945035';
    const team2MemberDiscordId = '136602347999592448';

    const team1 = await SpoopyTeam.create({
      teamId: generateId('spt'),
      eventId: event.eventId,
      teamName: 'test team spoopy',
      color: null,
      members: [String(team1MemberDiscordId)],
      discordChannelId: 'test-channel-1',
      discordRoleId: null,
      teamToken: generateId('tok').slice(0, 16),
    });
    await createInitialTeamTiles(event.eventId, team1.teamId, mock.board, mock.startingTileIds);

    const team2 = await SpoopyTeam.create({
      teamId: generateId('spt'),
      eventId: event.eventId,
      teamName: 'the ghouls next door',
      color: null,
      members: [String(team2MemberDiscordId)],
      discordChannelId: 'test-channel-2',
      discordRoleId: null,
      teamToken: generateId('tok').slice(0, 16),
    });
    await createInitialTeamTiles(event.eventId, team2.teamId, mock.board, mock.startingTileIds);

    return event;
  },

  // Rewrites the event's board / content / haunted-house / starting-tile-ids
  // from the current mock generator without deleting the event or wiping team
  // state. Handy when we tweak mock copy (like the story or discord command
  // strings) and want existing seeded events to pick up the new values
  // instead of forcing a delete + reseed cycle. Site admins only.
  refreshSpoopyEventFromMock: async (_, { eventId }, context) => {
    const user = requireUser(context);
    if (!user.admin) throw new AuthenticationError('Site admin only');
    const { SpoopyEvent } = getModels();
    const event = await getEventOrThrow(eventId);
    const { buildRealBoardMockEvent } = require('../../utils/spoopy/spoopyMockEvent');
    const mock = buildRealBoardMockEvent();
    await event.update({
      board: mock.board,
      contentById: mock.contentById,
      hauntedHouse: mock.hauntedHouse,
      startingTileIds: mock.startingTileIds,
    });
    return event;
  },

  // Nukes an event and everything hanging off of it. Site admins only —
  // stricter than the other admin gates because this is destructive.
  deleteSpoopyEvent: async (_, { eventId }, context) => {
    const user = requireUser(context);
    if (!user.admin) throw new AuthenticationError('Site admin only');
    const { SpoopyEvent, SpoopyTeam, SpoopyTeamTile, SpoopySubmission } = getModels();
    const event = await SpoopyEvent.findByPk(eventId);
    if (!event) throw new UserInputError(`SpoopyEvent ${eventId} not found`);

    await SpoopySubmission.destroy({ where: { eventId } });
    await SpoopyTeamTile.destroy({ where: { eventId } });
    await SpoopyTeam.destroy({ where: { eventId } });
    await event.destroy();
    return true;
  },

  // Explicit "mark complete" — advances a tile from SUBMITTED to COMPLETE,
  // banks the reward (houses), unlocks its neighbors, and cashes the team
  // out if it's the candybag. Requires at least one APPROVED submission on
  // the tile so refs don't accidentally advance a tile that hasn't been
  // reviewed yet. Site + event admins only (via requireAdmin).
  completeSpoopyTile: async (_, { teamId, tileId }, context) => {
    const user = requireUser(context);
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    requireAdmin(event, user);

    const { SpoopySubmission } = getModels();
    const anyApproved = await SpoopySubmission.count({
      where: { teamId, tileId, status: 'APPROVED', type: 'FINAL' },
    });
    if (!anyApproved) {
      throw new UserInputError('tile has no approved submission yet — approve one first');
    }

    const prev = await loadTeamState(team.teamId);
    const next = sm.completeTile(
      prev,
      toEventDefinition(event),
      tileId,
      new Date(),
      team.poolAllocation ?? 0,
    );
    await persistTeamState(prev, next);
    await publishBoardUpdated(team);

    // Notify the team channel now that the tile is actually complete —
    // this is when neighbors unlock and rewards get banked. The approve
    // notification purposely doesn't mention either.
    const boardTile = event.board?.tiles?.find((t) => t.id === tileId);
    const isCandybag = boardTile?.tile_type === 'candybag';
    const taskLabel = boardTile ? `${boardTile.tile_type} (${tileId})` : tileId;
    const rewardGp = next.tiles?.[tileId]?.rewardEarned ?? 0;
    postSpoopyTileComplete({
      channelId: team.discordChannelId,
      taskLabel,
      rewardGp,
      isCandybag,
    }).catch(() => {});

    return loadTeamState(team.teamId);
  },

  // Ref-controlled per-tile progress percentage (0-100). Purely informational
  // — doesn't gate completion or unlock anything. Teams see it on the tile
  // detail modal so they can track "how close am I" on multi-step tasks.
  setSpoopyTileProgress: async (_, { teamId, tileId, progress }, context) => {
    const user = requireUser(context);
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    requireAdmin(event, user);

    const clamped = Math.max(0, Math.min(100, Math.round(progress ?? 0)));
    const { SpoopyTeamTile } = getModels();
    await SpoopyTeamTile.update(
      { progress: clamped },
      { where: { teamId, tileId } },
    );
    await publishBoardUpdated(team);
    return loadTeamState(teamId);
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

    // Approve and deny are both submission-level actions — neither touches
    // the tile status. The tile advances only when a ref explicitly clicks
    // "mark complete" (see completeSpoopyTile). Mirrors battleship exactly
    // so multi-step tasks can stack many submissions between open and
    // complete, and denying one submission doesn't wipe others out.

    await pubsub.publish(`SPOOPY_SUBMISSION_REVIEWED_${submission.eventId}`, {
      spoopySubmissionReviewed: submission,
    });
    await publishBoardUpdated(team);

    // Best-effort Discord notification to the team channel. Falls back to the
    // tile id when we don't have a friendlier label to hand — the tile-type
    // label is more informative for spot-checking on Discord.
    const boardTile = event.board?.tiles?.find((t) => t.id === submission.tileId);
    const taskLabel = boardTile ? `${boardTile.tile_type} (${submission.tileId})` : submission.tileId;
    const opts = {
      channelId: submission.channelId ?? team.discordChannelId,
      discordUserId: submission.discordUserId,
      taskLabel,
      approved,
      denialReason,
    };
    if (submission.type === 'PRE') {
      postSpoopyPreScreenshotResult(opts).catch(() => {});
      // An approved PRE unlocks WOM tracking for this tile — kick off a
      // targeted sync so the progress bar reflects any gains the team's
      // already made between the PRE snapshot and now. Fire-and-forget so
      // the review response isn't blocked on a WOM API round-trip.
      if (approved && event.womCompetitionId) {
        syncSpoopyTileForPreApproval({
          teamId: submission.teamId,
          tileId: submission.tileId,
        }).catch((err) => {
          require('../../utils/logger').warn(
            `[spoopyWomSync] PRE-approval hook failed: ${err.message}`,
          );
        });
      }
    } else {
      postSpoopySubmissionResult(opts).catch(() => {});
    }

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
    const type = input.type === 'PRE' ? 'PRE' : 'FINAL';

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
      type,
      screenshotUrl: input.screenshotUrl ?? null,
      discordMessageId: input.discordMessageId ?? null,
      channelId: team.discordChannelId,
      status: 'PENDING',
      submittedAt: input.submittedAt ?? new Date(),
      discordUsername: submitterDiscordName,
      discordUserId: submitterDiscordId,
    });

    const prev = await loadTeamState(team.teamId);
    const next = sm.submitProof(prev, toEventDefinition(event), input.tileId, submissionId, type);
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

  deleteSpoopyTeam: async (_, { teamId }, context) => {
    const user = requireUser(context);
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    requireAdmin(event, user);
    const { SpoopyTeamTile, SpoopySubmission, SpoopyTeam } = getModels();
    await SpoopyTeamTile.destroy({ where: { teamId } });
    await SpoopySubmission.destroy({ where: { teamId } });
    await SpoopyTeam.destroy({ where: { teamId } });
    return true;
  },
};

// ── Field resolvers ───────────────────────────────────────────────────────

const SpoopyEvent = {
  teams: async (event) => {
    const { SpoopyTeam } = getModels();
    return SpoopyTeam.findAll({ where: { eventId: event.eventId }, order: [['createdAt', 'ASC']] });
  },
  admins: async (event) => {
    if (!event.adminIds?.length) return [];
    const { User } = getModels();
    return User.findAll({ where: { id: event.adminIds } });
  },
};

// Surfaces the SpoopyTeamTile row for a submission's (teamId, tileId) so the
// refs page and the team task modal can read progress + tile status without
// a separate round-trip.
const SpoopySubmission = {
  teamTile: async (submission) => {
    const { SpoopyTeamTile } = getModels();
    return SpoopyTeamTile.findOne({
      where: { teamId: submission.teamId, tileId: submission.tileId },
    });
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

module.exports = { Query, Mutation, Subscription, SpoopyEvent, SpoopySubmission };
