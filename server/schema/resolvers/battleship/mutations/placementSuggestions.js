'use strict';

const { getModels, requireAuth, getEventOrThrow } = require('../helpers');
const { generateId, validatePlacement, SHIP_TYPES } = require('../../../../utils/battleship/bsConfig');
const { UserInputError } = require('apollo-server-express');
const { pubsub } = require('../../../pubsub');

// Broadcast the current suggestion list for a team so every subscriber
// (workshop UI, admin view) stays in sync.
async function publishSuggestions(teamId, eventId) {
  const { BSPlacementSuggestion } = getModels();
  const suggestions = await BSPlacementSuggestion.findAll({
    where: { teamId },
    order: [['createdAt', 'ASC']],
  });
  await pubsub.publish(`BS_PLACEMENT_SUGGESTIONS_${teamId}`, {
    bsPlacementSuggestionsUpdated: suggestions,
  });
  return suggestions;
}

// Canonical string for a layout, so we can compare two layouts for equality
// regardless of the input order. Each ship type is unique per layout.
function layoutSignature(ships) {
  return (ships ?? [])
    .map((s) => `${s.shipType}:${s.orientation}:${s.startRow}:${s.startCol}`)
    .sort()
    .join('|');
}

// Validate a full ship layout: all 5 SHIP_TYPES present, in-bounds, no overlap.
function validateShipLayout(ships) {
  if (!Array.isArray(ships) || ships.length !== SHIP_TYPES.length) {
    throw new UserInputError(`Layout must contain exactly ${SHIP_TYPES.length} ships.`);
  }
  const seen = new Set();
  const accepted = [];
  for (const ship of ships) {
    if (!SHIP_TYPES.includes(ship.shipType)) {
      throw new UserInputError(`Unknown ship type: ${ship.shipType}`);
    }
    if (seen.has(ship.shipType)) {
      throw new UserInputError(`Duplicate ship type in layout: ${ship.shipType}`);
    }
    seen.add(ship.shipType);
    if (!validatePlacement(ship.shipType, ship.orientation, ship.startRow, ship.startCol, accepted, ship.shipType)) {
      throw new UserInputError(`Invalid placement for ${ship.shipType}: out of bounds or overlapping.`);
    }
    accepted.push(ship);
  }
}

async function requireTeamMember(user, team, event) {
  const uid = String(user.id);
  const isSiteAdmin = user.admin === true;
  const isEventAdmin =
    isSiteAdmin ||
    (event.adminIds ?? []).includes(uid) ||
    event.creatorId === uid;
  if (isEventAdmin) return { isSiteAdmin, isEventAdmin };
  if (!user.discordUserId || !(team.members ?? []).includes(user.discordUserId)) {
    throw new UserInputError('You are not on this team');
  }
  return { isSiteAdmin: false, isEventAdmin: false };
}

module.exports = {
  shareBSPlacementSuggestion: async (_, { teamId, ships }, context) => {
    const user = requireAuth(context);
    const { BSTeam, BSPlacementSuggestion } = getModels();
    const team = await BSTeam.findByPk(teamId);
    if (!team) throw new UserInputError('Team not found');
    const event = await getEventOrThrow(team.eventId);
    if (event.status !== 'PLACEMENT') {
      throw new UserInputError('Placement suggestions can only be shared during the placement phase.');
    }
    const { isEventAdmin } = await requireTeamMember(user, team, event);
    // Admins acting on behalf of a team don't need a Discord ID; regular
    // players do — the suggestion's proposer is the caller's own Discord ID.
    if (!isEventAdmin && !user.discordUserId) {
      throw new UserInputError('Link your Discord account before sharing a suggestion.');
    }

    validateShipLayout(ships);

    const proposerDiscordId = user.discordUserId ?? `admin_${user.id}`;
    const incomingSig = layoutSignature(ships);
    const canVote =
      !isEventAdmin &&
      !!user.discordUserId &&
      (team.members ?? []).includes(user.discordUserId);

    // Look for an existing teammate's suggestion with the exact same layout.
    // If found, we tally a vote for that instead of creating a duplicate.
    const teamSuggestions = await BSPlacementSuggestion.findAll({ where: { teamId } });
    const twin = teamSuggestions.find(
      (s) => s.proposerDiscordId !== proposerDiscordId && layoutSignature(s.ships) === incomingSig,
    );

    if (twin) {
      // Clear the caller's own previous suggestion — they've moved on.
      await BSPlacementSuggestion.destroy({ where: { teamId, proposerDiscordId } });
      if (canVote) {
        const voterId = user.discordUserId;
        // Enforce one-vote-per-team: strip vote off any other suggestion.
        for (const s of teamSuggestions) {
          if (s.suggestionId === twin.suggestionId) continue;
          if ((s.votes ?? []).includes(voterId)) {
            await s.update({ votes: (s.votes ?? []).filter((v) => v !== voterId) });
          }
        }
        // Add caller's vote to the twin.
        const votes = twin.votes ?? [];
        if (!votes.includes(voterId)) {
          await twin.update({ votes: [...votes, voterId] });
        }
      }
      await publishSuggestions(teamId, team.eventId);
      return twin.reload();
    }

    // Replace any previous suggestion by this proposer for this team — wipes
    // its votes so re-sharing forces a re-vote (on that layout).
    await BSPlacementSuggestion.destroy({
      where: { teamId, proposerDiscordId },
    });

    // If the caller is a team member they auto-vote for their own new
    // suggestion. Enforce one-vote-per-team by stripping their vote off any
    // other suggestion first.
    if (canVote) {
      const voterId = user.discordUserId;
      for (const s of teamSuggestions) {
        if (s.proposerDiscordId === proposerDiscordId) continue; // will be destroyed above
        if ((s.votes ?? []).includes(voterId)) {
          await s.update({ votes: (s.votes ?? []).filter((v) => v !== voterId) });
        }
      }
    }

    const suggestion = await BSPlacementSuggestion.create({
      suggestionId:      generateId('bsps'),
      eventId:           team.eventId,
      teamId,
      proposerDiscordId,
      proposerUsername:  null,
      ships,
      votes:             canVote ? [user.discordUserId] : [],
    });

    await publishSuggestions(teamId, team.eventId);
    return suggestion;
  },

  voteBSPlacementSuggestion: async (_, { suggestionId }, context) => {
    const user = requireAuth(context);
    const { BSTeam, BSPlacementSuggestion } = getModels();
    const suggestion = await BSPlacementSuggestion.findByPk(suggestionId);
    if (!suggestion) throw new UserInputError('Suggestion not found');
    const team = await BSTeam.findByPk(suggestion.teamId);
    if (!team) throw new UserInputError('Team not found');
    const event = await getEventOrThrow(team.eventId);
    if (event.status !== 'PLACEMENT') {
      throw new UserInputError('Voting is only open during the placement phase.');
    }
    // Only actual team members can vote — admins/refs are excluded (per spec).
    if (!user.discordUserId || !(team.members ?? []).includes(user.discordUserId)) {
      throw new UserInputError('Only team members can vote on placement suggestions.');
    }

    const voterId = user.discordUserId;
    // Enforce one-vote-per-user across the team: if this voter has voted on
    // any other suggestion for the team, remove that vote first.
    const teamSuggestions = await BSPlacementSuggestion.findAll({ where: { teamId: team.teamId } });
    let toggledOff = false;
    for (const s of teamSuggestions) {
      if (s.suggestionId === suggestionId) continue;
      if ((s.votes ?? []).includes(voterId)) {
        await s.update({ votes: (s.votes ?? []).filter((v) => v !== voterId) });
      }
    }
    const votes = suggestion.votes ?? [];
    if (votes.includes(voterId)) {
      // Toggle off
      await suggestion.update({ votes: votes.filter((v) => v !== voterId) });
      toggledOff = true;
    } else {
      await suggestion.update({ votes: [...votes, voterId] });
    }

    await publishSuggestions(team.teamId, team.eventId);
    // Return the (updated) target suggestion so the client can show latest state.
    void toggledOff;
    return suggestion.reload();
  },

  deleteBSPlacementSuggestion: async (_, { suggestionId }, context) => {
    const user = requireAuth(context);
    const { BSTeam, BSPlacementSuggestion } = getModels();
    const suggestion = await BSPlacementSuggestion.findByPk(suggestionId);
    if (!suggestion) return true; // idempotent
    const team = await BSTeam.findByPk(suggestion.teamId);
    if (!team) throw new UserInputError('Team not found');
    const event = await getEventOrThrow(team.eventId);
    const uid = String(user.id);
    const isEventAdmin =
      user.admin === true ||
      (event.adminIds ?? []).includes(uid) ||
      event.creatorId === uid;
    const isOwn = user.discordUserId && suggestion.proposerDiscordId === user.discordUserId;
    if (!isEventAdmin && !isOwn) {
      throw new UserInputError('You can only delete your own suggestion');
    }
    await suggestion.destroy();
    await publishSuggestions(team.teamId, team.eventId);
    return true;
  },
};
