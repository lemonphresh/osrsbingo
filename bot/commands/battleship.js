'use strict';

const { EmbedBuilder } = require('discord.js');

const getModels = () => require('../../server/db/models');

function generateId(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${rand}`;
}

const COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const coord = (row, col) => `${COL_LABELS[col] ?? col}${row + 1}`;

// Given the channel the message came from, find the BSTeam whose Discord channel
// matches and its ACTIVE event. Returns { event, team, opposingTeam } or null.
async function resolveContext(message) {
  const { BSTeam, BSEvent } = getModels();
  const teams = await BSTeam.findAll({ where: { discordChannelId: message.channelId } });
  if (teams.length === 0) return null;

  for (const team of teams) {
    const event = await BSEvent.findByPk(team.eventId);
    if (!event || event.status !== 'ACTIVE') continue;
    if (!(team.members ?? []).includes(message.author.id)) continue;
    const allEventTeams = await BSTeam.findAll({ where: { eventId: event.eventId } });
    const opposingTeam = allEventTeams.find((t) => t.teamId !== team.teamId) ?? null;
    return { event, team, opposingTeam };
  }
  return null;
}

// Find the tile the user's team should be submitting for: the most recent shot
// tile on the opponent's board that isn't already resolved.
async function findPendingTile(opposingTeam, firingTeamId, eventId) {
  const { BSBoard, BSTile, BSShotLog } = getModels();
  if (!opposingTeam) return null;
  const opponentBoard = await BSBoard.findOne({
    where: { eventId, teamId: opposingTeam.teamId },
  });
  if (!opponentBoard) return null;

  // Prefer using shot log to pick the most recent unresolved shot by this team.
  const shots = await BSShotLog.findAll({
    where: { eventId, firingTeamId, targetBoardId: opponentBoard.boardId },
    order: [['shotAt', 'DESC']],
  });

  for (const shot of shots) {
    const tile = await BSTile.findByPk(shot.tileId);
    if (!tile) continue;
    if (!tile.taskCompleted && !tile.skipped) return tile;
  }
  return null;
}

async function createSubmission({
  message,
  event,
  team,
  tile,
  screenshotUrl,
  submissionType,
}) {
  const { BSSubmission, BSTask } = getModels();
  let tileLabel = null;
  const taskId = tile.shipTaskId ?? tile.taskId;
  if (taskId) {
    const task = await BSTask.findByPk(taskId);
    tileLabel = task?.label ?? null;
  }

  const submission = await BSSubmission.create({
    submissionId:     generateId('bssub'),
    eventId:          event.eventId,
    tileId:           tile.tileId,
    boardId:          tile.boardId,
    teamId:           team.teamId,
    tileLabel,
    discordUserId:    message.author.id,
    discordUsername:  message.author.username,
    screenshotUrl,
    channelId:        message.channelId,
    discordMessageId: message.id,
    submissionType,
    submittedAt:      new Date(),
  });

  // Publish so the refs page sees it live.
  try {
    const { pubsub } = require('../../server/schema/pubsub');
    pubsub.publish(`BS_SUBMISSION_ADDED_${event.eventId}`, { bsSubmissionAdded: submission });
  } catch (err) {
    console.warn('[bs bot] pubsub publish failed:', err.message);
  }

  return { submission, tileLabel };
}

module.exports = {
  name: 'bssubmit',
  aliases: ['bss'],
  description: 'Submit a Battleship task completion (attach screenshot)',

  async execute(message) {
    const screenshot = message.attachments.first()?.url ?? null;
    if (!screenshot) {
      return message.reply(
        '❌ Please attach a screenshot to your message. Usage: `!bssubmit` with a screenshot attached.',
      );
    }

    const ctx = await resolveContext(message);
    if (!ctx) {
      return message.reply(
        '❌ Could not find an active Battleship event for you here. Make sure this channel is set as your team\'s Discord channel and that you\'re on the roster.',
      );
    }
    const { event, team, opposingTeam } = ctx;

    const tile = await findPendingTile(opposingTeam, team.teamId, event.eventId);
    if (!tile) {
      return message.reply(
        '❌ No pending task found — fire a shot first, or your last task is already resolved.',
      );
    }

    try {
      const { tileLabel } = await createSubmission({
        message,
        event,
        team,
        tile,
        screenshotUrl: screenshot,
        submissionType: 'SUBMISSION',
      });
      const c = coord(tile.row, tile.col);
      return message.reply(
        `✅ **${tileLabel ?? 'Task'}** (${c}) submitted for **${team.teamName}** — pending ref review.`,
      );
    } catch (err) {
      console.error('[bssubmit] error creating submission:', err);
      return message.reply('❌ Failed to record your submission. Please try again.');
    }
  },
};

// Pre-screenshot command — for tasks with a metric target, records the baseline.
module.exports.bspre = {
  name: 'bspre',
  aliases: ['bsp'],
  description: 'Submit a Battleship pre-screenshot baseline (attach screenshot)',

  async execute(message) {
    const screenshot = message.attachments.first()?.url ?? null;
    if (!screenshot) {
      return message.reply(
        '❌ Please attach a screenshot to your message. Usage: `!bspre` with a screenshot attached.',
      );
    }

    const ctx = await resolveContext(message);
    if (!ctx) {
      return message.reply(
        '❌ Could not find an active Battleship event for you here. Make sure this channel is set as your team\'s Discord channel and that you\'re on the roster.',
      );
    }
    const { event, team, opposingTeam } = ctx;

    const tile = await findPendingTile(opposingTeam, team.teamId, event.eventId);
    if (!tile) {
      return message.reply(
        '❌ No pending task found — fire a shot first before submitting a pre-screenshot.',
      );
    }

    try {
      const { tileLabel } = await createSubmission({
        message,
        event,
        team,
        tile,
        screenshotUrl: screenshot,
        submissionType: 'PRESCREENSHOT',
      });
      const c = coord(tile.row, tile.col);
      return message.reply(
        `📸 Pre-screenshot logged for **${tileLabel ?? 'task'}** (${c}) — pending ref review.`,
      );
    } catch (err) {
      console.error('[bspre] error creating pre-screenshot submission:', err);
      return message.reply('❌ Failed to record your pre-screenshot. Please try again.');
    }
  },
};

// Help command
module.exports.help = {
  name: 'battleship',
  aliases: ['bs'],
  description: 'Battleship help and commands',

  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle('⚓ Battleship Commands')
      .setColor(0x1a4028)
      .setDescription('Submit task proofs after your team fires a shot.')
      .addFields(
        {
          name: '📸 Pre-screenshot (baseline)',
          value:
            '`!bspre` — Log your starting metric (KC / XP / drops) before beginning a task. Required for tasks with a numeric target.',
          inline: false,
        },
        {
          name: '📬 Submit Task Completion',
          value:
            '`!bssubmit` — Submit proof that your team\'s pending task is done. Attach a screenshot. Alias: `!bss`.',
          inline: false,
        },
        {
          name: 'ℹ️ Info',
          value:
            'Everything else (ship placement, voting, viewing boards) happens on the website at **osrsbingohub.com/battleship**.',
          inline: false,
        },
      )
      .setFooter({
        text: 'Post commands in your team\'s Discord channel with a screenshot attached.',
      });

    return message.reply({ embeds: [embed] });
  },
};
