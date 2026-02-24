import { gql } from '@apollo/client';

// ============================================================
// FRAGMENTS (Reusable field selections)
// ============================================================

// const USER_BASIC_FIELDS = gql`
//   fragment UserBasicFields on User {
//     id
//     displayName
//     username
//     rsn
//   }
// `;

// const USER_ADMIN_FIELDS = gql`
//   fragment UserAdminFields on User {
//     id
//     admin
//     displayName
//     username
//     rsn
//     permissions
//   }
// `;

// const BOARD_CARD_FIELDS = gql`
//   fragment BoardCardFields on BingoBoard {
//     id
//     name
//     category
//     layout
//     theme
//     tiles {
//       id
//       isComplete
//     }
//     editors {
//       displayName
//       username
//     }
//   }
// `;

const BONUS_SETTINGS_FIELDS = gql`
  fragment BonusSettingsFields on BonusSettings {
    allowDiagonals
    horizontalBonus
    verticalBonus
    diagonalBonus
    blackoutBonus
  }
`;

// const TILE_FULL_FIELDS = gql`
//   fragment TileFullFields on BingoTile {
//     id
//     name
//     value
//     icon
//     isComplete
//     completedBy
//     dateCompleted
//     board
//   }
// `;

// const SUBMISSION_FIELDS = gql`
//   fragment SubmissionFields on TreasureSubmission {
//     submissionId
//     teamId
//     nodeId
//     submittedBy
//     submittedByUsername
//     channelId
//     proofUrl
//     status
//     reviewedBy
//     reviewedAt
//     submittedAt
//     team {
//       teamId
//       teamName
//     }
//   }
// `;

// const TEAM_SUMMARY_FIELDS = gql`
//   fragment TeamSummaryFields on TreasureTeam {
//     teamId
//     teamName
//     currentPot
//     completedNodes
//   }
// `;

// const TEAM_FULL_FIELDS = gql`
//   fragment TeamFullFields on TreasureTeam {
//     teamId
//     teamName
//     discordRoleId
//     members
//     currentPot
//     keysHeld
//     completedNodes
//     availableNodes
//     innTransactions
//     activeBuffs
//     buffHistory
//   }
// `;

// const NODE_FIELDS = gql`
//   fragment NodeFields on TreasureNode {
//     nodeId
//     nodeType
//     title
//     description
//     coordinates
//     mapLocation
//     locationGroupId
//     difficultyTier
//     prerequisites
//     unlocks
//     paths
//     objective
//     rewards
//     innTier
//     availableRewards
//   }
// `;

// ============================================================
// USERS
// ============================================================

export const GET_USERS = gql`
  query GetUsers {
    getUsers {
      id
      admin
      displayName
      username
      rsn
      permissions
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      displayName
      username
      rsn
      admin
      discordUserId
      discordUsername
      discordAvatar
      editorBoards {
        id
        name
        isPublic
        layout
        theme
        editors {
          id
          displayName
          username
          rsn
        }
        tiles {
          id
          isComplete
        }
      }
    }
  }
`;

export const GET_USER_BY_DISCORD_ID = gql`
  query GetUserByDiscordId($discordUserId: String!) {
    getUserByDiscordId(discordUserId: $discordUserId) {
      id
      username
      displayName
      rsn
      discordUserId
      discordAvatar
      discordUsername
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($search: String!) {
    searchUsers(search: $search) {
      id
      admin
      displayName
      username
      rsn
    }
  }
`;

export const SEARCH_USERS_BY_IDS = gql`
  query SearchUsersByIds($ids: [ID!]!) {
    searchUsersByIds(ids: $ids) {
      id
      admin
      displayName
      username
      rsn
    }
  }
`;

export const SEARCH_USERS_BY_DISCORD = gql`
  query SearchUsersByDiscord($query: String!, $limit: Int) {
    searchUsersByDiscord(query: $query, limit: $limit) {
      id
      username
      displayName
      rsn
      discordUserId
      discordUsername
      discordAvatar
    }
  }
`;

// ============================================================
// BINGO BOARDS
// ============================================================

export const GET_BOARD = gql`
  ${BONUS_SETTINGS_FIELDS}
  query GetBingoBoard($id: ID!) {
    getBingoBoard(id: $id) {
      id
      name
      description
      type
      category
      layout
      isPublic
      theme
      userId
      createdAt
      team
      totalValue
      totalValueCompleted
      bonusSettings {
        ...BonusSettingsFields
      }
      editors {
        id
        displayName
        username
        rsn
      }
      tiles {
        id
        name
        value
        icon
        isComplete
        completedBy
        dateCompleted
      }
    }
  }
`;
export const GET_POPULAR_TILES = gql`
  query GetPopularTiles {
    getPopularTiles {
      name
      icon
      usageCount
    }
  }
`;

export const GET_PUBLIC_BOARDS = gql`
  query GetPublicBoards($limit: Int, $offset: Int, $category: String, $searchQuery: String) {
    getPublicBoards(
      limit: $limit
      offset: $offset
      category: $category
      searchQuery: $searchQuery
    ) {
      totalCount
      boards {
        id
        name
        category
        layout
        theme
        tiles {
          id
          isComplete
        }
        editors {
          displayName
          username
        }
      }
    }
  }
`;

export const GET_ALL_BOARDS = gql`
  query GetAllBoards($limit: Int, $offset: Int, $category: String, $searchQuery: String) {
    getAllBoards(limit: $limit, offset: $offset, category: $category, searchQuery: $searchQuery) {
      totalCount
      boards {
        id
        name
        category
        isPublic
        layout
        theme
        tiles {
          id
          isComplete
        }
        editors {
          displayName
          username
        }
      }
    }
  }
`;

export const GET_FEATURED_BOARDS = gql`
  query GetFeaturedBoards($limit: Int, $offset: Int) {
    getFeaturedBoards(limit: $limit, offset: $offset) {
      totalCount
      boards {
        id
        name
        category
        layout
        theme
        tiles {
          id
          isComplete
        }
        editors {
          displayName
          username
        }
      }
    }
  }
`;

// ============================================================
// BINGO TILES
// ============================================================

export const GET_TILE = gql`
  query GetBingoTile($id: ID!) {
    getBingoTile(id: $id) {
      id
      name
      value
      icon
      isComplete
      completedBy
      dateCompleted
      board
    }
  }
`;

// ============================================================
// EDITOR INVITATIONS
// ============================================================

export const GET_PENDING_INVITATIONS = gql`
  query GetPendingInvitations {
    pendingInvitations {
      id
      boardId
      status
      boardDetails {
        id
        name
      }
      inviterUser {
        displayName
        username
      }
    }
  }
`;

// ============================================================
// CALENDAR EVENTS
// ============================================================

export const GET_CALENDAR_EVENTS = gql`
  query GetCalendarEvents($offset: Int, $limit: Int) {
    calendarEvents(offset: $offset, limit: $limit) {
      totalCount
      items {
        id
        title
        description
        start
        end
        allDay
        eventType
      }
    }
  }
`;

export const GET_SAVED_CALENDAR_EVENTS = gql`
  query GetSavedCalendarEvents($offset: Int, $limit: Int) {
    savedCalendarEvents(offset: $offset, limit: $limit) {
      totalCount
      items {
        id
        title
        description
        eventType
        allDay
        updatedAt
      }
    }
  }
`;

export const GET_CALENDAR_VERSION = gql`
  query GetCalendarVersion {
    calendarVersion {
      lastUpdated
      totalCount
    }
    savedCalendarVersion {
      lastUpdated
      totalCount
    }
  }
`;

// ============================================================
// GIELINOR RUSH: EVENTS
// ============================================================

export const GET_TREASURE_EVENT = gql`
  query GetTreasureEvent($eventId: ID!) {
    getTreasureEvent(eventId: $eventId) {
      # Identity
      eventId
      eventName
      eventPassword
      status
      clanId

      # Dates
      startDate
      endDate
      createdAt
      updatedAt

      # Configuration
      eventConfig
      derivedValues
      contentSelections
      mapStructure
      discordConfig

      # Ownership
      creatorId
      adminIds
      admins {
        id
        displayName
        username
      }
      refIds
      refs {
        id
        displayName
        username
      }

      # Teams (with full details)
      teams {
        teamId
        teamName
        discordRoleId
        members {
          discordUserId
          discordUsername
          discordAvatar
          username
        }
        currentPot
        keysHeld
        completedNodes
        availableNodes
        activeBuffs
        buffHistory
        submissions {
          submissionId
          submittedByUsername
          channelId
          nodeId
          submittedBy
          proofUrl
          status
          reviewedBy
          reviewedAt
          submittedAt
        }
      }

      # Nodes
      nodes {
        nodeId
        nodeType
        title
        description
        coordinates
        mapLocation
        locationGroupId
        difficultyTier
        prerequisites
        unlocks
        paths
        objective
        rewards
        innTier
        availableRewards
      }
    }
  }
`;

export const GET_ALL_TREASURE_EVENTS = gql`
  query GetAllTreasureEvents($userId: ID) {
    getAllTreasureEvents(userId: $userId) {
      eventId
      eventName
      status
      clanId
      startDate
      endDate
      creatorId
      createdAt
      updatedAt
      adminIds
      derivedValues
      nodes {
        nodeId
        nodeType
      }
      teams {
        teamId
        teamName
        currentPot
        completedNodes
        updatedAt
      }
    }
  }
`;

export const GET_MY_TREASURE_EVENTS = gql`
  query GetMyTreasureEvents {
    getMyTreasureEvents {
      eventId
      eventName
      status
      clanId
      startDate
      endDate
      createdAt
      updatedAt
      teams {
        teamId
        teamName
        currentPot
        completedNodes
      }
    }
  }
`;

// ============================================================
// GIELINOR RUSH: TEAMS
// ============================================================

export const GET_TREASURE_TEAM = gql`
  query GetTreasureTeam($eventId: ID!, $teamId: ID!) {
    getTreasureTeam(eventId: $eventId, teamId: $teamId) {
      teamId
      teamName
      members {
        discordUserId
        discordUsername
        discordAvatar
        username
      }
      currentPot
      keysHeld
      completedNodes
      availableNodes
      innTransactions
      activeBuffs
      buffHistory
    }
  }
`;

export const GET_TREASURE_LEADERBOARD = gql`
  query GetTreasureEventLeaderboard($eventId: ID!) {
    getTreasureEventLeaderboard(eventId: $eventId) {
      teamId
      teamName
      currentPot
      completedNodes
      keysHeld
    }
  }
`;

// ============================================================
// GIELINOR RUSH: SUBMISSIONS
// ============================================================

export const GET_PENDING_SUBMISSIONS = gql`
  query GetPendingSubmissions($eventId: ID!) {
    getPendingSubmissions(eventId: $eventId) {
      submissionId
      teamId
      nodeId
      submittedBy
      submittedByUsername
      channelId
      proofUrl
      status
      reviewedBy
      reviewedAt
      submittedAt
      team {
        teamId
        teamName
      }
    }
  }
`;

export const GET_ALL_SUBMISSIONS = gql`
  query GetAllSubmissions($eventId: ID!) {
    getAllSubmissions(eventId: $eventId) {
      submissionId
      teamId
      nodeId
      submittedBy
      submittedByUsername
      channelId
      proofUrl
      status
      reviewedBy
      reviewedAt
      submittedAt
      team {
        teamId
        teamName
      }
    }
  }
`;

// ============================================================
// GIELINOR RUSH: ACTIVITY FEED
// ============================================================

export const GET_TREASURE_ACTIVITIES = gql`
  query GetTreasureActivities($eventId: ID!, $limit: Int) {
    getTreasureActivities(eventId: $eventId, limit: $limit) {
      id
      eventId
      teamId
      type
      data
      timestamp
    }
  }
`;

// ============================================================
// ANALYTICS
// ============================================================

export const GET_VISIT_COUNT = gql`
  query GetVisitCount {
    getVisitCount
  }
`;

export const GET_SITE_STATS = gql`
  query GetSiteStats {
    getSiteStats {
      totalBoards
      totalUsers
      totalTiles
      completedTiles
      boardsThisWeek
      usersThisWeek
      publicBoards
      totalVisits
      completionRate
    }
  }
`;
