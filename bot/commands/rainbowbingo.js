'use strict';

const { EmbedBuilder } = require('discord.js');

const getModels = () => require('../../server/db/models');
const { TILE_MAP } = require('../../server/utils/rainbowTiles');

function generateId(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 8; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `${prefix}_${rand}`;
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

async function handleSubmission(message, args, type) {
  const tileCode = args[0]?.toUpperCase();
  if (!tileCode) {
    const cmd = type === 'PRE' ? 'rbpre' : 'rbsubmit';
    return message.reply(
      `❌ Usage: \`!${cmd} <tile>\` with a screenshot attached. Example: \`!${cmd} Y3\``,
    );
  }

  const tileDef = TILE_MAP[tileCode];
  if (!tileDef) {
    return message.reply(`❌ \`${tileCode}\` is not a valid tile. Check the board and try again.`);
  }

  const screenshot = message.attachments.first()?.url ?? null;
  if (!screenshot) {
    return message.reply('❌ Please attach a screenshot to your message.');
  }

  const { RainbowTeam, RainbowEvent, RainbowTeamTile, RainbowSubmission } = getModels();

  const team = await RainbowTeam.findOne({ where: { discordChannelId: message.channelId } });
  if (!team) {
    return message.reply('❌ This channel is not registered for any Rainbow Bingo team.');
  }

  const event = await RainbowEvent.findOne({ where: { eventId: team.eventId, status: 'ACTIVE' } });
  if (!event) {
    return message.reply('❌ There is no active Rainbow Bingo event for your team.');
  }

  const teamTile = await RainbowTeamTile.findOne({ where: { teamId: team.teamId, tileCode } });
  if (!teamTile) {
    return message.reply(`❌ Tile \`${tileCode}\` was not found for your team.`);
  }

  if (teamTile.status === 'LOCKED')
    return message.reply('❌ 🔒 That tile is still locked — complete the prerequisites first.');
  if (teamTile.status === 'COMPLETE') return message.reply('❌ ✅ That tile is already complete.');

  const submission = await RainbowSubmission.create({
    submissionId: generateId('rbs'),
    teamId: team.teamId,
    eventId: event.eventId,
    tileCode,
    type,
    screenshotUrl: screenshot,
    discordMessageId: message.id,
    channelId: message.channelId,
    status: 'PENDING',
    discordUsername: message.author.globalName ?? message.author.username,
    discordUserId: message.author.id,
    submittedAt: new Date(),
  });

  // Pre-screenshots are informational only — no tile state change.
  // Finals move the tile to SUBMITTED on the first submission so the admin queue shows it.
  if (type === 'FINAL' && teamTile.status === 'UNLOCKED') {
    await teamTile.update({ status: 'SUBMITTED' });
  }

  const typeLabel = type === 'PRE' ? 'Pre-screenshot' : 'Submission';
  const embed = new EmbedBuilder()
    .setColor(COLOR_HEX[tileDef.color] ?? 0x95a5a6)
    .setTitle(`✅ ${typeLabel} received for ${tileCode}`)
    .setDescription(`**${tileDef.bossOrSkill}** — ${tileDef.metricLabel}`)
    .addFields({ name: 'Team', value: team.teamName, inline: true })
    .addFields({ name: 'Status', value: 'Pending review', inline: true })
    // .setImage(screenshot)
    .setTimestamp();

  await message.reply({ embeds: [embed] });

  if (event.staffChannelId) {
    try {
      const staffChannel = await message.client.channels.fetch(event.staffChannelId);
      const staffEmbed = new EmbedBuilder()
        .setColor(COLOR_HEX[tileDef.color] ?? 0x95a5a6)
        .setTitle(`🌈 New ${typeLabel} — ${tileCode}`)
        .setDescription(`**${tileDef.bossOrSkill}** — ${tileDef.metricLabel}`)
        .addFields(
          { name: 'Team', value: team.teamName, inline: true },
          { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
        )
        .setImage(screenshot)
        .setFooter({ text: `submissionId: ${submission.submissionId}` })
        .setTimestamp();
      await staffChannel.send({ embeds: [staffEmbed] });
    } catch (err) {
      console.error('[rainbowbingo] failed to send staff notification:', err.message);
    }
  }
}

const rbsubmit = {
  name: 'rbsubmit',
  aliases: ['rbs'],
  description: 'Submit a Rainbow Bingo tile completion screenshot',
  async execute(message, args) {
    return handleSubmission(message, args, 'FINAL');
  },
};

const rbpre = {
  name: 'rbpre',
  aliases: ['rbp'],
  description: 'Submit a Rainbow Bingo pre-screenshot for a tile',
  async execute(message, args) {
    return handleSubmission(message, args, 'PRE');
  },
};

module.exports = rbsubmit;
module.exports.rbpre = rbpre;
