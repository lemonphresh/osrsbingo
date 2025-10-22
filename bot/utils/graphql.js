// bot/utils/graphql.js
const axios = require('axios');

const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || 'http://localhost:4000/graphql';

async function graphqlRequest(query, variables = {}, discordUserId = null) {
  try {
    const response = await axios.post(
      GRAPHQL_ENDPOINT,
      {
        query,
        variables,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          // Add Discord user ID as a header for authentication
          ...(discordUserId && { 'X-Discord-User-Id': discordUserId }),
        },
      }
    );

    if (response.data.errors) {
      console.error('GraphQL Errors:', response.data.errors);
      throw new Error(response.data.errors[0].message);
    }

    return response.data.data;
  } catch (error) {
    if (error.response) {
      console.error('GraphQL Response Error:', error.response.data);
    } else if (error.request) {
      console.error('GraphQL Request Error: No response received');
    } else {
      console.error('GraphQL Error:', error.message);
    }
    throw error;
  }
}

// Helper to find team by Discord user
async function findTeamForUser(eventId, userId, userRoles) {
  const query = `
    query GetTreasureEvent($eventId: ID!) {
      getTreasureEvent(eventId: $eventId) {
        teams {
          teamId
          teamName
          discordRoleId
          members
        }
      }
    }
  `;

  const data = await graphqlRequest(query, { eventId });
  const teams = data.getTreasureEvent.teams;

  // Check if user's role matches a team's discordRoleId
  const teamByRole = teams.find(
    (team) => team.discordRoleId && userRoles.includes(team.discordRoleId)
  );

  if (teamByRole) return teamByRole;

  // Check if user is in team members
  const teamByMember = teams.find((team) => team.members && team.members.includes(userId));

  return teamByMember;
}

// Get event ID from channel topic
function getEventIdFromChannel(channel) {
  const topic = channel.topic || '';
  console.log('Channel topic:', topic);
  return topic;
}

module.exports = {
  graphqlRequest,
  findTeamForUser,
  getEventIdFromChannel,
};
