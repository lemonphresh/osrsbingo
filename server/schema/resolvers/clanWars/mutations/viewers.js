'use strict';

const { AuthenticationError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const { joinView, leaveView, getViewerCount } = require('../../../../utils/battleViewers');

module.exports = {
  joinBattleView: async (_, { eventId }, { user }) => {
    if (!user) throw new AuthenticationError('Not authenticated');
    joinView(eventId, user.id, user.username ?? user.displayName ?? null);
    pubsub.publish(`BATTLE_VIEWERS_${eventId}`, { battleViewersUpdated: getViewerCount(eventId) });
    return true;
  },

  leaveBattleView: async (_, { eventId }, { user }) => {
    if (!user) return false;
    leaveView(eventId, user.id);
    pubsub.publish(`BATTLE_VIEWERS_${eventId}`, { battleViewersUpdated: getViewerCount(eventId) });
    return true;
  },
};
