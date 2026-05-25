'use strict';

const { EmbedBuilder } = require('discord.js');
const { TILE_MAP } = require('../../server/utils/rainbowTiles');
const { graphqlRequest } = require('../utils/graphql');

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

  let submission;
  try {
    const data = await graphqlRequest(
      `mutation CreateRainbowSubmission($input: CreateRainbowSubmissionInput!) {
        createRainbowSubmission(input: $input) {
          submissionId
          eventId
          team { teamId teamName }
        }
      }`,
      {
        input: {
          tileCode,
          type,
          screenshotUrl: screenshot,
          discordMessageId: message.id,
          channelId: message.channelId,
          discordUsername: message.author.globalName ?? message.author.username,
          discordUserId: message.author.id,
          submittedAt: new Date().toISOString(),
        },
      },
    );
    submission = data.createRainbowSubmission;
  } catch (err) {
    console.error('[rainbowbingo] createRainbowSubmission failed:', err.message);
    return message.reply('❌ Failed to record your submission. Please try again or contact a ref.');
  }

  const typeLabel = type === 'PRE' ? 'Pre-screenshot' : 'Submission';
  const teamName = submission.team?.teamName ?? 'Unknown';

  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLOR_HEX[tileDef.color] ?? 0x95a5a6)
        .setTitle(`✅ ${typeLabel} received for ${tileCode}`)
        .setDescription(`**${tileDef.bossOrSkill}** — ${tileDef.metricLabel}`)
        .addFields(
          { name: 'Team', value: teamName, inline: true },
          { name: 'Status', value: 'Pending review', inline: true },
        )
        .setTimestamp(),
    ],
  });

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
