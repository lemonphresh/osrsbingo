'use strict';

/**
 * Shared logic for transitioning a ClanWarsEvent to GATHERING.
 * Called by both the GraphQL resolver (manual launch) and the bot cron (scheduled launch).
 */

const { sampleTasksFromPool } = require('./cwTaskSampler');
const { sendClanWarsPhaseAnnouncement } = require('./clanWarsNotifications');
const { pubsub } = require('../schema/pubsub');

async function triggerGatheringTransition(event) {
  const { ClanWarsTeam, ClanWarsTask } = require('../db/models');

  const now = new Date();
  const hours = event.eventConfig?.gatheringHours ?? 48;

  const words = ['SWIFT', 'BRAVE', 'WILD', 'RUSH', 'EPIC', 'BOLD', 'MIGHTY', 'FIERCE', 'NOBLE', 'VALIANT', 'BLAZING', 'FEARLESS'];
  const word = words[Math.floor(Math.random() * words.length)];
  const code = Math.random().toString(36).substring(2, 6).toUpperCase();
  const eventPassword = `${word}-${code}`;

  const teams = await ClanWarsTeam.findAll({ where: { eventId: event.eventId } });
  const totalMembers = teams.reduce((sum, t) => sum + (t.members?.length ?? 1), 0);
  const avgTeamSize = teams.length > 0 ? Math.round(totalMembers / teams.length) : 5;
  const taskRows = sampleTasksFromPool(event.eventId, event.seed, event.difficulty ?? 'standard', avgTeamSize);
  await ClanWarsTask.bulkCreate(taskRows.map((r) => ({ ...r, createdAt: now, updatedAt: now })));

  await event.update({
    status: 'GATHERING',
    gatheringStart: now,
    gatheringEnd: new Date(now.getTime() + hours * 60 * 60 * 1000),
    eventPassword,
    scheduledGatheringStart: null,
  });

  // Fire Discord announcement (best-effort)
  if (event.announcementsChannelId) {
    sendClanWarsPhaseAnnouncement({
      channelId: event.announcementsChannelId,
      eventId: event.eventId,
      eventName: event.eventName,
      phase: 'GATHERING',
    });
  }

  pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${event.eventId}`, { clanWarsEventUpdated: event });
  return event;
}

async function triggerOutfittingTransition(event) {
  const now = new Date();
  const hours = event.eventConfig?.outfittingHours ?? 24;

  await event.update({
    status: 'OUTFITTING',
    outfittingEnd: new Date(now.getTime() + hours * 60 * 60 * 1000),
  });

  // Fire Discord announcement (best-effort)
  if (event.announcementsChannelId) {
    sendClanWarsPhaseAnnouncement({
      channelId: event.announcementsChannelId,
      eventId: event.eventId,
      eventName: event.eventName,
      phase: 'OUTFITTING',
    });
  }

  pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${event.eventId}`, { clanWarsEventUpdated: event });
  return event;
}

module.exports = { triggerGatheringTransition, triggerOutfittingTransition };
