'use strict';

const crypto = require('crypto');
const seedrandom = require('seedrandom');
const { ApolloError, AuthenticationError, UserInputError } = require('apollo-server-express');
const { Op } = require('sequelize');
const logger = require('../../utils/logger');
const { pubsub } = require('../pubsub');
const { rollPvmerDrop, rollSkillerDrop, buildChampionStats, rollDamage, processSpecial } = require('../../utils/clanWarsRandomisation');
const { CW_OBJECTIVE_COLLECTIONS } = require('../../utils/cwObjectiveCollections');

// Models are loaded lazily to avoid circular require issues at startup
const getModels = () => require('../../db/models');

// ============================================================
// HELPERS
// ============================================================

function generateId(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${rand}`;
}

// Seeded Fisher-Yates shuffle — returns a new array
function seededShuffle(arr, rng) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Sample `n` items from an array using a seeded RNG
function seededSample(arr, n, rng) {
  return seededShuffle(arr, rng).slice(0, n);
}

// Build task rows from the pool, seeded from the event seed.
// Per bucket: 6 initiate, 5 adept, 4 master per role.
function sampleTasksFromPool(eventId, seed) {
  const rng = seedrandom(seed);
  const tasks = [];

  for (const role of ['PVMER', 'SKILLER']) {
    const pool = CW_OBJECTIVE_COLLECTIONS[role];
    const initiatePick = seededSample(pool.initiate, 6, rng);
    const adeptPick    = seededSample(pool.adept,    5, rng);
    const masterPick   = seededSample(pool.master,   4, rng);

    for (const task of [...initiatePick, ...adeptPick, ...masterPick]) {
      tasks.push({
        taskId: generateId('cwtask'),
        eventId,
        label: task.label,
        description: task.description ?? null,
        difficulty: task.difficulty,
        role: task.role,
        isActive: true,
      });
    }
  }

  return tasks;
}

function isAdmin(event, userId, discordId) {
  if (!userId && !discordId) return false;
  if (event.creatorId === String(userId) || event.creatorId === discordId) return true;
  if (event.adminIds?.includes(String(userId))) return true;
  if (event.adminIds?.includes(discordId)) return true;
  return false;
}

async function getEventOrThrow(eventId) {
  const { ClanWarsEvent } = getModels();
  const event = await ClanWarsEvent.findByPk(eventId);
  if (!event) throw new UserInputError(`ClanWarsEvent ${eventId} not found`);
  return event;
}

async function getTeamOrThrow(teamId) {
  const { ClanWarsTeam } = getModels();
  const team = await ClanWarsTeam.findByPk(teamId);
  if (!team) throw new UserInputError(`ClanWarsTeam ${teamId} not found`);
  return team;
}

async function getWarChest(teamId) {
  const { ClanWarsItem } = getModels();
  return ClanWarsItem.findAll({ where: { teamId } });
}

// Build initial battleState from two champion snapshots
function initBattleState(snap1, snap2) {
  return {
    currentTurn: 'team1',
    turnNumber: 1,
    hp: {
      team1: snap1.stats.maxHp,
      team2: snap2.stats.maxHp,
    },
    activeEffects: { team1: [], team2: [] },
    defendActive: { team1: false, team2: false },
    consumablesRemaining: {
      team1: snap1.consumables?.map((c) => c.itemId) ?? [],
      team2: snap2.consumables?.map((c) => c.itemId) ?? [],
    },
    specialUsed: { team1: false, team2: false },
  };
}

// Process bleed/status effects at end of a team's turn
function tickEffects(state, side) {
  const effects = state.activeEffects[side] ?? [];
  let bleedDamage = 0;
  const remaining = [];

  for (const effect of effects) {
    if (effect.type === 'bleed') {
      bleedDamage += effect.value;
      if (effect.turns > 1) remaining.push({ ...effect, turns: effect.turns - 1 });
    } else if (effect.type === 'fortress') {
      // fortress counts down on attacker's turn — handled in submitBattleAction
      remaining.push(effect);
    } else {
      remaining.push(effect);
    }
  }

  return { bleedDamage, effects: remaining };
}

function advanceTurn(state) {
  return {
    ...state,
    currentTurn: state.currentTurn === 'team1' ? 'team2' : 'team1',
    turnNumber: state.turnNumber + 1,
  };
}

// ============================================================
// QUERIES
// ============================================================

const Query = {
  getClanWarsEvent: async (_, { eventId }) => {
    return getEventOrThrow(eventId);
  },

  getAllClanWarsEvents: async () => {
    const { ClanWarsEvent } = getModels();
    return ClanWarsEvent.findAll({ order: [['createdAt', 'DESC']] });
  },

  getMyClanWarsEvents: async (_, __, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const { ClanWarsEvent } = getModels();
    return ClanWarsEvent.findAll({
      where: {
        [Op.or]: [
          { creatorId: String(user.id) },
          { adminIds: { [Op.contains]: [String(user.id)] } },
        ],
      },
      order: [['createdAt', 'DESC']],
    });
  },

  getClanWarsTeam: async (_, { eventId, teamId }) => {
    const { ClanWarsTeam } = getModels();
    const team = await ClanWarsTeam.findOne({ where: { teamId, eventId } });
    if (!team) throw new UserInputError('Team not found');
    return team;
  },

  getClanWarsWarChest: async (_, { teamId }) => {
    return getWarChest(teamId);
  },

  getClanWarsSubmissions: async (_, { eventId, status }) => {
    const { ClanWarsSubmission } = getModels();
    const where = { eventId };
    if (status) where.status = status;
    return ClanWarsSubmission.findAll({ where, order: [['submittedAt', 'DESC']] });
  },

  getClanWarsBattle: async (_, { battleId }) => {
    const { ClanWarsBattle } = getModels();
    return ClanWarsBattle.findByPk(battleId);
  },

  getClanWarsBattleLog: async (_, { battleId }) => {
    const { ClanWarsBattleEvent: ClanWarsBattleLog } = getModels();
    return ClanWarsBattleLog.findAll({
      where: { battleId },
      order: [['turnNumber', 'ASC'], ['createdAt', 'ASC']],
    });
  },

  getClanWarsTaskPool: async (_, { eventId }) => {
    const { ClanWarsTask } = getModels();
    return ClanWarsTask.findAll({ where: { eventId, isActive: true } });
  },
};

// ============================================================
// MUTATIONS
// ============================================================

const Mutation = {
  // ---- Event CRUD ----

  createClanWarsEvent: async (_, { input }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask } = getModels();

    const gatheringHours = input.gatheringHours ?? 48;
    const outfittingHours = input.outfittingHours ?? 24;
    const eventId = generateId('cw');
    const seed = crypto.randomUUID();

    const eventConfig = {
      gatheringHours,
      outfittingHours,
      turnTimerSeconds: input.turnTimerSeconds ?? 60,
      maxConsumableSlots: input.maxConsumableSlots ?? 4,
      flexRolesAllowed: input.flexRolesAllowed ?? false,
    };

    const event = await ClanWarsEvent.create({
      eventId,
      clanId: input.clanId ?? null,
      eventName: input.eventName,
      status: 'DRAFT',
      eventConfig,
      bracket: null,
      seed,
      creatorId: String(user.id),
      adminIds: [String(user.id)],
    });

    // Bulk-create teams if provided
    if (input.teams?.length) {
      await Promise.all(
        input.teams.map((t) =>
          ClanWarsTeam.create({
            teamId: generateId('cwt'),
            eventId,
            teamName: t.teamName,
            discordRoleId: t.discordRoleId ?? null,
            members: t.members ?? [],
            officialLoadout: null,
            loadoutLocked: false,
            captainDiscordId: t.captainDiscordId ?? null,
            completedTaskIds: [],
          })
        )
      );
    }

    // Auto-generate task pool using seed
    const taskRows = sampleTasksFromPool(eventId, seed);
    await ClanWarsTask.bulkCreate(taskRows);

    logger.info(`[createClanWarsEvent] event=${eventId} created with seed, ${input.teams?.length ?? 0} team(s), ${taskRows.length} tasks`);
    return event;
  },

  updateClanWarsEventStatus: async (_, { eventId, status }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');

    const validTransitions = {
      DRAFT: ['GATHERING'],
      GATHERING: ['OUTFITTING'],
      OUTFITTING: ['BATTLE'],
      BATTLE: ['COMPLETED'],
      COMPLETED: ['ARCHIVED'],
    };

    if (!validTransitions[event.status]?.includes(status)) {
      throw new UserInputError(`Cannot transition from ${event.status} to ${status}`);
    }

    if (status === 'GATHERING' && !event.guildId) {
      throw new UserInputError('A Discord Guild ID must be set before starting the Gathering phase.');
    }

    const updates = { status };
    const now = new Date();

    if (status === 'GATHERING') {
      const hours = event.eventConfig?.gatheringHours ?? 48;
      updates.gatheringStart = now;
      updates.gatheringEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);
    } else if (status === 'OUTFITTING') {
      const hours = event.eventConfig?.outfittingHours ?? 24;
      updates.outfittingEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);
    }

    await event.update(updates);
    return event;
  },

  updateClanWarsEventSettings: async (_, { eventId, input }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');

    const updates = {};
    if (input.guildId !== undefined) updates.guildId = input.guildId ?? null;

    await event.update(updates);
    logger.info(`[updateClanWarsEventSettings] event=${eventId} updated by user=${user.id}`);
    return event;
  },

  joinTaskInProgress: async (_, { eventId, teamId, taskId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (event.status !== 'GATHERING') throw new UserInputError('Event is not in the Gathering phase');

    const discordId = user.discordUserId ?? null;
    if (!discordId) throw new AuthenticationError('Link your Discord account to track task progress');

    const { ClanWarsTeam, ClanWarsTask } = getModels();
    const team = await ClanWarsTeam.findByPk(teamId);
    if (!team || team.eventId !== eventId) throw new UserInputError('Team not found');

    const isEventAdmin = isAdmin(event, user.id, discordId);
    if (!isEventAdmin) {
      const isMember = (team.members ?? []).some((m) =>
        typeof m === 'string' ? m === discordId : m.discordId === discordId
      );
      if (!isMember) throw new AuthenticationError('You are not a member of this team');

      const task = await ClanWarsTask.findByPk(taskId);
      if (!task || task.eventId !== eventId) throw new UserInputError('Task not found');

      const memberRecord = (team.members ?? []).find((m) =>
        typeof m !== 'string' && m.discordId === discordId
      );
      const memberRole = memberRecord?.role ?? 'ANY';
      if (task.role !== 'ANY' && memberRole !== 'ANY' && memberRole !== task.role) {
        throw new UserInputError(`This task is for ${task.role}s only`);
      }
    }

    if ((team.completedTaskIds ?? []).includes(taskId)) {
      throw new UserInputError('This task is already completed');
    }

    const progress = { ...(team.taskProgress ?? {}) };
    const current = progress[taskId] ?? [];
    if (!current.includes(discordId)) {
      progress[taskId] = [...current, discordId];
      await team.update({ taskProgress: progress });
    }

    return team;
  },

  leaveTaskInProgress: async (_, { eventId, teamId, taskId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const discordId = user.discordUserId ?? null;
    if (!discordId) throw new AuthenticationError('Discord account required');

    const { ClanWarsTeam } = getModels();
    const team = await ClanWarsTeam.findByPk(teamId);
    if (!team || team.eventId !== eventId) throw new UserInputError('Team not found');

    const progress = { ...(team.taskProgress ?? {}) };
    const current = progress[taskId] ?? [];
    progress[taskId] = current.filter((id) => id !== discordId);
    await team.update({ taskProgress: progress });

    return team;
  },

  deleteClanWarsEvent: async (_, { eventId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    await event.destroy();
    return { success: true, message: 'Event deleted' };
  },

  generateClanWarsBracket: async (_, { eventId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    if (event.status !== 'OUTFITTING' && event.status !== 'BATTLE') {
      throw new UserInputError('Can only generate bracket during OUTFITTING or BATTLE phase');
    }

    const { ClanWarsTeam } = getModels();
    const teams = await ClanWarsTeam.findAll({ where: { eventId } });

    // Shuffle teams
    const shuffled = [...teams].sort(() => Math.random() - 0.5);

    // Build single-elimination bracket
    const rounds = [];
    let remaining = shuffled;

    while (remaining.length > 1) {
      const matches = [];
      const nextRound = [];

      for (let i = 0; i < remaining.length - 1; i += 2) {
        matches.push({
          team1Id: remaining[i].teamId,
          team2Id: remaining[i + 1].teamId,
          winnerId: null,
          battleId: null,
        });
        nextRound.push(null); // placeholder for winner
      }

      // Bye if odd number
      if (remaining.length % 2 !== 0) {
        matches.push({
          team1Id: remaining[remaining.length - 1].teamId,
          team2Id: null,
          winnerId: remaining[remaining.length - 1].teamId,
          battleId: null,
          isBye: true,
        });
      }

      rounds.push({ matches });
      // For bracket structure we only care about shape, not advancing winners
      remaining = nextRound;
    }

    await event.update({ bracket: { rounds } });
    return event;
  },

  // ---- Teams ----

  createClanWarsTeam: async (_, { eventId, input }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');

    const { ClanWarsTeam } = getModels();
    return ClanWarsTeam.create({
      teamId: generateId('cwt'),
      eventId,
      teamName: input.teamName,
      discordRoleId: input.discordRoleId ?? null,
      members: input.members ?? [],
      officialLoadout: null,
      loadoutLocked: false,
      captainDiscordId: null,
    });
  },

  updateClanWarsTeamMembers: async (_, { teamId, members }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    await team.update({ members });
    return team;
  },

  deleteClanWarsTeam: async (_, { eventId, teamId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    const team = await getTeamOrThrow(teamId);
    await team.destroy();
    return { success: true, message: 'Team deleted' };
  },

  setClanWarsCaptain: async (_, { teamId, discordId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    await team.update({ captainDiscordId: discordId });
    return team;
  },

  // ---- Tasks ----

  addClanWarsTask: async (_, { eventId, input }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');

    const { ClanWarsTask } = getModels();
    return ClanWarsTask.create({
      taskId: generateId('cwtask'),
      eventId,
      label: input.label,
      description: input.description ?? null,
      difficulty: input.difficulty,
      role: input.role,
      isActive: true,
    });
  },

  deleteClanWarsTask: async (_, { taskId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const { ClanWarsTask } = getModels();
    const task = await ClanWarsTask.findByPk(taskId);
    if (!task) throw new UserInputError('Task not found');
    const event = await getEventOrThrow(task.eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    await task.update({ isActive: false });
    return { success: true, message: 'Task deactivated' };
  },

  // ---- Submissions (also called from bot via internal mutation) ----

  createClanWarsSubmission: async (_, { input }) => {
    const { ClanWarsSubmission, ClanWarsTask } = getModels();

    const event = await getEventOrThrow(input.eventId);
    if (event.status !== 'GATHERING') {
      throw new UserInputError('Event is not in GATHERING phase');
    }

    // Look up task for label + validate difficulty/role
    const task = await ClanWarsTask.findByPk(input.taskId);
    const taskLabel = task?.label ?? input.taskId;
    const difficulty = task?.difficulty ?? input.difficulty;
    const role = task?.role ?? input.role;

    const submission = await ClanWarsSubmission.create({
      submissionId: generateId('cws'),
      eventId: input.eventId,
      teamId: input.teamId,
      submittedBy: input.submittedBy,
      submittedUsername: input.submittedUsername ?? null,
      channelId: input.channelId ?? null,
      taskId: input.taskId,
      taskLabel,
      difficulty,
      role,
      screenshot: input.screenshot ?? null,
      status: 'PENDING',
      submittedAt: new Date(),
    });

    await pubsub.publish(`CLAN_WARS_SUBMISSION_ADDED_${input.eventId}`, {
      clanWarsSubmissionAdded: submission,
    });

    return submission;
  },

  reviewClanWarsSubmission: async (_, { submissionId, approved, reviewerId, rewardSlot, denialReason }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');

    const { ClanWarsSubmission, ClanWarsItem } = getModels();
    const submission = await ClanWarsSubmission.findByPk(submissionId);
    if (!submission) throw new UserInputError('Submission not found');
    if (submission.status !== 'PENDING') throw new UserInputError('Submission already reviewed');

    const event = await getEventOrThrow(submission.eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');

    const updates = {
      status: approved ? 'APPROVED' : 'DENIED',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNote: denialReason ?? null,
    };

    if (approved) {
      const warChest = await getWarChest(submission.teamId);
      const warChestData = warChest.map((i) => ({ name: i.name, slot: i.slot, rarity: i.rarity }));

      let dropResult;
      if (submission.role === 'PVMER') {
        if (!rewardSlot) throw new UserInputError('rewardSlot required for PVMER submissions');
        dropResult = rollPvmerDrop({ slot: rewardSlot, difficulty: submission.difficulty, warChest: warChestData });
      } else {
        dropResult = rollSkillerDrop({ difficulty: submission.difficulty, warChest: warChestData });
      }

      if (!dropResult.success) {
        logger.warn(`[ClanWars] Drop failed for submission ${submissionId}: ${dropResult.reason}`);
        // Still approve submission but note no item was awarded
        updates.reviewNote = `Approved — no item awarded: ${dropResult.reason}`;
      } else {
        const item = dropResult.item;
        const slot = dropResult.slot ?? rewardSlot;

        const createdItem = await ClanWarsItem.create({
          itemId: generateId('cwi'),
          teamId: submission.teamId,
          eventId: submission.eventId,
          name: item.name,
          slot,
          rarity: dropResult.rarity,
          itemSnapshot: item,
          sourceSubmissionId: submissionId,
          earnedAt: new Date(),
          isEquipped: false,
          isUsed: false,
        });

        updates.rewardSlot = slot;
        updates.rewardItemId = createdItem.itemId;
      }
    }

    await submission.update(updates);

    // Track completed task on the team
    if (approved) {
      const { ClanWarsTeam } = getModels();
      const team = await ClanWarsTeam.findByPk(submission.teamId);
      if (team && submission.taskId) {
        const current = team.completedTaskIds ?? [];
        if (!current.includes(submission.taskId)) {
          await team.update({ completedTaskIds: [...current, submission.taskId] });
        }
      }
    }

    await pubsub.publish(`CLAN_WARS_SUBMISSION_REVIEWED_${submission.eventId}`, {
      clanWarsSubmissionReviewed: submission,
    });

    // Send Discord DM notification via notifications util (best-effort)
    try {
      const { sendClanWarsSubmissionResult } = require('../../utils/clanWarsNotifications');
      const rewardItem = updates.rewardItemId
        ? await ClanWarsItem.findByPk(updates.rewardItemId)
        : null;
      await sendClanWarsSubmissionResult({
        discordId: submission.submittedBy,
        channelId: submission.channelId,
        taskLabel: submission.taskLabel,
        approved,
        denialReason,
        item: rewardItem,
      });
    } catch (err) {
      logger.warn('[ClanWars] Discord notification failed:', err.message);
    }

    return submission;
  },

  // ---- Outfitting ----

  saveOfficialLoadout: async (_, { teamId, loadout }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const team = await getTeamOrThrow(teamId);
    if (team.loadoutLocked) throw new UserInputError('Loadout is locked and cannot be changed');
    await team.update({ officialLoadout: loadout });
    return team;
  },

  lockClanWarsLoadout: async (_, { teamId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    if (event.status !== 'OUTFITTING') throw new UserInputError('Event is not in OUTFITTING phase');
    if (!team.officialLoadout) throw new UserInputError('No official loadout set');
    await team.update({ loadoutLocked: true });
    return team;
  },

  // ---- Admin shortcuts ----

  adminForceEventStatus: async (_, { eventId, status }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    const validStatuses = ['DRAFT', 'GATHERING', 'OUTFITTING', 'BATTLE', 'COMPLETED', 'ARCHIVED'];
    if (!validStatuses.includes(status)) throw new UserInputError(`Unknown status: ${status}`);
    const updates = { status };
    const now = new Date();
    if (status === 'GATHERING' && !event.gatheringStart) {
      const hours = event.eventConfig?.gatheringHours ?? 48;
      updates.gatheringStart = now;
      updates.gatheringEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);
    } else if (status === 'OUTFITTING' && !event.outfittingEnd) {
      const hours = event.eventConfig?.outfittingHours ?? 24;
      updates.outfittingEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);
    }
    await event.update(updates);
    logger.info(`[adminForceEventStatus] event=${eventId} forced to ${status} by user=${user.id}`);
    return event;
  },

  adminLockAllLoadouts: async (_, { eventId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    const { ClanWarsTeam } = getModels();
    const teams = await ClanWarsTeam.findAll({ where: { eventId } });
    const unlocked = teams.filter((t) => !t.loadoutLocked && t.officialLoadout);
    await Promise.all(unlocked.map((t) => t.update({ loadoutLocked: true })));
    logger.info(`[adminLockAllLoadouts] event=${eventId} locked ${unlocked.length} team(s)`);
    return ClanWarsTeam.findAll({ where: { eventId } });
  },

  // ---- Battle ----

  setCaptainReady: async (_, { eventId, teamId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);

    const { ClanWarsTeam } = getModels();
    const team = await ClanWarsTeam.findByPk(teamId);
    if (!team) throw new UserInputError('Team not found');

    const isCaptain = team.captainDiscordId === user.discordUserId;
    if (!isCaptain && !isAdmin(event, user.id)) {
      throw new AuthenticationError('Only the team captain or an admin can ready up');
    }

    const bracket = event.bracket ?? { rounds: [] };
    let found = false;
    const updatedRounds = bracket.rounds.map((round) => ({
      ...round,
      matches: round.matches.map((m) => {
        if (found || m.battleId) return m; // already started, skip
        if (m.team1Id === teamId) { found = true; return { ...m, team1Ready: true }; }
        if (m.team2Id === teamId) { found = true; return { ...m, team2Ready: true }; }
        return m;
      }),
    }));

    if (!found) throw new UserInputError('No upcoming match found for this team');
    await event.update({ bracket: { ...bracket, rounds: updatedRounds } });
    return event;
  },

  startClanWarsBattle: async (_, { eventId, team1Id, team2Id }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');

    const { ClanWarsTeam, ClanWarsItem, ClanWarsBattle, ClanWarsBattleEvent: ClanWarsBattleLog } = getModels();

    const [team1, team2] = await Promise.all([
      ClanWarsTeam.findByPk(team1Id),
      ClanWarsTeam.findByPk(team2Id),
    ]);

    if (!team1?.loadoutLocked || !team2?.loadoutLocked) {
      throw new UserInputError('Both teams must have locked loadouts before battle starts');
    }

    // Build champion stats from equipped items
    const [items1, items2] = await Promise.all([
      ClanWarsItem.findAll({ where: { teamId: team1Id } }),
      ClanWarsItem.findAll({ where: { teamId: team2Id } }),
    ]);

    const stats1 = buildChampionStats(team1.officialLoadout, items1.map((i) => i.toJSON()));
    const stats2 = buildChampionStats(team2.officialLoadout, items2.map((i) => i.toJSON()));

    const champion1 = { teamId: team1Id, teamName: team1.teamName, stats: stats1, loadout: team1.officialLoadout };
    const champion2 = { teamId: team2Id, teamName: team2.teamName, stats: stats2, loadout: team2.officialLoadout };

    // Faster team goes first
    const firstTurn = stats1.speed >= stats2.speed ? 'team1' : 'team2';
    const initialState = {
      ...initBattleState(champion1, champion2),
      currentTurn: firstTurn,
    };

    const rngSeed = Math.random().toString(36).slice(2);
    const battle = await ClanWarsBattle.create({
      battleId: generateId('cwb'),
      eventId,
      team1Id,
      team2Id,
      status: 'IN_PROGRESS',
      championSnapshots: { champion1, champion2 },
      battleState: initialState,
      rngSeed,
      startedAt: new Date(),
    });

    // Log BATTLE_START event
    await ClanWarsBattleLog.create({
      eventLogId: generateId('cwbe'),
      battleId: battle.battleId,
      turnNumber: 0,
      actorTeamId: null,
      action: 'BATTLE_START',
      rollInputs: null,
      damageDealt: null,
      isCrit: null,
      narrative: `⚔️ Battle begins! ${team1.teamName} vs ${team2.teamName}. ${firstTurn === 'team1' ? team1.teamName : team2.teamName} goes first (higher speed).`,
      hpAfter: { team1: initialState.hp.team1, team2: initialState.hp.team2 },
    });

    await pubsub.publish(`CLAN_WARS_BATTLE_UPDATED_${battle.battleId}`, {
      clanWarsBattleUpdated: {
        battleId: battle.battleId,
        battle,
        latestEvent: null,
      },
    });

    // Write battleId back to the bracket so clients can auto-detect via polling
    const bracket = event.bracket ?? { rounds: [] };
    let bracketUpdated = false;
    const updatedRounds = bracket.rounds.map((round) => ({
      ...round,
      matches: round.matches.map((m) => {
        if (
          !bracketUpdated &&
          !m.battleId &&
          ((m.team1Id === team1Id && m.team2Id === team2Id) ||
           (m.team1Id === team2Id && m.team2Id === team1Id))
        ) {
          bracketUpdated = true;
          return { ...m, battleId: battle.battleId };
        }
        return m;
      }),
    }));
    if (bracketUpdated) {
      await event.update({ bracket: { ...bracket, rounds: updatedRounds } });
    }

    return battle;
  },

  submitBattleAction: async (_, { battleId, teamId, action, itemId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');

    const { ClanWarsBattle, ClanWarsBattleEvent: ClanWarsBattleLog, ClanWarsItem } = getModels();

    const battle = await ClanWarsBattle.findByPk(battleId);
    if (!battle) throw new UserInputError('Battle not found');
    if (battle.status !== 'IN_PROGRESS') throw new UserInputError('Battle is not in progress');

    const state = battle.battleState;
    const snap = battle.championSnapshots;

    const actorSide = state.currentTurn; // 'team1' | 'team2'
    const defSide = actorSide === 'team1' ? 'team2' : 'team1';

    const actorTeamId = actorSide === 'team1' ? battle.team1Id : battle.team2Id;
    if (actorTeamId !== teamId) throw new UserInputError('It is not your turn');

    const actorSnap = snap[actorSide === 'team1' ? 'champion1' : 'champion2'];
    const defSnap = snap[actorSide === 'team1' ? 'champion2' : 'champion1'];

    let narrative = '';
    let damageDealt = 0;
    let isCrit = false;
    let effectApplied = null;
    let itemUsedId = null;
    let newState = { ...state };

    // Decay fortress effect on actor's turn
    newState.activeEffects[actorSide] = (newState.activeEffects[actorSide] ?? [])
      .map((e) => (e.type === 'fortress' ? { ...e, turns: e.turns - 1 } : e))
      .filter((e) => e.turns > 0);

    const isDefending = newState.defendActive[defSide] ?? false;

    if (action === 'ATTACK') {
      const roll = rollDamage({
        attackStat: actorSnap.stats.attack,
        defenseStat: defSnap.stats.defense,
        critChance: actorSnap.stats.crit,
        isDefending,
      });
      damageDealt = roll.damage;
      isCrit = roll.isCrit;
      newState.hp[defSide] = Math.max(0, newState.hp[defSide] - damageDealt);
      newState.defendActive[defSide] = false;
      narrative = `${isCrit ? '💥 CRIT! ' : ''}${actorSnap.teamName} attacks for ${damageDealt} damage!${isCrit ? ' (critical hit!)' : ''}`;

    } else if (action === 'DEFEND') {
      newState.defendActive[actorSide] = true;
      narrative = `🛡️ ${actorSnap.teamName} takes a defensive stance! (−60% damage until next hit)`;

    } else if (action === 'SPECIAL') {
      if (newState.specialUsed[actorSide]) throw new UserInputError('Special already used this battle');
      const specials = actorSnap.stats.specials ?? [];
      if (!specials.length) throw new UserInputError('No special ability available');

      const specialId = specials[0];
      const result = processSpecial(specialId, actorSnap, defSnap, newState, actorSide, defSide);

      damageDealt = result.damage;
      isCrit = result.isCrit ?? false;
      newState.hp[defSide] = Math.max(0, newState.hp[defSide] - damageDealt);
      if (result.attackerHeal) newState.hp[actorSide] = Math.min(actorSnap.stats.maxHp, newState.hp[actorSide] + result.attackerHeal);
      newState.activeEffects[defSide] = [...(newState.activeEffects[defSide] ?? []), ...(result.defenderEffects ?? [])];
      newState.activeEffects[actorSide] = [...(newState.activeEffects[actorSide] ?? []), ...(result.attackerEffects ?? [])];
      newState.specialUsed[actorSide] = true;
      newState.defendActive[defSide] = false;
      effectApplied = specialId;
      narrative = result.narrative;

    } else if (action === 'USE_ITEM') {
      if (!itemId) throw new UserInputError('itemId required for USE_ITEM action');
      const consumables = newState.consumablesRemaining[actorSide] ?? [];
      if (!consumables.includes(itemId)) throw new UserInputError('Item not available or already used');

      const item = await ClanWarsItem.findByPk(itemId);
      if (!item) throw new UserInputError('Item not found');

      const effect = item.itemSnapshot?.consumableEffect;
      if (!effect) throw new UserInputError('Item has no consumable effect');

      itemUsedId = itemId;
      newState.consumablesRemaining[actorSide] = consumables.filter((id) => id !== itemId);
      await item.update({ isUsed: true });

      if (effect.type === 'heal') {
        const heal = effect.value;
        newState.hp[actorSide] = Math.min(actorSnap.stats.maxHp, newState.hp[actorSide] + heal);
        narrative = `🍖 ${actorSnap.teamName} uses ${item.name}! Restored ${heal} HP.`;
      } else if (effect.type === 'damage') {
        damageDealt = effect.value;
        newState.hp[defSide] = Math.max(0, newState.hp[defSide] - damageDealt);
        narrative = `💣 ${actorSnap.teamName} hurls ${item.name}! ${damageDealt} magic damage (bypasses defense)!`;
      } else if (effect.type === 'debuff') {
        newState.activeEffects[defSide].push({ type: effect.type, debuffType: effect.debuffType ?? 'blind', turns: effect.duration || 1 });
        narrative = `✨ ${actorSnap.teamName} uses ${item.name}! ${effect.description}`;
      } else {
        // Buff stat effects — store in activeEffects for display; actual stat changes during battle use base + buffs
        newState.activeEffects[actorSide].push({ type: 'buff', stat: effect.type.replace('buff_', ''), value: effect.value, turns: effect.duration || 2 });
        narrative = `⚗️ ${actorSnap.teamName} uses ${item.name}! ${effect.description}`;
      }
    }

    // Tick bleed on attacker AFTER their action (per spec)
    const bleedResult = tickEffects(newState, actorSide);
    if (bleedResult.bleedDamage > 0) {
      newState.hp[actorSide] = Math.max(0, newState.hp[actorSide] - bleedResult.bleedDamage);
      newState.activeEffects[actorSide] = bleedResult.effects;
    }

    // Advance turn
    newState = advanceTurn(newState);

    const hpAfter = { team1: newState.hp.team1, team2: newState.hp.team2 };

    // Check for battle end
    let battleOver = false;
    let winnerId = null;
    let battleEndNarrative = null;

    if (newState.hp.team1 <= 0 || newState.hp.team2 <= 0) {
      battleOver = true;
      winnerId = newState.hp.team1 <= 0 ? battle.team2Id : battle.team1Id;
      const winnerName = winnerId === battle.team1Id ? snap.champion1.teamName : snap.champion2.teamName;
      battleEndNarrative = `💀 ${newState.hp.team1 <= 0 ? snap.champion1.teamName : snap.champion2.teamName} has fallen! ${winnerName} wins!`;
    }

    // Log the action
    const logEntry = await ClanWarsBattleLog.create({
      eventLogId: generateId('cwbe'),
      battleId,
      turnNumber: state.turnNumber,
      actorTeamId,
      action,
      rollInputs: action === 'ATTACK' ? { attackStat: actorSnap.stats.attack, defenseStat: defSnap.stats.defense, critChance: actorSnap.stats.crit, isDefending } : null,
      damageDealt: damageDealt || null,
      isCrit: isCrit || null,
      itemUsedId: itemUsedId ?? null,
      effectApplied,
      hpAfter,
      narrative,
    });

    // Update battle
    const battleUpdates = { battleState: newState };
    if (battleOver) {
      battleUpdates.status = 'COMPLETED';
      battleUpdates.winnerId = winnerId;
      battleUpdates.endedAt = new Date();

      // Log BATTLE_END
      await ClanWarsBattleLog.create({
        eventLogId: generateId('cwbe'),
        battleId,
        turnNumber: newState.turnNumber,
        actorTeamId: null,
        action: 'BATTLE_END',
        rollInputs: null,
        damageDealt: null,
        isCrit: null,
        narrative: battleEndNarrative,
        hpAfter,
      });
    }

    await battle.update(battleUpdates);

    // Write winnerId back to the bracket so clients can detect round completion via polling
    if (battleOver) {
      const eventRecord = await getEventOrThrow(battle.eventId);
      const b = eventRecord.bracket;
      if (b?.rounds) {
        const winnerRounds = b.rounds.map((round) => ({
          ...round,
          matches: round.matches.map((m) =>
            m.battleId === battleId ? { ...m, winnerId } : m
          ),
        }));
        await eventRecord.update({ bracket: { ...b, rounds: winnerRounds } });
      }
    }

    // If bleed ticked, log it separately
    if (bleedResult.bleedDamage > 0) {
      await ClanWarsBattleLog.create({
        eventLogId: generateId('cwbe'),
        battleId,
        turnNumber: state.turnNumber,
        actorTeamId,
        action: 'BLEED_TICK',
        rollInputs: null,
        damageDealt: bleedResult.bleedDamage,
        isCrit: false,
        narrative: `🩸 Bleed deals ${bleedResult.bleedDamage} damage to ${actorSnap.teamName}!`,
        hpAfter,
      });
    }

    // Broadcast
    await pubsub.publish(`CLAN_WARS_BATTLE_UPDATED_${battleId}`, {
      clanWarsBattleUpdated: {
        battleId,
        battle,
        latestEvent: logEntry,
      },
    });

    return battle;
  },
};

// ============================================================
// FIELD RESOLVERS
// ============================================================

const ClanWarsEvent = {
  teams: async (event, _, { loaders }) => {
    const { ClanWarsTeam } = getModels();
    return ClanWarsTeam.findAll({ where: { eventId: event.eventId } });
  },
  submissions: async (event) => {
    const { ClanWarsSubmission } = getModels();
    return ClanWarsSubmission.findAll({ where: { eventId: event.eventId }, order: [['submittedAt', 'DESC']] });
  },
  tasks: async (event) => {
    const { ClanWarsTask } = getModels();
    return ClanWarsTask.findAll({ where: { eventId: event.eventId, isActive: true } });
  },
  battles: async (event) => {
    const { ClanWarsBattle } = getModels();
    return ClanWarsBattle.findAll({ where: { eventId: event.eventId } });
  },
};

const ClanWarsTeam = {
  items: async (team) => {
    const { ClanWarsItem } = getModels();
    return ClanWarsItem.findAll({ where: { teamId: team.teamId } });
  },
  submissions: async (team) => {
    const { ClanWarsSubmission } = getModels();
    return ClanWarsSubmission.findAll({ where: { teamId: team.teamId }, order: [['submittedAt', 'DESC']] });
  },
};

const ClanWarsSubmission = {
  rewardItem: async (submission) => {
    if (!submission.rewardItemId) return null;
    const { ClanWarsItem } = getModels();
    return ClanWarsItem.findByPk(submission.rewardItemId);
  },
};

const ClanWarsBattle = {
  battleLog: async (battle) => {
    const { ClanWarsBattleEvent: ClanWarsBattleLog } = getModels();
    return ClanWarsBattleLog.findAll({
      where: { battleId: battle.battleId },
      order: [['turnNumber', 'ASC'], ['createdAt', 'ASC']],
    });
  },
};

module.exports = {
  Query,
  Mutation,
  ClanWarsEvent,
  ClanWarsTeam,
  ClanWarsSubmission,
  ClanWarsBattle,
};
