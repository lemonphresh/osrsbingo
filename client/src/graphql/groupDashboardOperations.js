import { gql } from '@apollo/client';

// ============================================================
// FRAGMENTS
// ============================================================

const GROUP_GOAL_EVENT_FIELDS = gql`
  fragment GroupGoalEventFields on GroupGoalEvent {
    id
    dashboardId
    eventName
    startDate
    endDate
    goals
    lastSyncedAt
    isVisible
    notificationsSent
  }
`;

const GROUP_DASHBOARD_FIELDS = gql`
  ${GROUP_GOAL_EVENT_FIELDS}
  fragment GroupDashboardFields on GroupDashboard {
    id
    slug
    groupName
    womGroupId
    creatorId
    adminIds
    theme
    discordConfig
    events {
      ...GroupGoalEventFields
    }
    creator {
      id
      username
      displayName
    }
    admins {
      id
      username
      displayName
    }
  }
`;

// ============================================================
// QUERIES
// ============================================================

export const GET_GROUP_DASHBOARD = gql`
  ${GROUP_DASHBOARD_FIELDS}
  query GetGroupDashboard($slug: String!) {
    getGroupDashboard(slug: $slug) {
      ...GroupDashboardFields
    }
  }
`;

export const GET_GROUP_DASHBOARD_PROGRESS = gql`
  query GetGroupDashboardProgress($eventId: ID!) {
    getGroupDashboardProgress(eventId: $eventId) {
      goalId
      metric
      displayName
      current
      target
      percent
      topContributors {
        rsn
        value
        percent
        role
      }
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($search: String!) {
    searchUsers(search: $search) {
      id
      username
      displayName
    }
  }
`;

export const GET_GROUP_COMPETITIONS = gql`
  query GetGroupCompetitions($slug: String!) {
    getGroupCompetitions(slug: $slug) {
      id
      title
      metric
      type
      status
      startsAt
      endsAt
      participantCount
    }
  }
`;

export const GET_MY_GROUP_DASHBOARDS = gql`
  ${GROUP_DASHBOARD_FIELDS}
  query GetMyGroupDashboards {
    getMyGroupDashboards {
      ...GroupDashboardFields
    }
  }
`;

// ============================================================
// MUTATIONS
// ============================================================

export const CREATE_GROUP_DASHBOARD = gql`
  ${GROUP_DASHBOARD_FIELDS}
  mutation CreateGroupDashboard($input: CreateGroupDashboardInput!) {
    createGroupDashboard(input: $input) {
      ...GroupDashboardFields
    }
  }
`;

export const UPDATE_GROUP_DASHBOARD = gql`
  ${GROUP_DASHBOARD_FIELDS}
  mutation UpdateGroupDashboard($id: ID!, $input: UpdateGroupDashboardInput!) {
    updateGroupDashboard(id: $id, input: $input) {
      ...GroupDashboardFields
    }
  }
`;

export const CREATE_GROUP_GOAL_EVENT = gql`
  ${GROUP_GOAL_EVENT_FIELDS}
  mutation CreateGroupGoalEvent($dashboardId: ID!, $input: GroupGoalEventInput!) {
    createGroupGoalEvent(dashboardId: $dashboardId, input: $input) {
      ...GroupGoalEventFields
    }
  }
`;

export const UPDATE_GROUP_GOAL_EVENT = gql`
  ${GROUP_GOAL_EVENT_FIELDS}
  mutation UpdateGroupGoalEvent($id: ID!, $input: GroupGoalEventInput!) {
    updateGroupGoalEvent(id: $id, input: $input) {
      ...GroupGoalEventFields
    }
  }
`;

export const DELETE_GROUP_GOAL_EVENT = gql`
  mutation DeleteGroupGoalEvent($id: ID!) {
    deleteGroupGoalEvent(id: $id)
  }
`;

export const CONFIRM_GROUP_DASHBOARD_DISCORD = gql`
  ${GROUP_DASHBOARD_FIELDS}
  mutation ConfirmGroupDashboardDiscord($id: ID!, $guildId: String!, $channelId: String!) {
    confirmGroupDashboardDiscord(id: $id, guildId: $guildId, channelId: $channelId) {
      ...GroupDashboardFields
    }
  }
`;

export const REFRESH_GROUP_GOAL_DATA = gql`
  ${GROUP_GOAL_EVENT_FIELDS}
  mutation RefreshGroupGoalData($eventId: ID!) {
    refreshGroupGoalData(eventId: $eventId) {
      ...GroupGoalEventFields
    }
  }
`;

export const ADD_GROUP_DASHBOARD_ADMIN = gql`
  ${GROUP_DASHBOARD_FIELDS}
  mutation AddGroupDashboardAdmin($id: ID!, $userId: ID!) {
    addGroupDashboardAdmin(id: $id, userId: $userId) {
      ...GroupDashboardFields
    }
  }
`;

export const REMOVE_GROUP_DASHBOARD_ADMIN = gql`
  ${GROUP_DASHBOARD_FIELDS}
  mutation RemoveGroupDashboardAdmin($id: ID!, $userId: ID!) {
    removeGroupDashboardAdmin(id: $id, userId: $userId) {
      ...GroupDashboardFields
    }
  }
`;
