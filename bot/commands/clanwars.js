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

module.exports = {
  name: 'cwsubmit',
  aliases: ['cws'],
  description: 'Submit a Champion Forge task completion',

  /**
   * Usage: !cwsubmit <task_id> <proof_url>
   */
  async execute(message, args) {
    if (args.length < 2) {
      return message.reply(
        '❌ Usage: `!cwsubmit <task_id> <proof_url>`\n' +
        'Example: `!cwsubmit cwtask_abc123 https://i.imgur.com/example.png`'
      );
    }

    const [taskId, proofUrl] = args;
    const { ClanWarsEvent, ClanWarsTeam, ClanWarsTask, ClanWarsSubmission } = getModels();

    // Validate URL format
    try {
      new URL(proofUrl);
    } catch {
      return message.reply('❌ Invalid proof URL. Please provide a direct image or video link.');
    }

    const memberRoles = message.member?.roles?.cache;
    if (!memberRoles) {
      return message.reply('❌ Could not read your Discord roles. Are you in the server properly?');
    }

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

    // Find which team this user belongs to (match Discord role)
    const teams = await ClanWarsTeam.findAll({ where: { eventId: event.eventId } });
    const team = teams.find((t) => t.discordRoleId && memberRoles.has(t.discordRoleId));

    if (!team) {
      return message.reply(
        '❌ You are not assigned to a team in this event. Ask an admin to add your Discord role.'
      );
    }

    // Check the member's role in the team (SKILLER/PVMER/FLEX)
    const member = (team.members ?? []).find(
      (m) => m.discordId === message.author.id
    );
    const memberRole = member?.role ?? 'FLEX';

    // Validate role vs task
    if (memberRole !== 'FLEX' && task.role !== memberRole) {
      return message.reply(
        `❌ This task is for **${task.role}s** only. You are assigned as a **${memberRole}**.`
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
        proofUrl,
        status: 'PENDING',
        submittedAt: new Date(),
      });

      const embed = new EmbedBuilder()
        .setTitle('📬 Submission Received')
        .setColor(0x7d5fff)
        .setDescription(
          `**${message.author.username}**, your submission for **${task.label}** is pending review.`
        )
        .addFields(
          { name: 'Team', value: team.teamName, inline: true },
          { name: 'Difficulty', value: task.difficulty, inline: true },
          { name: 'Role', value: task.role, inline: true },
        )
        .setFooter({ text: 'An admin will review your submission shortly.' });

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('[cwsubmit] Error creating submission:', err);
      return message.reply('❌ Failed to record your submission. Please try again.');
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
          value: '`!cwsubmit <task_id> <proof_url>` — Submit proof of task completion\n`!cws <task_id> <proof_url>` — Shorthand',
          inline: false,
        },
        {
          name: 'ℹ️ Info',
          value: 'All other actions (outfitting, battle, war chest) happen on the website at **osrsbingohub.com/champion-forge**.',
          inline: false,
        },
      )
      .setFooter({ text: 'Your Discord role determines your team. Ask an admin if you\'re not assigned.' });

    return message.reply({ embeds: [embed] });
  },
};
