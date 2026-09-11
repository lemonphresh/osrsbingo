'use strict';

const { getModels, requireAuth } = require('../helpers');
const { generateId } = require('../../../../utils/battleship/bsConfig');
const {
  assertPlacementWindowOpen,
  layoutSignature,
  validateShipLayout,
} = require('../../../../utils/battleship/bsPlacementSuggestions');
const { UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');
const logger = require('../../../../utils/logger');

// Broadcast the current suggestion list for a team so every subscriber
// (workshop UI, admin view) stays in sync.
async function publishSuggestions(teamId, eventId) {
  const { BSPlacementSuggestion } = getModels();
  const suggestions = await BSPlacementSuggestion.findAll({
    where: { teamId },
    order: [['createdAt', 'ASC']],
  });
  try {
    await pubsub.publish(`BS_PLACEMENT_SUGGESTIONS_${teamId}`, {
      bsPlacementSuggestionsUpdated: suggestions,
    });
  } catch (err) {
    // The database commit is authoritative. A transient PubSub failure must not
    // make the caller retry an already-committed toggle/share operation.
    logger.error({ err, eventId, teamId }, '[Battleship] failed to publish placement suggestions');
  }
  return suggestions;
}

async function requireTeamMember(user, team, event) {
  const uid = String(user.id);
  const isSiteAdmin = user.admin === true;
  const isEventAdmin =
    isSiteAdmin || (event.adminIds ?? []).includes(uid) || event.creatorId === uid;
  if (isEventAdmin) return { isSiteAdmin, isEventAdmin };
  if (!user.discordUserId || !(team.members ?? []).includes(user.discordUserId)) {
    throw new UserInputError('You are not on this team');
  }
  return { isSiteAdmin: false, isEventAdmin: false };
}

module.exports = {
  shareBSPlacementSuggestion: async (_, { teamId, ships }, context) => {
    const user = requireAuth(context);
    validateShipLayout(ships);
    const { sequelize, BSEvent, BSTeam, BSPlacementSuggestion } = getModels();
    const seedTeam = await BSTeam.findByPk(teamId, { attributes: ['teamId', 'eventId'] });
    if (!seedTeam) throw new UserInputError('Team not found');

    const result = await sequelize.transaction(async (transaction) => {
      // Every suggestion mutation locks event -> team in the same order. The
      // team lock serializes array vote updates and layout replacement.
      const event = await BSEvent.findByPk(seedTeam.eventId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!event) throw new UserInputError('Event not found');
      const team = await BSTeam.findByPk(teamId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!team || team.eventId !== event.eventId) throw new UserInputError('Team not found');
      assertPlacementWindowOpen(event, 'share placement suggestions');
      const { isEventAdmin } = await requireTeamMember(user, team, event);
      const onTeam = !!user.discordUserId && (team.members ?? []).includes(user.discordUserId);
      if (!isEventAdmin && !onTeam) {
        throw new UserInputError('Link your Discord account before sharing a suggestion.');
      }

      const proposerDiscordId = onTeam ? user.discordUserId : `admin_${user.id}`;
      const incomingSig = layoutSignature(ships);
      const teamSuggestions = await BSPlacementSuggestion.findAll({
        where: { teamId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const twin = teamSuggestions.find(
        (suggestion) =>
          suggestion.proposerDiscordId !== proposerDiscordId &&
          layoutSignature(suggestion.ships) === incomingSig
      );

      if (twin) {
        await BSPlacementSuggestion.destroy({
          where: { teamId, proposerDiscordId },
          transaction,
        });
        if (onTeam) {
          for (const suggestion of teamSuggestions) {
            if (
              suggestion.suggestionId === twin.suggestionId ||
              suggestion.proposerDiscordId === proposerDiscordId
            ) {
              continue;
            }
            if ((suggestion.votes ?? []).includes(user.discordUserId)) {
              await suggestion.update(
                { votes: suggestion.votes.filter((vote) => vote !== user.discordUserId) },
                { transaction }
              );
            }
          }
          if (!(twin.votes ?? []).includes(user.discordUserId)) {
            await twin.update(
              { votes: [...(twin.votes ?? []), user.discordUserId] },
              { transaction }
            );
          }
        }
        return { suggestion: await twin.reload({ transaction }), eventId: event.eventId };
      }

      await BSPlacementSuggestion.destroy({
        where: { teamId, proposerDiscordId },
        transaction,
      });
      if (onTeam) {
        for (const suggestion of teamSuggestions) {
          if (suggestion.proposerDiscordId === proposerDiscordId) continue;
          if ((suggestion.votes ?? []).includes(user.discordUserId)) {
            await suggestion.update(
              { votes: suggestion.votes.filter((vote) => vote !== user.discordUserId) },
              { transaction }
            );
          }
        }
      }

      const suggestion = await BSPlacementSuggestion.create(
        {
          suggestionId: generateId('bsps'),
          eventId: event.eventId,
          teamId,
          proposerDiscordId,
          proposerUsername: null,
          ships,
          votes: onTeam ? [user.discordUserId] : [],
        },
        { transaction }
      );
      return { suggestion, eventId: event.eventId };
    });

    await publishSuggestions(teamId, result.eventId);
    return result.suggestion;
  },

  voteBSPlacementSuggestion: async (_, { suggestionId }, context) => {
    const user = requireAuth(context);
    const { sequelize, BSEvent, BSTeam, BSPlacementSuggestion } = getModels();
    const seedSuggestion = await BSPlacementSuggestion.findByPk(suggestionId, {
      attributes: ['suggestionId', 'teamId', 'eventId'],
    });
    if (!seedSuggestion) throw new UserInputError('Suggestion not found');

    const result = await sequelize.transaction(async (transaction) => {
      const event = await BSEvent.findByPk(seedSuggestion.eventId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!event) throw new UserInputError('Event not found');
      const team = await BSTeam.findByPk(seedSuggestion.teamId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!team || team.eventId !== event.eventId) throw new UserInputError('Team not found');
      assertPlacementWindowOpen(event, 'vote on placement suggestions');
      if (!user.discordUserId || !(team.members ?? []).includes(user.discordUserId)) {
        throw new UserInputError('Only team members can vote on placement suggestions.');
      }

      const teamSuggestions = await BSPlacementSuggestion.findAll({
        where: { teamId: team.teamId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const suggestion = teamSuggestions.find((row) => row.suggestionId === suggestionId);
      if (!suggestion) throw new UserInputError('Suggestion not found');
      const voterId = user.discordUserId;
      for (const row of teamSuggestions) {
        if (row.suggestionId === suggestionId) continue;
        if ((row.votes ?? []).includes(voterId)) {
          await row.update(
            { votes: row.votes.filter((vote) => vote !== voterId) },
            { transaction }
          );
        }
      }
      const votes = suggestion.votes ?? [];
      await suggestion.update(
        {
          votes: votes.includes(voterId)
            ? votes.filter((vote) => vote !== voterId)
            : [...votes, voterId],
        },
        { transaction }
      );
      return {
        suggestion: await suggestion.reload({ transaction }),
        eventId: event.eventId,
        teamId: team.teamId,
      };
    });

    await publishSuggestions(result.teamId, result.eventId);
    return result.suggestion;
  },

  deleteBSPlacementSuggestion: async (_, { suggestionId }, context) => {
    const user = requireAuth(context);
    const { sequelize, BSEvent, BSTeam, BSPlacementSuggestion } = getModels();
    const seedSuggestion = await BSPlacementSuggestion.findByPk(suggestionId, {
      attributes: ['suggestionId', 'teamId', 'eventId'],
    });
    if (!seedSuggestion) return true;

    const result = await sequelize.transaction(async (transaction) => {
      const event = await BSEvent.findByPk(seedSuggestion.eventId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!event) throw new UserInputError('Event not found');
      const team = await BSTeam.findByPk(seedSuggestion.teamId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!team || team.eventId !== event.eventId) throw new UserInputError('Team not found');
      assertPlacementWindowOpen(event, 'delete placement suggestions');
      const suggestion = await BSPlacementSuggestion.findByPk(suggestionId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!suggestion) return { deleted: false, eventId: event.eventId, teamId: team.teamId };
      const uid = String(user.id);
      const isEventAdmin =
        user.admin === true || (event.adminIds ?? []).includes(uid) || event.creatorId === uid;
      const isOwn = user.discordUserId && suggestion.proposerDiscordId === user.discordUserId;
      if (!isEventAdmin && !isOwn) {
        throw new UserInputError('You can only delete your own suggestion');
      }
      await suggestion.destroy({ transaction });
      return { deleted: true, eventId: event.eventId, teamId: team.teamId };
    });

    if (result.deleted) await publishSuggestions(result.teamId, result.eventId);
    return true;
  },
};
