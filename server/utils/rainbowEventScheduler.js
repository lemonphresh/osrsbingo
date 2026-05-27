'use strict';

const cron = require('node-cron');
const logger = require('./logger');

async function checkRainbowEventSchedule() {
  const { RainbowEvent, RainbowTeam } = require('../db/models');
  const { Op } = require('sequelize');
  const { postDiscordEmbed } = require('./rainbowDiscord');

  const siteUrl = process.env.SITE_URL ?? 'https://www.osrsbingohub.com';
  const now = new Date();

  // Start scheduled events
  const toStart = await RainbowEvent.findAll({
    where: {
      status: 'SETUP',
      startDate: { [Op.ne]: null, [Op.lte]: now },
    },
  });

  for (const event of toStart) {
    logger.info(`[rainbowScheduler] auto-starting event ${event.eventId}`);
    await event.update({ status: 'ACTIVE' });
    const teams = await RainbowTeam.findAll({ where: { eventId: event.eventId } });
    for (const team of teams) {
      if (!team.discordChannelId || !team.teamToken) continue;
      await postDiscordEmbed(team.discordChannelId, {
        color: 0x9b59b6,
        title: `🌈 Rainbow Bingo has started!`,
        description: [
          `**Event password:** \`${event.eventName}\``,
          `Include this password visibly in every screenshot you submit, like by utilizing the Wise Old Man RuneLite plugin.`,
          `Your team board is live! Bookmark the link below, it's your home base for tracking progress and submitting tiles.\n${siteUrl}/eg-rainbow/team/${team.teamToken}`,
        ].join('\n\n'),
        timestamp: now.toISOString(),
      }, { roleId: team.discordRoleId });
    }
  }

  // End scheduled events
  const toEnd = await RainbowEvent.findAll({
    where: {
      status: 'ACTIVE',
      endDate: { [Op.ne]: null, [Op.lte]: now },
    },
  });

  for (const event of toEnd) {
    logger.info(`[rainbowScheduler] auto-ending event ${event.eventId}`);
    await event.update({ status: 'COMPLETE' });
    const teams = await RainbowTeam.findAll({ where: { eventId: event.eventId } });
    for (const team of teams) {
      if (!team.discordChannelId) continue;
      await postDiscordEmbed(team.discordChannelId, {
        color: 0xffd700,
        title: `🏳️‍🌈 Rainbow Bingo has ended!`,
        description: [
          `That's a wrap! Thank you so much for playing, you all made this event something special.`,
          `Final standings are up on the event page.\n${siteUrl}/eg-rainbow`,
        ].join('\n\n'),
        timestamp: now.toISOString(),
      }, { roleId: team.discordRoleId });
    }
  }
}

function startRainbowEventScheduler() {
  cron.schedule('* * * * *', async () => {
    try {
      await checkRainbowEventSchedule();
    } catch (err) {
      logger.error({ err }, '[rainbowScheduler] error during schedule check');
    }
  });
  logger.info('[rainbowScheduler] started — checking event schedule every minute');
}

module.exports = { startRainbowEventScheduler };
