'use strict';

const { Op } = require('sequelize');
const { getModels } = require('./helpers');

async function getActiveCFEventsForUser(userId, discordUserId) {
  const { CFEvent, CFTeam } = getModels();

  const CF_ACTIVE_STATUSES = ['GATHERING', 'OUTFITTING', 'BATTLE'];

  const staffEvents = await CFEvent.findAll({
    where: {
      status: { [Op.in]: CF_ACTIVE_STATUSES },
      [Op.or]: [
        { creatorId: String(userId) },
        { adminIds: { [Op.contains]: [String(userId)] } },
        { refIds: { [Op.contains]: [String(userId)] } },
      ],
    },
    order: [['createdAt', 'DESC']],
  });

  let memberEvents = [];
  if (discordUserId) {
    const staffEventIds = new Set(staffEvents.map((e) => e.eventId));
    const teams = await CFTeam.findAll({
      where: { members: { [Op.contains]: [{ discordId: discordUserId }] } },
      attributes: ['eventId'],
    });
    const memberEventIds = [...new Set(teams.map((t) => t.eventId))].filter(
      (id) => !staffEventIds.has(id)
    );
    if (memberEventIds.length > 0) {
      memberEvents = await CFEvent.findAll({
        where: {
          eventId: { [Op.in]: memberEventIds },
          status: { [Op.in]: CF_ACTIVE_STATUSES },
        },
        order: [['createdAt', 'DESC']],
      });
    }
  }

  return [...staffEvents, ...memberEvents];
}

module.exports = { getActiveCFEventsForUser };
