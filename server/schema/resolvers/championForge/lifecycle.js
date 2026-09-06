'use strict';

const { pubsub } = require('../../pubsub');
const { sendCFPhaseAnnouncement } = require('../../../utils/championForge/cfNotifications');
const { triggerGatheringTransition } = require('../../../utils/championForge/cfScheduler');
const { getModels } = require('./helpers');

/**
 * Apply the side-effects for a status transition (task seeding, timers,
 * loadout locking, announcements, pubsub). Shared by updateCFEventStatus
 * (which enforces the valid transition graph) and adminForceEventStatus
 * (which bypasses the graph but still needs the side-effects).
 */
async function applyStatusTransition(event, status) {
  const { eventId } = event;
  const updates = { status };
  const now = new Date();

  if (status === 'GATHERING') {
    // First-time entry into GATHERING must seed tasks, generate password,
    // set the timer, and announce. If the event was already in GATHERING
    // and is being force-set back, just re-apply status without re-seeding
    // duplicate tasks or clobbering the password.
    if (!event.gatheringStart) {
      await triggerGatheringTransition(event);
      pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${eventId}`, { cfEventUpdated: event });
      return;
    }
    await event.update({ status });
    pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${eventId}`, { cfEventUpdated: event });
    return;
  }

  if (status === 'OUTFITTING') {
    const hours = event.eventConfig?.outfittingHours ?? 24;
    updates.outfittingEnd = new Date(now.getTime() + hours * 60 * 60 * 1000);
  } else if (status === 'BATTLE') {
    const { CFTeam } = getModels();
    await CFTeam.update(
      { loadoutLocked: true },
      { where: { eventId, loadoutLocked: false } }
    );
  }

  await event.update(updates);

  if (event.announcementsChannelId) {
    sendCFPhaseAnnouncement({
      channelId: event.announcementsChannelId,
      eventId,
      eventName: event.eventName,
      phase: status,
    });
  }

  pubsub.publish(`CLAN_WARS_EVENT_UPDATED_${eventId}`, { cfEventUpdated: event });
}

module.exports = { applyStatusTransition };
