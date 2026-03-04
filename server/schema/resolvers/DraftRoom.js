const bcrypt = require('bcryptjs');
const models = require('../../db/models');
const { pubsub } = require('../pubsub');
const { fetchAllPlayerStats } = require('../../utils/womService');
const {
  generateRoomId,
  generateCaptainToken,
  generateAliases,
  calculateTierBadges,
  getCurrentTeamIndex,
  getNextPickIndex,
  startPickTimer,
  clearPickTimer,
  shuffle,
} = require('../../utils/draftHelpers');
const logger = require('../../utils/logger');

const DRAFT_ROOM_UPDATED = 'DRAFT_ROOM_UPDATED';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function requireAuth(context) {
  if (!context.user) throw new Error('Authentication required');
}

/** Build a room payload suitable for GQL response, stripping RSNs unless revealed. */
function formatRoom(room, players) {
  const revealed = room.status === 'REVEALED';
  return {
    ...room.toJSON(),
    players: players.map((p) => ({
      ...p.toJSON(),
      rsn: revealed ? p.rsn : null,
    })),
  };
}

/** Publish a draft room update to all subscribers. */
async function publishUpdate(type, room, players) {
  const payload = { type, room: formatRoom(room, players) };
  await pubsub.publish(`${DRAFT_ROOM_UPDATED}_${room.roomId}`, { draftRoomUpdated: payload });
}

/** Load a room and its players in one call. Throws if not found. */
async function loadRoom(roomId) {
  const room = await models.DraftRoom.findByPk(roomId);
  if (!room) throw new Error(`Draft room ${roomId} not found`);
  const players = await models.DraftPlayer.findAll({
    where: { roomId },
    order: [['id', 'ASC']],
  });
  return { room, players };
}

/** Advance the pick (or end the draft) after a player is drafted (snake/linear). */
async function advancePick(room, players) {
  const undraftedCount = players.filter((p) => p.teamIndex === null).length;
  const nextIdx = undraftedCount > 0 ? getNextPickIndex(room.currentPickIndex, players.length) : null;

  if (nextIdx === null) {
    // Draft complete
    clearPickTimer(room.roomId);
    await room.update({ currentPickIndex: room.currentPickIndex, currentPickStartedAt: null, status: 'COMPLETED' });
  } else {
    const now = new Date();
    await room.update({ currentPickIndex: nextIdx, currentPickStartedAt: now });
    startPickTimer(room.roomId, room.pickTimeSeconds, handleTimerTimeout);
  }
}

/** Called by the server-side pick timer when a captain's time expires. */
async function handleTimerTimeout(roomId) {
  try {
    const { room, players } = await loadRoom(roomId);
    if (room.status !== 'DRAFTING') return;

    if (room.draftFormat === 'AUCTION') {
      // Auto-pass for all teams that haven't bid yet, then resolve
      await resolveAuctionRound(room, players, true);
      return;
    }

    // Snake / Linear: auto-pick a random undrafted player
    const undrafted = players.filter((p) => p.teamIndex === null);
    if (!undrafted.length) return;

    const picked = undrafted[Math.floor(Math.random() * undrafted.length)];
    const teamIdx = getCurrentTeamIndex(room.draftFormat, room.numberOfTeams, room.currentPickIndex);

    await picked.update({ teamIndex: teamIdx, pickOrder: room.currentPickIndex });
    await advancePick(room, players);

    const updatedPlayers = await models.DraftPlayer.findAll({
      where: { roomId },
      order: [['id', 'ASC']],
    });
    const updatedRoom = await models.DraftRoom.findByPk(roomId);
    await publishUpdate('TIMER_EXPIRED', updatedRoom, updatedPlayers);
  } catch (err) {
    logger.error(`Timer timeout error for room ${roomId}:`, err.message);
  }
}

/** Resolve a completed auction round (all teams have bid or timer expired). */
async function resolveAuctionRound(room, players, timedOut = false) {
  const state = room.auctionState;
  if (!state || !state.currentPlayerId) return;

  const teams = room.teams;
  const bids = state.bids ?? {};

  // Auto-pass 0 for teams that haven't bid
  for (const team of teams) {
    if (bids[team.index] === undefined) {
      bids[team.index] = 0;
    }
  }

  // Find highest bid
  let maxBid = -1;
  let winners = [];
  for (const [idxStr, amount] of Object.entries(bids)) {
    if (amount > maxBid) {
      maxBid = amount;
      winners = [parseInt(idxStr, 10)];
    } else if (amount === maxBid) {
      winners.push(parseInt(idxStr, 10));
    }
  }

  // Random tiebreak
  const winnerTeamIdx = winners[Math.floor(Math.random() * winners.length)];

  // Assign player
  const player = players.find((p) => p.id === state.currentPlayerId);
  if (player) {
    const pickOrder = players.filter((p) => p.teamIndex !== null).length;
    await player.update({ teamIndex: winnerTeamIdx, pickOrder });
  }

  // Deduct budget from winner
  const updatedTeams = teams.map((t) => {
    if (t.index === winnerTeamIdx) {
      return { ...t, budget: Math.max(0, (t.budget ?? 100) - maxBid) };
    }
    return t;
  });

  // Start next auction round or complete
  const nowDrafted = (await models.DraftPlayer.findAll({ where: { roomId: room.roomId } }))
    .filter((p) => p.teamIndex !== null).length;

  const totalPlayers = players.length;

  if (nowDrafted >= totalPlayers) {
    clearPickTimer(room.roomId);
    await room.update({ teams: updatedTeams, auctionState: null, status: 'COMPLETED', currentPickStartedAt: null });
  } else {
    // Pick next random undrafted player for the next auction round
    const stillUndrafted = players.filter((p) => p.teamIndex === null && p.id !== state.currentPlayerId);
    const next = stillUndrafted[Math.floor(Math.random() * stillUndrafted.length)];
    const newState = { currentPlayerId: next?.id ?? null, bids: {}, phase: 'BIDDING' };
    const now = new Date();
    await room.update({ teams: updatedTeams, auctionState: newState, currentPickStartedAt: now });
    startPickTimer(room.roomId, room.pickTimeSeconds, handleTimerTimeout);
  }

  const updatedRoom = await models.DraftRoom.findByPk(room.roomId);
  const updatedPlayers = await models.DraftPlayer.findAll({
    where: { roomId: room.roomId },
    order: [['id', 'ASC']],
  });
  const type = timedOut ? 'TIMER_EXPIRED' : 'AUCTION_RESOLVED';
  await publishUpdate(type, updatedRoom, updatedPlayers);
}

// ---------------------------------------------------------------------------
// Query resolvers
// ---------------------------------------------------------------------------

const Query = {
  async getDraftRoom(_, { roomId }, context) {
    const { room, players } = await loadRoom(roomId);
    return formatRoom(room, players);
  },

  async getMyDraftRooms(_, __, context) {
    requireAuth(context);
    const rooms = await models.DraftRoom.findAll({
      where: { organizerUserId: context.user.id },
      order: [['createdAt', 'DESC']],
    });
    // Return without players for list view
    return rooms.map((r) => ({ ...r.toJSON(), players: [] }));
  },
};

// ---------------------------------------------------------------------------
// Mutation resolvers
// ---------------------------------------------------------------------------

const Mutation = {
  async createDraftRoom(_, { input }, context) {
    requireAuth(context);

    const {
      roomName,
      rsns,
      numberOfTeams,
      teamNames,
      draftFormat,
      statCategories,
      pickTimeSeconds = 60,
      tierFormula = null,
      roomPin = null,
    } = input;

    if (rsns.length < numberOfTeams) {
      throw new Error('Must have at least as many players as teams');
    }

    // Fetch WOM stats for all RSNs concurrently
    logger.info(`Fetching WOM stats for ${rsns.length} players...`);
    const statsArray = await fetchAllPlayerStats(rsns);

    // Shuffle RSNs (stats are paired with RSN, so shuffle together)
    const shuffledStats = shuffle([...statsArray]);

    // Assign aliases
    const aliases = generateAliases(shuffledStats.length);

    // Calculate tier badges
    const tierBadges = calculateTierBadges(
      shuffledStats.map((s) => ({ womData: s })),
      tierFormula
    );

    // Build team slots with captain tokens
    const teams = teamNames.map((name, index) => ({
      index,
      name,
      captainToken: generateCaptainToken(),
      captainUserId: null,
      captainJoined: false,
      budget: 100, // default auction budget
    }));

    // Hash room PIN if provided
    let hashedPin = null;
    if (roomPin) {
      hashedPin = await bcrypt.hash(roomPin, 10);
    }

    const roomId = generateRoomId();

    // Create room + players in a transaction
    await models.DraftRoom.sequelize.transaction(async (t) => {
      await models.DraftRoom.create(
        {
          roomId,
          organizerUserId: context.user.id,
          roomName,
          status: 'LOBBY',
          draftFormat,
          numberOfTeams,
          teams,
          statCategories,
          tierFormula,
          pickTimeSeconds,
          roomPin: hashedPin,
        },
        { transaction: t }
      );

      const playerRecords = shuffledStats.map((stats, i) => ({
        roomId,
        rsn: stats.rsn,
        alias: aliases[i],
        womData: stats,
        tierBadge: tierBadges[i],
      }));
      await models.DraftPlayer.bulkCreate(playerRecords, { transaction: t });
    });

    const { room, players } = await loadRoom(roomId);
    return formatRoom(room, players);
  },

  async joinDraftRoomAsCaptain(_, { roomId, teamIndex, pin }, context) {
    requireAuth(context);
    const { room, players } = await loadRoom(roomId);

    if (room.status !== 'LOBBY') throw new Error('Draft has already started');

    // Verify PIN if set
    if (room.roomPin) {
      if (!pin) throw new Error('This room requires a PIN');
      const valid = await bcrypt.compare(pin, room.roomPin);
      if (!valid) throw new Error('Invalid PIN');
    }

    const teams = room.teams;
    const slot = teams.find((t) => t.index === teamIndex);
    if (!slot) throw new Error(`Team index ${teamIndex} not found`);
    if (slot.captainJoined) throw new Error('This captain seat is already claimed');

    const updatedTeams = teams.map((t) => {
      if (t.index === teamIndex) {
        return { ...t, captainJoined: true, captainUserId: context.user.id };
      }
      return t;
    });

    await room.update({ teams: updatedTeams });
    const updated = await models.DraftRoom.findByPk(roomId);
    await publishUpdate('CAPTAIN_JOINED', updated, players);
    return formatRoom(updated, players);
  },

  async startDraft(_, { roomId }, context) {
    requireAuth(context);
    const { room, players } = await loadRoom(roomId);

    if (room.organizerUserId !== context.user.id) throw new Error('Only the organizer can start the draft');
    if (room.status !== 'LOBBY') throw new Error('Draft is not in LOBBY status');

    const now = new Date();
    let initialAuctionState = null;

    if (room.draftFormat === 'AUCTION') {
      const shuffledPlayers = shuffle([...players]);
      initialAuctionState = {
        currentPlayerId: shuffledPlayers[0]?.id ?? null,
        bids: {},
        phase: 'BIDDING',
      };
    }

    await room.update({
      status: 'DRAFTING',
      currentPickIndex: 0,
      currentPickStartedAt: now,
      auctionState: initialAuctionState,
    });

    startPickTimer(room.roomId, room.pickTimeSeconds, handleTimerTimeout);

    const updated = await models.DraftRoom.findByPk(roomId);
    await publishUpdate('DRAFT_STARTED', updated, players);
    return formatRoom(updated, players);
  },

  async makeDraftPick(_, { roomId, playerId }, context) {
    requireAuth(context);
    const { room, players } = await loadRoom(roomId);

    if (room.status !== 'DRAFTING') throw new Error('Draft is not in progress');
    if (room.draftFormat === 'AUCTION') throw new Error('Use placeBid for auction format');

    const currentTeamIdx = getCurrentTeamIndex(room.draftFormat, room.numberOfTeams, room.currentPickIndex);
    const currentTeam = room.teams.find((t) => t.index === currentTeamIdx);

    // Allow pick if: user is organizer, or user is the current team's captain
    const isOrganizer = room.organizerUserId === context.user.id;
    const isCaptain = currentTeam?.captainUserId === context.user.id;
    if (!isOrganizer && !isCaptain) {
      throw new Error("It's not your turn");
    }

    const player = players.find((p) => p.id === parseInt(playerId, 10));
    if (!player) throw new Error('Player not found');
    if (player.teamIndex !== null) throw new Error('Player has already been drafted');

    await player.update({ teamIndex: currentTeamIdx, pickOrder: room.currentPickIndex });

    const refreshedPlayers = await models.DraftPlayer.findAll({
      where: { roomId },
      order: [['id', 'ASC']],
    });

    await advancePick(room, refreshedPlayers);

    const updatedRoom = await models.DraftRoom.findByPk(roomId);
    const finalPlayers = await models.DraftPlayer.findAll({
      where: { roomId },
      order: [['id', 'ASC']],
    });
    await publishUpdate('PICK_MADE', updatedRoom, finalPlayers);
    return formatRoom(updatedRoom, finalPlayers);
  },

  async placeBid(_, { roomId, teamIndex, amount }, context) {
    requireAuth(context);
    const { room, players } = await loadRoom(roomId);

    if (room.status !== 'DRAFTING') throw new Error('Draft is not in progress');
    if (room.draftFormat !== 'AUCTION') throw new Error('placeBid is only for auction format');

    const team = room.teams.find((t) => t.index === teamIndex);
    if (!team) throw new Error(`Team ${teamIndex} not found`);

    // Allow bid if: user is organizer, or user is this team's captain
    const isOrganizer = room.organizerUserId === context.user.id;
    const isCaptain = team.captainUserId === context.user.id;
    if (!isOrganizer && !isCaptain) {
      throw new Error('You are not the captain of this team');
    }

    const state = room.auctionState;
    if (!state || state.phase !== 'BIDDING') throw new Error('No active auction round');

    // Validate bid
    const budget = team.budget ?? 100;
    if (amount < 0 || amount > budget) {
      throw new Error(`Bid must be between 0 and your remaining budget (${budget})`);
    }

    const updatedBids = { ...(state.bids ?? {}), [teamIndex]: amount };
    const allBid = room.teams.every((t) => updatedBids[t.index] !== undefined);

    await room.update({ auctionState: { ...state, bids: updatedBids } });

    const updatedRoom = await models.DraftRoom.findByPk(roomId);

    if (allBid) {
      // All captains have bid — resolve the round
      await resolveAuctionRound(updatedRoom, players);
      const finalRoom = await models.DraftRoom.findByPk(roomId);
      const finalPlayers = await models.DraftPlayer.findAll({
        where: { roomId },
        order: [['id', 'ASC']],
      });
      return formatRoom(finalRoom, finalPlayers);
    }

    // Not all bids in yet — publish bid update and wait
    const refreshedPlayers = await models.DraftPlayer.findAll({
      where: { roomId },
      order: [['id', 'ASC']],
    });
    await publishUpdate('BID_PLACED', updatedRoom, refreshedPlayers);
    return formatRoom(updatedRoom, refreshedPlayers);
  },

  async revealNames(_, { roomId }, context) {
    requireAuth(context);
    const { room, players } = await loadRoom(roomId);

    if (room.organizerUserId !== context.user.id) throw new Error('Only the organizer can reveal names');
    if (!['DRAFTING', 'COMPLETED'].includes(room.status)) {
      throw new Error('Draft must be in DRAFTING or COMPLETED status to reveal names');
    }

    clearPickTimer(roomId);
    await room.update({ status: 'REVEALED', currentPickStartedAt: null });

    const updatedRoom = await models.DraftRoom.findByPk(roomId);
    // Publish with RSNs included (room is now REVEALED)
    await publishUpdate('NAMES_REVEALED', updatedRoom, players);
    return formatRoom(updatedRoom, players);
  },
};

module.exports = { Query, Mutation };
