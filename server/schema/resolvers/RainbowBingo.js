'use strict';

const { UserInputError, AuthenticationError } = require('apollo-server-express');
const { pubsub } = require('../pubsub');
const {
  TILES,
  TILE_MAP,
  getStartTiles,
  getNewlyUnlockedTiles,
  getCascadeLockTiles,
} = require('../../utils/rainbowTiles');
const { TILE_FUN_FACTS } = require('../../utils/rainbowFunFacts');

const getModels = () => require('../../db/models');

function generateId(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${rand}`;
}

function generateToken() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let t = '';
  for (let i = 0; i < 10; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

const COLOR_HEX = {
  red: 0xe74c3c,
  orange: 0xe67e22,
  yellow: 0xf1c40f,
  green: 0x2ecc71,
  blue: 0x3498db,
  indigo: 0x6c5ce7,
  violet: 0xd63af9,
  capstone: 0x2c3e50,
};

async function postDiscordMessage(channelId, content) {
  if (!process.env.DISCORD_BOT_TOKEN || !channelId) return;
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error(`[rainbowbingo] Discord API error ${res.status}:`, body.message);
    }
  } catch (err) {
    console.error('[rainbowbingo] Discord notification failed:', err.message);
  }
}

async function postDiscordEmbed(channelId, embed) {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.warn('[rainbowbingo] DISCORD_BOT_TOKEN is not set — skipping embed');
    return;
  }
  if (!channelId) {
    console.warn('[rainbowbingo] postDiscordEmbed called with no channelId — skipping');
    return;
  }
  console.log(`[rainbowbingo] posting embed to channel ${channelId}:`, JSON.stringify(embed));
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ embeds: [embed] }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error(`[rainbowbingo] Discord API error ${res.status}:`, JSON.stringify(body));
    } else {
      console.log(`[rainbowbingo] Discord embed sent OK (${res.status})`);
    }
  } catch (err) {
    console.error('[rainbowbingo] Discord notification failed:', err.message);
  }
}

async function sendRainbowDiscordNotification({
  type,
  team,
  tileCode,
  tileDef,
  newlyUnlocked = [],
  reason,
}) {
  if (!team.discordChannelId) {
    console.warn(
      `[rainbowbingo] team ${team.teamId} (${team.teamName}) has no discordChannelId — skipping ${type} notification`
    );
    return;
  }
  console.log(
    `[rainbowbingo] sendRainbowDiscordNotification type=${type} team=${team.teamName} tileCode=${
      tileCode ?? '—'
    }`
  );

  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://osrsbingo.com';
  const teamBoardUrl = team.teamToken
    ? `${FRONTEND_URL}/eg-rainbow/team/${team.teamToken}`
    : null;

  if (type === 'TILE_COMPLETE') {
    const isCapstone = tileDef?.color === 'capstone';
    const funFact = TILE_FUN_FACTS[tileCode];

    if (isCapstone) {
      const parts = [`**${tileDef?.bossOrSkill}** — ${tileDef?.metricLabel}`];
      if (funFact) {
        parts.push(`🏳️‍🌈 **The color behind the tiles**\n${funFact.fact}\n\n*Source: [${funFact.source}](${funFact.sourceUrl})*`);
      }
      parts.push(`🩷 **Keep going**\nKeep pushing on those other color branches! Complete the rainbow!`);
      if (teamBoardUrl) parts.push(`[📋 View your team board](${teamBoardUrl})`);
      await postDiscordEmbed(team.discordChannelId, {
        color: 0xffd700,
        title: `✨ Capstone ${tileCode} complete!`,
        description: parts.join('\n\n'),
        timestamp: new Date().toISOString(),
      });
    } else {
      const unlockedLines = newlyUnlocked.length
        ? newlyUnlocked
            .map(
              ({ code, tileDef: td }) =>
                `**${code}** — ${td?.bossOrSkill ?? code} (${td?.metricLabel ?? ''})`
            )
            .join('\n')
        : 'No new tiles unlocked yet.';

      const parts = [
        `**${tileDef?.bossOrSkill}** — ${tileDef?.metricLabel}`,
        `🔓 **Newly unlocked**\n${unlockedLines}`,
      ];
      if (funFact) {
        parts.push(`🌈 **Did you know?**\n${funFact.fact}\n\n*Source: [${funFact.source}](${funFact.sourceUrl})*`);
      }
      if (teamBoardUrl) parts.push(`[📋 View your team board](${teamBoardUrl})`);

      await postDiscordEmbed(team.discordChannelId, {
        color: COLOR_HEX[tileDef?.color] ?? 0x95a5a6,
        title: `🎉 ${tileCode} complete!`,
        description: parts.join('\n\n'),
        timestamp: new Date().toISOString(),
      });
    }
  } else if (type === 'BOARD_COMPLETE') {
    await postDiscordEmbed(team.discordChannelId, {
      color: 0xffd700,
      title: '🌈 The board is complete!',
      description: `${team.teamName} has completed every tile on the Rainbow Bingo board. All seven colors, all seven capstones.\n\nThank you for playing, and for everything the rainbow stands for. We love you so much.`,
      timestamp: new Date().toISOString(),
    });
  } else if (type === 'DENIED') {
    await postDiscordEmbed(team.discordChannelId, {
      color: 0xe74c3c,
      title: `❌ ${tileCode} submission denied`,
      description: reason
        ? `**Reason:** ${reason}`
        : 'No reason provided. Please check with an admin.',
      timestamp: new Date().toISOString(),
    });
  }
}

function isAdmin(event, user) {
  if (!user) return false;
  if (user.admin) return true;
  return event.adminIds?.includes(String(user.id)) ?? false;
}

async function getEventOrThrow(eventId) {
  const { RainbowEvent } = getModels();
  const event = await RainbowEvent.findByPk(eventId);
  if (!event) throw new UserInputError(`RainbowEvent ${eventId} not found`);
  return event;
}

async function getTeamOrThrow(teamId) {
  const { RainbowTeam } = getModels();
  const team = await RainbowTeam.findByPk(teamId);
  if (!team) throw new UserInputError(`RainbowTeam ${teamId} not found`);
  return team;
}

function attachTileDef(teamTile) {
  return { ...teamTile.toJSON(), tileDef: TILE_MAP[teamTile.tileCode] ?? null };
}

async function getFullBoard(teamId) {
  const { RainbowTeamTile } = getModels();
  const tiles = await RainbowTeamTile.findAll({ where: { teamId } });
  return tiles.map(attachTileDef);
}

// ── Queries ────────────────────────────────────────────────────────────────

const Query = {
  getActiveRainbowEvent: async () => {
    const { RainbowEvent } = getModels();
    const { Op } = require('sequelize');
    return RainbowEvent.findOne({
      where: { status: { [Op.in]: ['SETUP', 'ACTIVE', 'COMPLETE'] } },
      order: [['createdAt', 'DESC']],
    });
  },

  getRainbowEvent: async (_, { eventId }) => {
    return getEventOrThrow(eventId);
  },

  getRainbowTeams: async (_, { eventId }) => {
    const { RainbowTeam } = getModels();
    return RainbowTeam.findAll({ where: { eventId } });
  },

  getRainbowTeamBoard: async (_, { teamId }) => {
    return getFullBoard(teamId);
  },

  getRainbowSubmissions: async (_, { eventId, status, teamId, tileCode }) => {
    const { RainbowSubmission } = getModels();
    const where = { eventId };
    if (status) where.status = status;
    if (teamId) where.teamId = teamId;
    if (tileCode) where.tileCode = tileCode;
    return RainbowSubmission.findAll({ where, order: [['submittedAt', 'ASC']] });
  },

  getRainbowTileDefs: () => TILES,

  getRainbowTeamByToken: async (_, { token }) => {
    const { RainbowTeam } = getModels();
    return RainbowTeam.findOne({ where: { teamToken: token } });
  },
};

// ── Mutations ──────────────────────────────────────────────────────────────

const Mutation = {
  createRainbowEvent: async (_, { input }, { user }) => {
    if (!user) throw new AuthenticationError('Must be logged in');
    const { RainbowEvent } = getModels();
    const { DEFAULT_TILE_GRAPH } = require('../../utils/rainbowTiles');
    return RainbowEvent.create({
      eventId: generateId('rb'),
      eventName: input.eventName,
      status: 'SETUP',
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      adminIds: [String(user.id)],
      staffChannelId: input.staffChannelId ?? null,
      tileGraph: DEFAULT_TILE_GRAPH,
    });
  },

  createRainbowTeam: async (_, { eventId, input }, { user }) => {
    const { RainbowTeam, RainbowTeamTile } = getModels();
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user)) throw new AuthenticationError('Admin only');

    const team = await RainbowTeam.create({
      teamId: generateId('rbt'),
      eventId,
      teamName: input.teamName,
      discordChannelId: input.discordChannelId,
      captainDiscordId: input.captainDiscordId ?? null,
      notes: input.notes ?? null,
      teamToken: generateToken(),
    });

    const startTiles = getStartTiles(event.tileGraph);
    const startSet = new Set(startTiles);
    const now = new Date();

    await RainbowTeamTile.bulkCreate(
      TILES.map((t) => ({
        teamTileId: generateId('rbtt'),
        teamId: team.teamId,
        eventId,
        tileCode: t.tileCode,
        status: startSet.has(t.tileCode) ? 'UNLOCKED' : 'LOCKED',
        unlockedAt: startSet.has(t.tileCode) ? now : null,
      }))
    );

    return team;
  },

  updateRainbowEventStatus: async (_, { eventId, status }, { user }) => {
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user)) throw new AuthenticationError('Admin only');
    await event.update({ status });

    if (status === 'ACTIVE') {
      const { RainbowTeam } = getModels();
      const teams = await RainbowTeam.findAll({ where: { eventId } });
      const siteUrl = process.env.SITE_URL ?? 'https://www.osrsbingohub.com';
      for (const team of teams) {
        if (team.discordChannelId && team.teamToken) {
          await postDiscordEmbed(team.discordChannelId, {
            color: 0x9b59b6,
            title: `🌈 ${event.eventName} has started!`,
            description: `Your team board is live. Bookmark your unique link below, it's your team's home base for tracking progress and submitting tiles.`,
            fields: [
              { name: '🔗 Your Board', value: `${siteUrl}/eg-rainbow/team/${team.teamToken}` },
            ],
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return event;
  },

  addRainbowAdmin: async (_, { eventId, userId }, { user }) => {
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user)) throw new AuthenticationError('Admin only');
    if (!event.adminIds.includes(String(userId))) {
      await event.update({ adminIds: [...event.adminIds, String(userId)] });
    }
    return event;
  },

  removeRainbowAdmin: async (_, { eventId, userId }, { user }) => {
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user)) throw new AuthenticationError('Admin only');
    await event.update({ adminIds: event.adminIds.filter((id) => id !== String(userId)) });
    return event;
  },

  testRainbowChannel: async (_, { teamId }, { user }) => {
    if (!user) throw new AuthenticationError('Must be logged in');
    const { RainbowTeam } = getModels();
    const team = await RainbowTeam.findByPk(teamId);
    if (!team) throw new UserInputError(`Team ${teamId} not found`);
    const event = await getEventOrThrow(team.eventId);
    if (!isAdmin(event, user)) throw new AuthenticationError('Admin only');

    if (!team.discordChannelId) throw new UserInputError('Team has no Discord channel ID set');
    if (!process.env.DISCORD_BOT_TOKEN)
      throw new UserInputError('DISCORD_BOT_TOKEN not configured');

    const res = await fetch(
      `https://discord.com/api/v10/channels/${team.discordChannelId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [
            {
              color: 0x2ecc71,
              title: '🌈 Rainbow Bingo — Channel Test',
              description: `This channel is registered for **${team.teamName}**. The bot can see you. You're all set!`,
              footer: { text: `teamId: ${team.teamId}` },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new UserInputError(`Discord error ${res.status}: ${body.message ?? 'unknown error'}`);
    }
    return true;
  },

  testRainbowNotification: async (_, { teamId, type }, { user }) => {
    if (!user) throw new AuthenticationError('Must be logged in');
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    if (!isAdmin(event, user)) throw new AuthenticationError('Admin only');

    if (type === 'TILE') {
      await sendRainbowDiscordNotification({
        type: 'TILE_COMPLETE',
        team,
        tileCode: 'R1',
        tileDef: TILE_MAP['R1'],
        newlyUnlocked: [{ code: 'R2', tileDef: TILE_MAP['R2'] }],
      });
    } else if (type === 'CAPSTONE') {
      await sendRainbowDiscordNotification({
        type: 'TILE_COMPLETE',
        team,
        tileCode: 'C1',
        tileDef: TILE_MAP['C1'],
        newlyUnlocked: [],
      });
    } else if (type === 'BOARD') {
      await sendRainbowDiscordNotification({ type: 'BOARD_COMPLETE', team });
    } else {
      throw new UserInputError(`Unknown notification type: ${type}`);
    }
    return true;
  },

  // Called by the Discord bot — no user auth, validated by channel ID on the bot side
  createRainbowSubmission: async (_, { input }) => {
    const { RainbowTeam, RainbowTeamTile, RainbowSubmission, RainbowEvent } = getModels();

    const team = await RainbowTeam.findOne({ where: { discordChannelId: input.channelId } });
    if (!team) throw new UserInputError('No team found for this channel');

    const event = await RainbowEvent.findOne({
      where: { eventId: team.eventId, status: 'ACTIVE' },
    });
    if (!event) throw new UserInputError('No active event for this team');

    const teamTile = await RainbowTeamTile.findOne({
      where: { teamId: team.teamId, tileCode: input.tileCode },
    });
    if (!teamTile) throw new UserInputError(`Tile ${input.tileCode} not found for this team`);

    if (teamTile.status === 'LOCKED') throw new UserInputError(`Tile ${input.tileCode} is locked`);
    if (teamTile.status === 'COMPLETE')
      throw new UserInputError(`Tile ${input.tileCode} is already complete`);

    const submission = await RainbowSubmission.create({
      submissionId: generateId('rbs'),
      teamId: team.teamId,
      eventId: event.eventId,
      tileCode: input.tileCode,
      type: input.type,
      screenshotUrl: input.screenshotUrl ?? null,
      discordMessageId: input.discordMessageId ?? null,
      channelId: input.channelId,
      status: 'PENDING',
      submittedAt: input.submittedAt ?? new Date(),
      discordUsername: input.discordUsername ?? null,
      discordUserId: input.discordUserId ?? null,
    });

    // Move tile to SUBMITTED on the first FINAL submission so admins can see it's in-progress.
    // Pre-screenshots are informational only — they don't affect tile state.
    if (input.type === 'FINAL' && teamTile.status === 'UNLOCKED') {
      await teamTile.update({ status: 'SUBMITTED' });
    }

    console.log(`[rainbow] publishing RAINBOW_SUBMISSION_ADDED_${event.eventId}`);
    await pubsub.publish(`RAINBOW_SUBMISSION_ADDED_${event.eventId}`, {
      rainbowSubmissionAdded: submission,
    });

    return submission;
  },

  // Approve or deny a single submission — does NOT advance the tile.
  // Tile advancement is a separate manual action via completeRainbowTile.
  reviewRainbowSubmission: async (_, { submissionId, approved, denialReason }, { user }) => {
    if (!user) throw new AuthenticationError('Must be logged in');
    const { RainbowSubmission } = getModels();

    const submission = await RainbowSubmission.findByPk(submissionId);
    if (!submission) throw new UserInputError('Submission not found');

    const event = await getEventOrThrow(submission.eventId);
    if (!isAdmin(event, user)) throw new AuthenticationError('Admin only');

    await submission.update({
      status: approved ? 'APPROVED' : 'DENIED',
      reviewedBy: String(user.id),
      reviewedAt: new Date(),
      denialReason: approved ? null : denialReason ?? null,
    });

    await pubsub.publish(`RAINBOW_SUBMISSION_REVIEWED_${submission.eventId}`, {
      rainbowSubmissionReviewed: submission,
    });

    if (submission.discordUserId && submission.channelId) {
      const typeLabel = submission.type === 'PRE' ? 'pre-screenshot' : 'screenshot';
      let msg = `<@${submission.discordUserId}>, your ${typeLabel} for **${
        submission.tileCode
      }** was ${approved ? 'approved ✅' : 'denied ❌'}`;
      if (!approved && denialReason) msg += ` — ${denialReason}`;
      await postDiscordMessage(submission.channelId, msg);
    }

    return submission;
  },

  deleteRainbowTeam: async (_, { teamId }, { user }) => {
    if (!user) throw new AuthenticationError('Must be logged in');
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    if (!isAdmin(event, user)) throw new AuthenticationError('Admin only');

    const { RainbowSubmission, RainbowTeamTile, RainbowTeam } = getModels();
    await RainbowSubmission.destroy({ where: { teamId } });
    await RainbowTeamTile.destroy({ where: { teamId } });
    await RainbowTeam.destroy({ where: { teamId } });
    return true;
  },

  generateRainbowTeamToken: async (_, { teamId }, { user }) => {
    if (!user) throw new AuthenticationError('Must be logged in');
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    if (!isAdmin(event, user)) throw new AuthenticationError('Admin only');
    await team.update({ teamToken: generateToken() });
    return team;
  },

  deleteRainbowEvent: async (_, { eventId }, { user }) => {
    if (!user) throw new AuthenticationError('Must be logged in');
    const event = await getEventOrThrow(eventId);
    if (!isAdmin(event, user)) throw new AuthenticationError('Admin only');
    if (event.status !== 'COMPLETE')
      throw new UserInputError('Event must be COMPLETE before it can be deleted');

    const { RainbowSubmission, RainbowTeamTile, RainbowTeam, RainbowEvent } = getModels();
    await RainbowSubmission.destroy({ where: { eventId } });
    await RainbowTeamTile.destroy({ where: { eventId } });
    await RainbowTeam.destroy({ where: { eventId } });
    await RainbowEvent.destroy({ where: { eventId } });
    return true;
  },

  // Admin/ref manually advances a team past a tile — this is what actually unlocks next tiles.
  completeRainbowTile: async (_, { teamId, tileCode }, { user }) => {
    if (!user) throw new AuthenticationError('Must be logged in');
    const { RainbowTeamTile } = getModels();

    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    if (!isAdmin(event, user)) throw new AuthenticationError('Admin only');

    const teamTile = await RainbowTeamTile.findOne({ where: { teamId, tileCode } });
    if (!teamTile) throw new UserInputError(`Tile ${tileCode} not found for this team`);
    if (teamTile.status === 'LOCKED') throw new UserInputError(`Tile ${tileCode} is still locked`);
    if (teamTile.progress < 100)
      throw new UserInputError(`Tile ${tileCode} is not yet at 100% progress`);

    const { Op } = require('sequelize');
    const now = new Date();
    const [affectedCount] = await RainbowTeamTile.update(
      { status: 'COMPLETE', completedAt: now },
      { where: { teamId, tileCode, status: { [Op.ne]: 'COMPLETE' } } }
    );
    if (affectedCount === 0) throw new UserInputError(`Tile ${tileCode} is already complete`);

    const allTiles = await RainbowTeamTile.findAll({ where: { teamId } });
    const completedCodes = allTiles.filter((t) => t.status === 'COMPLETE').map((t) => t.tileCode);
    const toUnlock = getNewlyUnlockedTiles(completedCodes, tileCode, event.tileGraph);

    if (toUnlock.length > 0) {
      await RainbowTeamTile.update(
        { status: 'UNLOCKED', unlockedAt: now },
        { where: { teamId, tileCode: toUnlock } }
      );
    }

    const board = await getFullBoard(teamId);
    await pubsub.publish(`RAINBOW_BOARD_UPDATED_${teamId}`, { rainbowTeamBoardUpdated: board });
    await pubsub.publish(`RAINBOW_EVENT_BOARD_UPDATED_${team.eventId}`, {
      rainbowEventBoardUpdated: teamId,
    });

    await sendRainbowDiscordNotification({
      type: 'TILE_COMPLETE',
      team,
      tileCode,
      tileDef: TILE_MAP[tileCode],
      newlyUnlocked: toUnlock.map((code) => ({ code, tileDef: TILE_MAP[code] })),
    });

    const capstoneCodes = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7'];
    const allComplete = await RainbowTeamTile.findAll({
      where: { teamId, tileCode: capstoneCodes },
    });
    const boardComplete =
      allComplete.length === 7 && allComplete.every((t) => t.status === 'COMPLETE');
    if (boardComplete) {
      await sendRainbowDiscordNotification({ type: 'BOARD_COMPLETE', team });
    }

    return await RainbowTeamTile.findOne({ where: { teamId, tileCode } });
  },

  setRainbowTileProgress: async (_, { teamId, tileCode, progress }, { user }) => {
    if (!user) throw new AuthenticationError('Must be logged in');
    const { RainbowTeamTile } = getModels();
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    if (!isAdmin(event, user)) throw new AuthenticationError('Admin only');
    const clamped = Math.max(0, Math.min(100, progress));
    const teamTile = await RainbowTeamTile.findOne({ where: { teamId, tileCode } });
    if (!teamTile) throw new UserInputError(`Tile ${tileCode} not found`);
    await teamTile.update({ progress: clamped });
    const board = await getFullBoard(teamId);
    await pubsub.publish(`RAINBOW_BOARD_UPDATED_${teamId}`, { rainbowTeamBoardUpdated: board });
    await pubsub.publish(`RAINBOW_EVENT_BOARD_UPDATED_${team.eventId}`, {
      rainbowEventBoardUpdated: teamId,
    });
    return teamTile;
  },

  undoRainbowTileComplete: async (_, { teamId, tileCode }, { user }) => {
    if (!user) throw new AuthenticationError('Must be logged in');
    const { RainbowTeamTile, RainbowSubmission } = getModels();
    const team = await getTeamOrThrow(teamId);
    const event = await getEventOrThrow(team.eventId);
    if (!isAdmin(event, user)) throw new AuthenticationError('Admin only');

    const teamTile = await RainbowTeamTile.findOne({ where: { teamId, tileCode } });
    if (!teamTile) throw new UserInputError(`Tile ${tileCode} not found`);
    if (teamTile.status !== 'COMPLETE')
      throw new UserInputError(`Tile ${tileCode} is not complete`);

    const hasApprovedFinal = await RainbowSubmission.findOne({
      where: { teamId, tileCode, type: 'FINAL', status: 'APPROVED' },
    });
    const revertStatus = hasApprovedFinal ? 'SUBMITTED' : 'UNLOCKED';
    await teamTile.update({ status: revertStatus, completedAt: null });

    const allTiles = await RainbowTeamTile.findAll({ where: { teamId } });
    const toLock = getCascadeLockTiles(tileCode, allTiles, event.tileGraph);
    if (toLock.length > 0) {
      await RainbowTeamTile.update(
        { status: 'LOCKED', unlockedAt: null },
        { where: { teamId, tileCode: toLock } }
      );
    }

    const board = await getFullBoard(teamId);
    await pubsub.publish(`RAINBOW_BOARD_UPDATED_${teamId}`, { rainbowTeamBoardUpdated: board });
    await pubsub.publish(`RAINBOW_EVENT_BOARD_UPDATED_${team.eventId}`, {
      rainbowEventBoardUpdated: teamId,
    });
    return true;
  },
};

// ── Subscriptions ──────────────────────────────────────────────────────────

const createSubscription = (topicFn) => ({
  subscribe: (_, args) => {
    const topic = topicFn(args);
    console.log(`[rainbow] client subscribed to ${topic}`);
    const iterator = pubsub.asyncIterableIterator(topic);
    return {
      [Symbol.asyncIterator]() { return iterator; },
      return() {
        if (iterator.return) iterator.return();
        return Promise.resolve({ done: true });
      },
    };
  },
});

const Subscription = {
  rainbowSubmissionAdded:   createSubscription(({ eventId }) => `RAINBOW_SUBMISSION_ADDED_${eventId}`),
  rainbowSubmissionReviewed: createSubscription(({ eventId }) => `RAINBOW_SUBMISSION_REVIEWED_${eventId}`),
  rainbowTeamBoardUpdated:  createSubscription(({ teamId })  => `RAINBOW_BOARD_UPDATED_${teamId}`),
  rainbowEventBoardUpdated: createSubscription(({ eventId }) => `RAINBOW_EVENT_BOARD_UPDATED_${eventId}`),
};

// ── Field resolvers ────────────────────────────────────────────────────────

const RainbowSubmission = {
  team: async (submission) => {
    const { RainbowTeam } = getModels();
    return RainbowTeam.findByPk(submission.teamId);
  },
};

const RainbowEvent = {
  teams: async (event) => {
    const { RainbowTeam } = getModels();
    return RainbowTeam.findAll({ where: { eventId: event.eventId } });
  },
  admins: async (event) => {
    if (!event.adminIds?.length) return [];
    const { User } = getModels();
    return User.findAll({ where: { id: event.adminIds } });
  },
};

const RainbowTeam = {
  tiles: async (team) => {
    const { RainbowTeamTile } = getModels();
    const tiles = await RainbowTeamTile.findAll({ where: { teamId: team.teamId } });
    return tiles.map(attachTileDef);
  },
};

module.exports = { Query, Mutation, Subscription, RainbowSubmission, RainbowEvent, RainbowTeam, getFullBoard };
