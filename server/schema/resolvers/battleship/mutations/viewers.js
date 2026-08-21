'use strict';

const { AuthenticationError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const { joinView, leaveView, getViewerCount } = require('../../../../utils/battleship/bsViewers');
const { getModels } = require('../helpers');

module.exports = {
  joinBSView: async (_, { eventId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    const { BSTeam } = getModels();
    const teams = await BSTeam.findAll({ where: { eventId } });
    const onTeam = teams.some((t) => (t.members ?? []).includes(user.discordUserId));
    if (!onTeam) return false;
    joinView(eventId, user.id);
    pubsub.publish(`BS_VIEWERS_${eventId}`, { bsViewersUpdated: getViewerCount(eventId) });
    return true;
  },

  leaveBSView: async (_, { eventId }, { user }) => {
    if (!user) return false;
    leaveView(eventId, user.id);
    pubsub.publish(`BS_VIEWERS_${eventId}`, { bsViewersUpdated: getViewerCount(eventId) });
    return true;
  },
};
