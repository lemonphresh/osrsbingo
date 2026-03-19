'use strict';

const { EmbedBuilder } = require('discord.js');

// Models loaded lazily
const getModels = () => require('../../server/db/models');

function generateId(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${rand}`;
}

function findTeamByDiscordId(teams, discordUserId) {
  return teams.find((t) =>
    (t.members ?? []).some((m) =>
      typeof m === 'string' ? m === discordUserId : m.discordId === discordUserId,
    ),
  );
}

module.exports = {
  name: 'cfsubmit',
  aliases: ['cws'],
  description: 'Submit a Champion Forge task completion',

  /**
   * Usage: !cfsubmit <task_id>  (attach a screenshot to the message)
   */
  async execute(message, args) {
    if (args.length < 1) {
      return message.reply(
        '❌ Usage: `!cfsubmit <task_id>` — attach a screenshot to this message\n' +
          'Example: `!cfsubmit cwtask_abc123` (with screenshot attached)',
      );
    }

    const [taskId] = args;
    const screenshot = message.attachments.first()?.url ?? null;

    if (!screenshot) {
      return message.reply(
        '❌ Please attach a screenshot to your message.\n' +
          'Usage: `!cfsubmit <task_id>` with a screenshot attached.',
      );
    }

    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsSubmission } = getModels();

    // Look up the task
    const task = await ClanWarsTask.findOne({ where: { taskId, isActive: true } });
    if (!task) {
      return message.reply(`❌ Task \`${taskId}\` not found. Check your task ID and try again.`);
    }

    // Look up the event — must be in GATHERING
    const event = await ClanWarsEvent.findByPk(task.eventId);
    if (!event || event.status !== 'GATHERING') {
      return message.reply('❌ This event is not currently in the Gathering phase.');
    }

    // Find which team this user belongs to via their linked Discord user ID
    const teams = await ClanWarsTeam.findAll({ where: { eventId: event.eventId } });
    const team = findTeamByDiscordId(teams, message.author.id);

    if (!team) {
      return message.reply('❌ Your Discord account is not on a team in this event.');
    }

    // Check the member's role in the team (SKILLER/PVMER/FLEX)
    const member = (team.members ?? []).find((m) => m.discordId === message.author.id);
    const memberRole = member?.role ?? 'FLEX';

    // Validate role vs task
    if (memberRole !== 'FLEX' && task.role !== memberRole) {
      return message.reply(
        `❌ This task is for **${task.role}s** only. You are assigned as a **${memberRole}**.`,
      );
    }

    // Create submission
    try {
      await ClanWarsSubmission.create({
        submissionId: generateId('cws'),
        eventId: event.eventId,
        teamId: team.teamId,
        submittedBy: message.author.id,
        submittedUsername: message.author.username,
        channelId: message.channelId,
        taskId,
        taskLabel: task.label,
        difficulty: task.difficulty,
        role: task.role,
        screenshot,
        status: 'PENDING',
        submittedAt: new Date(),
      });

      return message.reply(`✅ **${task.label}** submitted for **${team.teamName}** — pending review.`);
    } catch (err) {
      console.error('[cfsubmit] Error creating submission:', err);
      return message.reply('❌ Failed to record your submission. Please try again.');
    }
  },
};

// Pre-screenshot command
module.exports.cfpresubmit = {
  name: 'cfpresubmit',
  aliases: ['cwps'],
  description: 'Submit a prescreenshot to confirm your starting state for a Champion Forge task',

  /**
   * Usage: !cfpresubmit <task_id>  (attach a screenshot to the message)
   */
  async execute(message, args) {
    if (args.length < 1) {
      return message.reply(
        '❌ Usage: `!cfpresubmit <task_id>` — attach a screenshot to this message\n' +
          'Example: `!cfpresubmit cwtask_abc123` (with screenshot attached)',
      );
    }

    const [taskId] = args;
    const screenshot = message.attachments.first()?.url ?? null;

    if (!screenshot) {
      return message.reply(
        '❌ Please attach a screenshot to your message.\n' +
          'Usage: `!cfpresubmit <task_id>` with a screenshot attached.',
      );
    }

    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsPreScreenshot } = getModels();

    // Look up the task
    const task = await ClanWarsTask.findOne({ where: { taskId, isActive: true } });
    if (!task) {
      return message.reply(`❌ Task \`${taskId}\` not found. Check your task ID and try again.`);
    }

    // Look up the event — must be in GATHERING
    const event = await ClanWarsEvent.findByPk(task.eventId);
    if (!event || event.status !== 'GATHERING') {
      return message.reply('❌ This event is not currently in the Gathering phase.');
    }

    // Find which team this user belongs to via their linked Discord user ID
    const teams = await ClanWarsTeam.findAll({ where: { eventId: event.eventId } });
    const team = findTeamByDiscordId(teams, message.author.id);

    try {
      await ClanWarsPreScreenshot.create({
        preScreenshotId: generateId('cwps'),
        eventId: event.eventId,
        teamId: team?.teamId ?? null,
        taskId,
        taskLabel: task.label,
        submittedBy: message.author.id,
        submittedUsername: message.author.username,
        screenshotUrl: screenshot,
        channelId: message.channelId,
        messageId: message.id,
        submittedAt: new Date(),
      });

      return message.reply(`📸 Prescreenshot logged for **${task.label}**.`);
    } catch (err) {
      console.error('[cfpresubmit] Error storing prescreenshot:', err);
      return message.reply('❌ Failed to record your prescreenshot. Please try again.');
    }
  },
};

// Help command
module.exports.help = {
  name: 'championforge',
  aliases: ['cf'],
  description: 'Champion Forge help and commands',

  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle('⚔️ Champion Forge Commands')
      .setColor(0x7d5fff)
      .setDescription('Compete with your clan to build and battle a champion!')
      .addFields(
        {
          name: '📬 Submit a Task',
          value:
            '`!cfsubmit <task_id>` — Submit task completion (attach screenshot to message)\n`!cws <task_id>` — Shorthand',
          inline: false,
        },
        {
          name: '📸 Pre-screenshot',
          value:
            '`!cfpresubmit <task_id>` — Submit a prescreenshot showing your starting state (attach screenshot)\n`!cwps <task_id>` — Shorthand',
          inline: false,
        },
        {
          name: 'ℹ️ Info',
          value:
            'All other actions (outfitting, battle, war chest) happen on the website at **osrsbingohub.com/champion-forge**.',
          inline: false,
        },
      )
      .setFooter({
        text: 'Your Discord ID must be added to your team by an admin on the website.',
      });

    return message.reply({ embeds: [embed] });
  },
};
