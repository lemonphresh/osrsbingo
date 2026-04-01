'use strict';

const crypto = require('crypto');
const { ApolloError, AuthenticationError, UserInputError } = require('apollo-server-express');
const { Op, fn, col, literal } = require('sequelize');
const logger = require('../../utils/logger');
const { pubsub } = require('../pubsub');
const { rollPvmerDrop, rollSkillerDrop, buildChampionStats, rollDamage, processSpecial } = require('../../utils/clanWarsRandomisation');
const { sampleTasksFromPool, generateId } = require('../../utils/cwTaskSampler');
const {
  buildSEBracket,
  buildDEBracket,
  advanceBracketAfterBattle,
  findNextUnstartedMatch,
  setBattleIdInBracket,
  setTeamReadyInBracket,
  allMatchesDone,
} = require('../../utils/cwBracket');

// Models are loaded lazily to avoid circular require issues at startup
const getModels = () => require('../../db/models');

const { sendClanWarsPhaseAnnouncement, sendBattleCompleteAnnouncement } = require('../../utils/clanWarsNotifications');
const { triggerGatheringTransition } = require('../../utils/cwScheduler');

function isAdmin(event, userId, discordId) {
  if (!userId && !discordId) return false;
  if (event.creatorId === String(userId) || event.creatorId === discordId) return true;
  if (event.adminIds?.includes(String(userId))) return true;
  if (event.adminIds?.includes(discordId)) return true;
  return false;
}

function isRef(event, userId) {
  if (!userId) return false;
  return event.refIds?.includes(String(userId)) ?? false;
}

function isAdminOrRef(event, userId, discordId) {
  return isAdmin(event, userId, discordId) || isRef(event, userId);
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

// Returns a stat object merged with active buff/debuff effects for a side.
function getEffectiveStats(snap, effects) {
  const base = { ...snap.stats };
  for (const e of effects ?? []) {
    if (e.type === 'buff') {
      if (e.stat === 'all') {
        base.attack  = (base.attack  ?? 0) + e.value;
        base.defense = (base.defense ?? 0) + e.value;
        base.speed   = (base.speed   ?? 0) + e.value;
        base.crit    = (base.crit    ?? 0) + e.value;
      } else if (e.stat in base) {
        base[e.stat] = (base[e.stat] ?? 0) + e.value;
      }
    } else if (e.type === 'debuff' && e.debuffType === 'weaken') {
      base.attack = Math.max(0, (base.attack ?? 0) - e.value);
    }
  }
  return base;
}

function hasFortress(effects) {
  return (effects ?? []).some((e) => e.type === 'fortress');
}

function isBlinded(effects) {
  return (effects ?? []).some((e) => e.type === 'debuff' && e.debuffType === 'blind');
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
      // fortress counts down on actor's turn at top of submitBattleAction
      remaining.push(effect);
    } else {
      // buff, debuff, and all other timed effects — decrement and drop when expired
      if (effect.turns > 1) remaining.push({ ...effect, turns: effect.turns - 1 });
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
          { refIds: { [Op.contains]: [String(user.id)] } },
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

  getClanWarsSubmissionSummaries: async (_, { eventId }) => {
    const { ClanWarsSubmission } = getModels();
    const rows = await ClanWarsSubmission.findAll({
      where: { eventId },
      attributes: [
        'taskId',
        'teamId',
        'status',
        [fn('COUNT', col('submissionId')), 'count'],
      ],
      group: ['taskId', 'teamId', 'status'],
      raw: true,
    });

    const map = {};
    for (const row of rows) {
      const key = `${row.taskId}_${row.teamId}`;
      if (!map[key]) map[key] = { taskId: row.taskId, teamId: row.teamId, pendingCount: 0, approvedCount: 0, deniedCount: 0 };
      const count = parseInt(row.count, 10);
      if (row.status === 'PENDING')  map[key].pendingCount  = count;
      if (row.status === 'APPROVED') map[key].approvedCount = count;
      if (row.status === 'DENIED')   map[key].deniedCount   = count;
    }
    return Object.values(map);
  },

  getClanWarsTaskSubmissions: async (_, { eventId, taskId, teamId }) => {
    const { ClanWarsSubmission } = getModels();
    return ClanWarsSubmission.findAll({
      where: { eventId, taskId, teamId },
      order: [['submittedAt', 'DESC']],
    });
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

  getClanWarsPreScreenshots: async (_, { eventId }) => {
    const { ClanWarsPreScreenshot } = getModels();
    return ClanWarsPreScreenshot.findAll({ where: { eventId }, order: [['submittedAt', 'DESC']] });
  },
};

// ============================================================
// MUTATIONS
// ============================================================

const Mutation = {
  // ---- Event CRUD ----

  createClanWarsEvent: async (_, { input }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const { ClanWarsEvent, ClanWarsTeam } = getModels();

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
      bracketType: input.bracketType ?? 'SINGLE_ELIMINATION',
    };

    const event = await ClanWarsEvent.create({
      eventId,
      clanId: input.clanId ?? null,
      eventName: input.eventName,
      status: 'DRAFT',
      eventConfig,
      bracket: null,
      seed,
      difficulty: input.difficulty ?? 'standard',
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

    logger.info(`[createClanWarsEvent] event=${eventId} created with seed, ${input.teams?.length ?? 0} team(s)`);
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
      COMPLETED: [],
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
      await triggerGatheringTransition(event);
      logger.info(`[updateClanWarsEventStatus] event=${eventId} transitioned to GATHERING`);
      pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${eventId}`, { clanWarsEventUpdated: event });
      return event;

    } else if (status === 'OUTFITTING') {
      const hours = event.eventConfig?.outfittingHours ?? 24;
      updates.outfittingEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);
    } else if (status === 'BATTLE') {
      // Auto-lock all teams that haven't locked their loadout yet
      const { ClanWarsTeam } = getModels();
      await ClanWarsTeam.update(
        { loadoutLocked: true },
        { where: { eventId, loadoutLocked: false } }
      );
    }

    await event.update(updates);

    // Fire Discord announcement (best-effort, non-blocking)
    if (event.announcementsChannelId) {
      sendClanWarsPhaseAnnouncement({
        channelId: event.announcementsChannelId,
        eventId: event.eventId,
        eventName: event.eventName,
        phase: status,
      });
    }

    pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${eventId}`, { clanWarsEventUpdated: event });
    return event;
  },

  updateClanWarsEventSettings: async (_, { eventId, input }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');

    const updates = {};
    if (input.guildId !== undefined) updates.guildId = input.guildId ?? null;
    if (input.announcementsChannelId !== undefined) updates.announcementsChannelId = input.announcementsChannelId ?? null;
    if (input.scheduledGatheringStart !== undefined) updates.scheduledGatheringStart = input.scheduledGatheringStart ?? null;

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

  generateClanWarsBracket: async (_, { eventId, bracketType }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id)) throw new AuthenticationError('Not an event admin');
    if (event.status !== 'OUTFITTING' && event.status !== 'BATTLE') {
      throw new UserInputError('Can only generate bracket during OUTFITTING or BATTLE phase');
    }

    const { ClanWarsTeam } = getModels();
    const teams = await ClanWarsTeam.findAll({ where: { eventId } });

    // Shuffle teams
    const shuffledIds = [...teams].sort(() => Math.random() - 0.5).map((t) => t.teamId);

    const resolvedBracketType = bracketType ?? event.eventConfig?.bracketType ?? 'SINGLE_ELIMINATION';
    const useDe = resolvedBracketType === 'DOUBLE_ELIMINATION';
    const bracket = useDe ? buildDEBracket(shuffledIds) : buildSEBracket(shuffledIds);

    await event.update({ bracket });
    return event;
  },

  // ---- Admins & Refs ----

  addClanWarsAdmin: async (_, { eventId, userId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (event.creatorId !== String(user.id))
      throw new AuthenticationError('Only the event creator can add admins');
    const newAdminIds = [...new Set([...(event.adminIds ?? []), String(userId)])];
    await event.update({ adminIds: newAdminIds });
    return event;
  },

  removeClanWarsAdmin: async (_, { eventId, userId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (event.creatorId !== String(user.id))
      throw new AuthenticationError('Only the event creator can remove admins');
    await event.update({ adminIds: (event.adminIds ?? []).filter((id) => id !== String(userId)) });
    return event;
  },

  addClanWarsRef: async (_, { eventId, userId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id))
      throw new AuthenticationError('Only admins can add refs');
    const newRefIds = [...new Set([...(event.refIds ?? []), String(userId)])];
    await event.update({ refIds: newRefIds });
    return event;
  },

  removeClanWarsRef: async (_, { eventId, userId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user.id))
      throw new AuthenticationError('Only admins can remove refs');
    await event.update({ refIds: (event.refIds ?? []).filter((id) => id !== String(userId)) });
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

    if (!isAdmin(event, user.id)) {
      // Non-admins may only update their own member entry (e.g. setting their role)
      const discordId = user.discordUserId ?? null;
      if (!discordId) throw new AuthenticationError('Not an event admin');

      const existing = team.members ?? [];
      const isMember = existing.some((m) =>
        typeof m === 'string' ? m === discordId : m.discordId === discordId
      );
      if (!isMember) throw new AuthenticationError('Not an event admin');

      // Ensure the update only touches the caller's own entry
      const onlyOwnChange = members.every((m) => {
        if (m.discordId !== discordId) {
          const orig = existing.find((e) => e.discordId === m.discordId);
          return orig && orig.role === m.role;
        }
        return true;
      });
      if (!onlyOwnChange) throw new AuthenticationError('Not an event admin');

      // Role is locked once the player has joined any task
      const hasJoinedTask = Object.values(team.taskProgress ?? {}).some(
        (ids) => Array.isArray(ids) && ids.includes(discordId)
      );
      if (hasJoinedTask) {
        throw new UserInputError('Your role is locked once you have joined a task');
      }

      // Enforce FLEX cap: max 20% of team (at least 1)
      const newRole = members.find((m) => m.discordId === discordId)?.role;
      if (newRole === 'FLEX') {
        if (!event.eventConfig?.flexRolesAllowed) {
          throw new UserInputError('Flex role is not available for this event');
        }
        const flexCount = (team.members ?? []).filter(
          (m) => m.discordId !== discordId && m.role === 'FLEX'
        ).length;
        const maxFlex = Math.max(1, Math.ceil((team.members ?? []).length * 0.2));
        if (flexCount >= maxFlex) {
          throw new UserInputError(`Flex slots are full (max ${maxFlex} for this team)`);
        }
      }
    }

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
      quantity: input.quantity ?? null,
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

  setTaskProgress: async (_, { eventId, teamId, taskId, value }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdminOrRef(event, user.id)) throw new AuthenticationError('Not an event admin');
    const { ClanWarsTeam } = getModels();
    const team = await ClanWarsTeam.findByPk(teamId);
    if (!team || team.eventId !== eventId) throw new UserInputError('Team not found');
    const progress = { ...(team.numericTaskProgress ?? {}) };
    progress[taskId] = Math.max(0, value);
    await team.update({ numericTaskProgress: progress });
    return team;
  },

  markTaskComplete: async (_, { eventId, teamId, taskId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdminOrRef(event, user.id)) throw new AuthenticationError('Not an event admin');

    const { ClanWarsTeam, ClanWarsSubmission, ClanWarsItem } = getModels();
    const team = await ClanWarsTeam.findByPk(teamId);
    if (!team || team.eventId !== eventId) throw new UserInputError('Team not found');

    // Roll drops for all approved submissions that haven't been rewarded yet
    const approvedSubs = await ClanWarsSubmission.findAll({
      where: { eventId, teamId, taskId, status: 'APPROVED' },
    });

    const warChest = await getWarChest(teamId);
    const warChestData = warChest.map((i) => ({ name: i.name, slot: i.slot, rarity: i.rarity }));

    // PVMER: each approved submission gets its own individual drop.
    // SKILLER: one reward total per task completion — roll once for the first unrewarded submission.
    // Track whether a skiller reward has already been given (either previously or in this loop).
    let skillerRewarded = approvedSubs.some((s) => s.role === 'SKILLER' && s.rewardItemId);

    for (const sub of approvedSubs) {
      if (sub.rewardItemId) continue; // already rewarded
      if (sub.rewardSlot === 'none') continue; // explicitly marked no reward

      let dropResult;
      if (sub.role === 'PVMER') {
        if (!sub.rewardSlot) continue; // slot not stored, skip
        dropResult = rollPvmerDrop({ slot: sub.rewardSlot, difficulty: sub.difficulty, warChest: warChestData });
      } else {
        // SKILLER: only one reward per task completion
        if (skillerRewarded) continue;
        dropResult = rollSkillerDrop({ difficulty: sub.difficulty, warChest: warChestData });
      }

      if (!dropResult.success) {
        logger.warn(`[ClanWars] markTaskComplete drop failed for sub ${sub.submissionId}: ${dropResult.reason}`);
        continue;
      }

      const item = dropResult.item;
      const slot = dropResult.slot ?? sub.rewardSlot;
      const createdItem = await ClanWarsItem.create({
        itemId: generateId('cwi'),
        teamId,
        eventId,
        name: item.name,
        slot,
        rarity: dropResult.rarity,
        itemSnapshot: item,
        sourceSubmissionId: sub.submissionId,
        earnedAt: new Date(),
        isEquipped: false,
        isUsed: false,
      });
      await sub.update({ rewardItemId: createdItem.itemId });
      if (sub.role === 'SKILLER') skillerRewarded = true;
    }

    // Mark the task complete on the team
    const current = team.completedTaskIds ?? [];
    if (!current.includes(taskId)) {
      await team.update({ completedTaskIds: [...current, taskId] });
    }
    return team;
  },

  undoTaskComplete: async (_, { eventId, teamId, taskId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const event = await getEventOrThrow(eventId);
    if (!isAdminOrRef(event, user.id)) throw new AuthenticationError('Not an event admin');

    const { ClanWarsTeam, ClanWarsSubmission, ClanWarsItem } = getModels();
    const team = await ClanWarsTeam.findByPk(teamId);
    if (!team || team.eventId !== eventId) throw new UserInputError('Team not found');

    // Remove taskId from completedTaskIds
    const current = team.completedTaskIds ?? [];
    await team.update({ completedTaskIds: current.filter((id) => id !== taskId) });

    // Find all approved submissions for this task/team that have a reward item
    const approvedSubs = await ClanWarsSubmission.findAll({
      where: { eventId, teamId, taskId, status: 'APPROVED' },
    });

    for (const sub of approvedSubs) {
      if (!sub.rewardItemId) continue;
      // Delete the item and clear the reference
      await ClanWarsItem.destroy({ where: { itemId: sub.rewardItemId } });
      await sub.update({ rewardItemId: null });
    }

    return team;
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
    if (!isAdminOrRef(event, user.id)) throw new AuthenticationError('Not an event admin');

    const updates = {
      status: approved ? 'APPROVED' : 'DENIED',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewNote: denialReason ?? null,
    };

    // Store the intended reward slot now, but don't roll the drop.
    // The actual item is created when an admin explicitly marks the task complete.
    // rewardSlot='none' is valid for both roles — no drop will be rolled at task completion.
    if (approved) {
      if (submission.role === 'PVMER') {
        if (!rewardSlot) throw new UserInputError('rewardSlot required for PVMER submissions');
        updates.rewardSlot = rewardSlot;
      } else if (rewardSlot === 'none') {
        updates.rewardSlot = 'none';
      }
    }

    await submission.update(updates);

    await pubsub.publish(`CLAN_WARS_SUBMISSION_REVIEWED_${submission.eventId}`, {
      clanWarsSubmissionReviewed: submission,
    });

    // Send Discord DM notification via notifications util (best-effort)
    try {
      const { sendClanWarsSubmissionResult } = require('../../utils/clanWarsNotifications');
      await sendClanWarsSubmissionResult({
        discordId: submission.submittedBy,
        channelId: submission.channelId,
        taskLabel: submission.taskLabel,
        approved,
        denialReason,
        item: null, // item awarded at task completion, not approval
      });
    } catch (err) {
      logger.warn('[ClanWars] Discord notification failed:', err.message);
    }

    return submission;
  },

  changeSubmissionRewardSlot: async (_, { submissionId, rewardSlot }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const { ClanWarsSubmission, ClanWarsItem } = getModels();
    const submission = await ClanWarsSubmission.findByPk(submissionId);
    if (!submission) throw new UserInputError('Submission not found');
    if (submission.status !== 'APPROVED') throw new UserInputError('Can only change reward slot on approved submissions');
    if (submission.role !== 'PVMER') throw new UserInputError('Reward slot only applies to PVMER submissions');
    const event = await getEventOrThrow(submission.eventId);
    if (!isAdminOrRef(event, user.id)) throw new AuthenticationError('Not an event admin');
    await submission.update({ rewardSlot });
    // If the item has already been rolled, re-roll it for the new slot so the
    // item name/stats match the slot (not just rename a weapon to a legs item).
    if (submission.rewardItemId) {
      const existingItem = await ClanWarsItem.findByPk(submission.rewardItemId);
      if (existingItem) {
        const warChest = await getWarChest(existingItem.teamId);
        const warChestData = warChest
          .filter((i) => i.itemId !== existingItem.itemId)
          .map((i) => ({ name: i.name, slot: i.slot, rarity: i.rarity }));
        const dropResult = rollPvmerDrop({
          slot: rewardSlot,
          difficulty: submission.difficulty,
          warChest: warChestData,
        });
        if (dropResult.success) {
          await existingItem.update({
            name: dropResult.item.name,
            slot: dropResult.slot ?? rewardSlot,
            rarity: dropResult.rarity,
            itemSnapshot: dropResult.item,
          });
        } else {
          // Roll failed (e.g. all slots full) — just update the slot label as fallback
          await existingItem.update({ slot: rewardSlot });
        }
      }
    }
    return submission;
  },

  undoSubmissionApproval: async (_, { submissionId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const { ClanWarsSubmission, ClanWarsItem } = getModels();
    const submission = await ClanWarsSubmission.findByPk(submissionId);
    if (!submission) throw new UserInputError('Submission not found');
    if (submission.status !== 'APPROVED') throw new UserInputError('Submission is not approved');
    const event = await getEventOrThrow(submission.eventId);
    if (!isAdminOrRef(event, user.id)) throw new AuthenticationError('Not an event admin');

    // If an item was already created for this submission, delete it
    if (submission.rewardItemId) {
      await ClanWarsItem.destroy({ where: { itemId: submission.rewardItemId } });
    }

    await submission.update({
      status: 'PENDING',
      reviewedBy: null,
      reviewedAt: null,
      reviewNote: null,
      rewardSlot: null,
      rewardItemId: null,
    });

    await pubsub.publish(`CLAN_WARS_SUBMISSION_REVIEWED_${submission.eventId}`, {
      clanWarsSubmissionReviewed: submission,
    });

    return submission;
  },

  createClanWarsPreScreenshot: async (_, args) => {
    const { ClanWarsPreScreenshot } = getModels();
    const event = await getEventOrThrow(args.eventId);
    if (event.status !== 'GATHERING') {
      throw new UserInputError('Event is not in GATHERING phase');
    }

    const preScreenshot = await ClanWarsPreScreenshot.create({
      preScreenshotId: generateId('cwps'),
      eventId: args.eventId,
      teamId: args.teamId ?? null,
      taskId: args.taskId,
      taskLabel: args.taskLabel ?? null,
      submittedBy: args.submittedBy,
      submittedUsername: args.submittedUsername ?? null,
      screenshotUrl: args.screenshotUrl ?? null,
      channelId: args.channelId ?? null,
      messageId: args.messageId ?? null,
      submittedAt: new Date(),
    });

    await pubsub.publish(`CLAN_WARS_PRESCREENSHOT_ADDED_${args.eventId}`, {
      clanWarsPreScreenshotAdded: preScreenshot,
    });

    return preScreenshot;
  },

  sendBattleEmote: async (_, { battleId, emote }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    await pubsub.publish(`BATTLE_EMOTE_${battleId}`, {
      battleEmoteReceived: { battleId, emote },
    });
    return true;
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
    const validStatuses = ['DRAFT', 'GATHERING', 'OUTFITTING', 'BATTLE', 'COMPLETED'];
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
    pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${eventId}`, { clanWarsEventUpdated: event });
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
    const updated = setTeamReadyInBracket(bracket, teamId);
    if (!updated) throw new UserInputError('No upcoming match found for this team');
    await event.update({ bracket: updated });
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
    const updatedBracket = setBattleIdInBracket(bracket, team1Id, team2Id, battle.battleId);
    await event.update({ bracket: updatedBracket });

    // Fire "battles have begun" announcement (best-effort)
    if (event.announcementsChannelId) {
      sendClanWarsPhaseAnnouncement({
        channelId: event.announcementsChannelId,
        eventId: event.eventId,
        eventName: event.eventName,
        phase: 'BATTLE_START',
      });
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
      if (isBlinded(newState.activeEffects[actorSide])) {
        narrative = `😵 ${actorSnap.teamName} is blinded and misses their attack!`;
      } else {
        const actorEffStats = getEffectiveStats(actorSnap, newState.activeEffects[actorSide]);
        const defEffStats   = getEffectiveStats(defSnap,   newState.activeEffects[defSide]);
        const roll = rollDamage({
          attackStat:  actorEffStats.attack,
          defenseStat: defEffStats.defense,
          critChance:  actorEffStats.crit,
          isDefending,
        });
        const fortressMult = hasFortress(newState.activeEffects[defSide]) ? 0.4 : 1;
        damageDealt = fortressMult < 1 ? Math.max(1, Math.round(roll.damage * fortressMult)) : roll.damage;
        isCrit = roll.isCrit;
        newState.hp[defSide] = Math.max(0, newState.hp[defSide] - damageDealt);
        newState.defendActive[defSide] = false;
        const fortressNote = fortressMult < 1 ? ' (fortress absorbed 60%!)' : '';
        narrative = `${isCrit ? '💥 CRIT! ' : ''}${actorSnap.teamName} attacks for ${damageDealt} damage!${isCrit ? ' (critical hit!)' : ''}${fortressNote}`;
      }

    } else if (action === 'DEFEND') {
      newState.defendActive[actorSide] = true;
      narrative = `🛡️ ${actorSnap.teamName} takes a defensive stance! (−60% damage until next hit)`;

    } else if (action === 'SPECIAL') {
      if (newState.specialUsed[actorSide]) throw new UserInputError('Special already used this battle');
      const specials = actorSnap.stats.specials ?? [];
      if (!specials.length) throw new UserInputError('No special ability available');

      const actorEffStats = getEffectiveStats(actorSnap, newState.activeEffects[actorSide]);
      const defEffStats   = getEffectiveStats(defSnap,   newState.activeEffects[defSide]);
      const actorSnapEff  = { ...actorSnap, stats: actorEffStats };
      const defSnapEff    = { ...defSnap,   stats: defEffStats };

      const specialId = specials[0];
      const result = processSpecial(specialId, actorSnapEff, defSnapEff, newState, actorSide, defSide);

      const fortressMult = result.damage > 0 ? (hasFortress(newState.activeEffects[defSide]) ? 0.4 : 1) : 1;
      damageDealt = result.damage > 0 ? Math.max(1, Math.round(result.damage * fortressMult)) : 0;
      isCrit = result.isCrit ?? false;
      newState.hp[defSide] = Math.max(0, newState.hp[defSide] - damageDealt);
      if (result.attackerHeal) newState.hp[actorSide] = Math.min(actorSnap.stats.maxHp, newState.hp[actorSide] + result.attackerHeal);
      newState.activeEffects[defSide] = [...(newState.activeEffects[defSide] ?? []), ...(result.defenderEffects ?? [])];
      newState.activeEffects[actorSide] = [...(newState.activeEffects[actorSide] ?? []), ...(result.attackerEffects ?? [])];
      newState.specialUsed[actorSide] = true;
      newState.defendActive[defSide] = false;
      effectApplied = specialId;
      const fortressNote = fortressMult < 1 ? ` (fortress absorbed 60% — actual damage: ${damageDealt})` : '';
      narrative = result.narrative + fortressNote;

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

    // Advance bracket after battle completes (writes winnerId + fills next round slots)
    if (battleOver) {
      const eventRecord = await getEventOrThrow(battle.eventId);
      const b = eventRecord.bracket;
      if (b) {
        const advancedBracket = advanceBracketAfterBattle(
          b, battleId, winnerId, battle.team1Id, battle.team2Id
        );
        await eventRecord.update({ bracket: advancedBracket });

        // Auto-complete the event when all bracket matches are done
        if (allMatchesDone(advancedBracket) && eventRecord.status === 'BATTLE') {
          await eventRecord.update({ status: 'COMPLETED' });
          await pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${battle.eventId}`, {
            clanWarsEventUpdated: eventRecord,
          });
          logger.info(`[ClanWars] Event ${battle.eventId} auto-completed — all bracket matches done`);
        }
      }

      // Notify announcements channel of battle completion
      if (eventRecord.announcementsChannelId) {
        const loserTeamId = battle.team1Id === winnerId ? battle.team2Id : battle.team1Id;
        const [winnerTeam, loserTeam] = await Promise.all([
          ClanWarsTeam.findByPk(winnerId),
          ClanWarsTeam.findByPk(loserTeamId),
        ]);
        sendBattleCompleteAnnouncement({
          channelId: eventRecord.announcementsChannelId,
          eventId: eventRecord.eventId,
          eventName: eventRecord.eventName,
          winnerTeamName: winnerTeam?.teamName ?? 'Unknown',
          loserTeamName: loserTeam?.teamName ?? 'Unknown',
        });
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

  devSeedCfEvent: async (_, __, { user }) => {
    if (!user) throw new AuthenticationError('Must be logged in');
    if (process.env.NODE_ENV === 'production') throw new ApolloError('Not available in production');
    const { seedAllCfEvents } = require('../../utils/cwDevSeed');
    await seedAllCfEvents(user.id, { discordId: user.discordUserId, discordUsername: user.discordUsername });
    return true;
  },

  devAutoBattle: async (_, { battleId }, { user }) => {
    if (!user?.admin) throw new AuthenticationError('Admin only');

    const { ClanWarsBattle, ClanWarsBattleEvent: ClanWarsBattleLog } = getModels();
    const battle = await ClanWarsBattle.findByPk(battleId);
    if (!battle) throw new UserInputError('Battle not found');
    if (battle.status !== 'IN_PROGRESS') throw new UserInputError('Battle is not in progress');

    let state = { ...battle.battleState };
    const snap = battle.championSnapshots;

    const MAX_TURNS = 200; // safety cap
    let turn = 0;

    while (state.hp.team1 > 0 && state.hp.team2 > 0 && turn < MAX_TURNS) {
      turn++;
      const actorSide = state.currentTurn;
      const defSide = actorSide === 'team1' ? 'team2' : 'team1';
      const actorTeamId = actorSide === 'team1' ? battle.team1Id : battle.team2Id;
      const actorSnap = snap[actorSide === 'team1' ? 'champion1' : 'champion2'];
      const defSnap = snap[actorSide === 'team1' ? 'champion2' : 'champion1'];

      // Decay fortress
      state.activeEffects[actorSide] = (state.activeEffects[actorSide] ?? [])
        .map((e) => (e.type === 'fortress' ? { ...e, turns: e.turns - 1 } : e))
        .filter((e) => e.turns > 0);

      const isDefending = state.defendActive[defSide] ?? false;
      const roll = rollDamage({
        attackStat: actorSnap.stats.attack,
        defenseStat: defSnap.stats.defense,
        critChance: actorSnap.stats.crit,
        isDefending,
      });

      state.hp[defSide] = Math.max(0, state.hp[defSide] - roll.damage);
      state.defendActive[defSide] = false;
      const narrative = `${roll.isCrit ? '💥 CRIT! ' : ''}${actorSnap.teamName} attacks for ${roll.damage} damage!${roll.isCrit ? ' (critical hit!)' : ''}`;

      const bleedResult = tickEffects(state, actorSide);
      if (bleedResult.bleedDamage > 0) {
        state.hp[actorSide] = Math.max(0, state.hp[actorSide] - bleedResult.bleedDamage);
        state.activeEffects[actorSide] = bleedResult.effects;
      }

      const hpAfter = { team1: state.hp.team1, team2: state.hp.team2 };
      state = advanceTurn(state);

      await ClanWarsBattleLog.create({
        eventLogId: generateId('cwbe'),
        battleId,
        turnNumber: state.turnNumber - 1,
        actorTeamId,
        action: 'ATTACK',
        rollInputs: { attackStat: actorSnap.stats.attack, defenseStat: defSnap.stats.defense, critChance: actorSnap.stats.crit, isDefending },
        damageDealt: roll.damage,
        isCrit: roll.isCrit,
        itemUsedId: null,
        effectApplied: null,
        hpAfter,
        narrative,
      });
    }

    // Determine winner
    const winnerId = state.hp.team1 <= 0 ? battle.team2Id : battle.team1Id;
    const winnerName = winnerId === battle.team1Id ? snap.champion1.teamName : snap.champion2.teamName;
    const loserName = winnerId === battle.team1Id ? snap.champion2.teamName : snap.champion1.teamName;

    await ClanWarsBattleLog.create({
      eventLogId: generateId('cwbe'),
      battleId,
      turnNumber: state.turnNumber,
      actorTeamId: null,
      action: 'BATTLE_END',
      rollInputs: null,
      damageDealt: null,
      isCrit: null,
      narrative: `💀 ${loserName} has fallen! ${winnerName} wins!`,
      hpAfter: { team1: state.hp.team1, team2: state.hp.team2 },
    });

    await battle.update({ battleState: state, status: 'COMPLETED', winnerId, endedAt: new Date() });

    // Advance bracket after battle completes
    const eventRecord = await getEventOrThrow(battle.eventId);
    const b = eventRecord.bracket;
    if (b) {
      const advancedBracket = advanceBracketAfterBattle(
        b, battleId, winnerId, battle.team1Id, battle.team2Id
      );
      await eventRecord.update({ bracket: advancedBracket });

      if (allMatchesDone(advancedBracket) && eventRecord.status === 'BATTLE') {
        await eventRecord.update({ status: 'COMPLETED' });
        await pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${battle.eventId}`, {
          clanWarsEventUpdated: eventRecord,
        });
      }
    }

    await battle.reload();
    return battle;
  },

  devSimulateNextMatch: async (_, { eventId }, { user }) => {
    if (!user?.admin) throw new AuthenticationError('Admin only');

    const { ClanWarsTeam, ClanWarsItem, ClanWarsBattle, ClanWarsBattleEvent: ClanWarsBattleLog } = getModels();
    const event = await getEventOrThrow(eventId);

    // Find the next bracket match without a battleId (searches WB, LB, and grand final)
    const bracket = event.bracket;
    if (!bracket?.rounds?.length) throw new UserInputError('No bracket found — generate it first');

    const nextMatch = findNextUnstartedMatch(bracket);
    if (!nextMatch) throw new UserInputError('No unstarted matches found');

    const { team1Id, team2Id } = nextMatch;

    const [team1, team2] = await Promise.all([
      ClanWarsTeam.findByPk(team1Id),
      ClanWarsTeam.findByPk(team2Id),
    ]);
    if (!team1?.loadoutLocked || !team2?.loadoutLocked) {
      throw new UserInputError('Both teams must have locked loadouts before battle can be simulated');
    }

    const [items1, items2] = await Promise.all([
      ClanWarsItem.findAll({ where: { teamId: team1Id } }),
      ClanWarsItem.findAll({ where: { teamId: team2Id } }),
    ]);

    const stats1 = buildChampionStats(team1.officialLoadout, items1.map((i) => i.toJSON()));
    const stats2 = buildChampionStats(team2.officialLoadout, items2.map((i) => i.toJSON()));

    const champion1 = { teamId: team1Id, teamName: team1.teamName, stats: stats1, loadout: team1.officialLoadout };
    const champion2 = { teamId: team2Id, teamName: team2.teamName, stats: stats2, loadout: team2.officialLoadout };

    const firstTurn = stats1.speed >= stats2.speed ? 'team1' : 'team2';
    const initialState = { ...initBattleState(champion1, champion2), currentTurn: firstTurn };

    const battle = await ClanWarsBattle.create({
      battleId: generateId('cwb'),
      eventId,
      team1Id,
      team2Id,
      status: 'IN_PROGRESS',
      championSnapshots: { champion1, champion2 },
      battleState: initialState,
      rngSeed: Math.random().toString(36).slice(2),
      startedAt: new Date(),
    });

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

    // Write battleId to bracket (searches all sections for DE brackets)
    await event.update({ bracket: setBattleIdInBracket(bracket, team1Id, team2Id, battle.battleId) });

    // Battle is now IN_PROGRESS — client handles turn-by-turn play
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
