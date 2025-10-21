import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query {
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
      admin
      username
      rsn
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

export const GET_BOARD = gql`
  query GetBingoBoard($id: ID!) {
    getBingoBoard(id: $id) {
      id
      type
      layout
      category
      isPublic
      editors {
        id
        rsn
        displayName
        username
      }
      description
      userId
      name
      theme
      team
      totalValue
      totalValueCompleted
      bonusSettings {
        allowDiagonals
        horizontalBonus
        verticalBonus
        diagonalBonus
        blackoutBonus
      }
      tiles {
        id
        icon
        name
        isComplete
        dateCompleted
        completedBy
        value
      }
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
      boards {
        id
        category
        name
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
      totalCount
    }
  }
`;

export const GET_ALL_BOARDS = gql`
  query GetAllBoards($limit: Int, $offset: Int, $category: String, $searchQuery: String) {
    getAllBoards(limit: $limit, offset: $offset, category: $category, searchQuery: $searchQuery) {
      boards {
        id
        category
        name
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
      totalCount
    }
  }
`;

export const GET_PUBLIC_FEATURED_BOARDS = gql`
  query GetFeaturedBoards($limit: Int, $offset: Int) {
    getFeaturedBoards(limit: $limit, offset: $offset) {
      boards {
        id
        category
        name
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
      totalCount
    }
  }
`;

export const GET_TILE = gql`
  query GetBingoTile($id: ID!) {
    getBingoTile(id: $id) {
      id
      name
      isComplete
      value
      icon
      dateCompleted
      completedBy
      board
    }
  }
`;

export const GET_PENDING_INVITATIONS = gql`
  query {
    pendingInvitations {
      id
      boardId
      boardDetails {
        name
        id
      }
      inviterUser {
        displayName
        username
      }
      status
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

export const LIST_CAL_EVENTS = gql`
  query CalendarEvents($offset: Int, $limit: Int) {
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

export const LIST_SAVED_CAL_EVENTS = gql`
  query SavedCalendarEvents($offset: Int, $limit: Int) {
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

export const CALENDAR_VERSION = gql`
  query CalendarVersion {
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

export const GET_TREASURE_EVENT = gql`
  query GetTreasureEvent($eventId: ID!) {
    getTreasureEvent(eventId: $eventId) {
      eventId
      clanId
      eventName
      status
      startDate
      endDate
      eventConfig
      derivedValues
      mapStructure
      discordConfig
      creatorId
      createdAt
      updatedAt
      admins {
        id
        displayName
        username
      }
      adminIds
      teams {
        activeBuffs
        buffHistory
        teamId
        teamName
        discordRoleId
        members
        currentPot
        keysHeld
        completedNodes
        availableNodes
        submissions {
          submissionId
          nodeId
          submittedBy
          proofUrl
          status
          reviewedBy
          reviewedAt
          submittedAt
        }
      }
      nodes {
        nodeId
        nodeType
        title
        description
        coordinates
        mapLocation
        prerequisites
        unlocks
        paths
        objective
        rewards
        difficultyTier
        innTier
        availableRewards
      }
    }
  }
`;

export const GET_TREASURE_TEAM = gql`
  query GetTreasureTeam($eventId: ID!, $teamId: ID!) {
    getTreasureTeam(eventId: $eventId, teamId: $teamId) {
      teamId
      teamName
      currentPot
      keysHeld
      completedNodes
      availableNodes
      activeBuffs
      buffHistory
    }
  }
`;

export const GET_ALL_TREASURE_EVENTS = gql`
  query GetAllTreasureEvents($userId: ID) {
    getAllTreasureEvents(userId: $userId) {
      eventId
      clanId
      eventName
      status
      startDate
      endDate
      creatorId
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

export const GET_MY_TREASURE_EVENTS = gql`
  query GetMyTreasureEvents {
    getMyTreasureEvents {
      eventId
      clanId
      eventName
      status
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

export const GET_PENDING_SUBMISSIONS = gql`
  query GetPendingSubmissions($eventId: ID!) {
    getPendingSubmissions(eventId: $eventId) {
      submissionId
      teamId
      nodeId
      submittedBy
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

export const GET_TREASURE_EVENT_LEADERBOARD = gql`
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

export const GET_ALL_SUBMISSIONS = gql`
  query GetAllSubmissions($eventId: ID!) {
    getAllSubmissions(eventId: $eventId) {
      submissionId
      teamId
      nodeId
      submittedBy
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
