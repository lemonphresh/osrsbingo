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
    leaguesWomGroupId
    creatorId
    adminIds
    theme
    discordConfig
    goalTemplates
    isFollowing
    events {
      ...GroupGoalEventFields
    }
    creator {
      id
      username
      displayName
      rsn
    }
    admins {
      id
      username
      displayName
      rsn
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
        completed
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
      rsn
    }
  }
`;

export const GET_MY_GROUP_ACTIVITY = gql`
  query GetMyGroupActivity {
    getMyGroupActivity {
      id
      type
      dashboardId
      dashboardSlug
      dashboardName
      eventId
      eventName
      metadata
      readAt
      createdAt
    }
  }
`;

export const GET_UNREAD_GROUP_NOTIFICATION_COUNT = gql`
  query GetUnreadGroupNotificationCount {
    getUnreadGroupNotificationCount
  }
`;

export const FOLLOW_GROUP_DASHBOARD = gql`
  mutation FollowGroupDashboard($dashboardId: ID!) {
    followGroupDashboard(dashboardId: $dashboardId)
  }
`;

export const UNFOLLOW_GROUP_DASHBOARD = gql`
  mutation UnfollowGroupDashboard($dashboardId: ID!) {
    unfollowGroupDashboard(dashboardId: $dashboardId)
  }
`;

export const MUTE_GROUP_DASHBOARD = gql`
  mutation MuteGroupDashboard($dashboardId: ID!) {
    muteGroupDashboard(dashboardId: $dashboardId)
  }
`;

export const UNMUTE_GROUP_DASHBOARD = gql`
  mutation UnmuteGroupDashboard($dashboardId: ID!) {
    unmuteGroupDashboard(dashboardId: $dashboardId)
  }
`;

export const MARK_GROUP_NOTIFICATIONS_READ = gql`
  mutation MarkGroupNotificationsRead {
    markGroupNotificationsRead
  }
`;

export const GET_MY_GROUP_ASSOCIATIONS = gql`
  query GetMyGroupAssociations {
    getMyGroupAssociations {
      dashboardId
      dashboardName
      dashboardSlug
      role
      isMuted
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
      isLeagues
    }
  }
`;

export const SET_LEAGUES_WOM_GROUP_ID = gql`
  ${GROUP_DASHBOARD_FIELDS}
  mutation SetLeaguesWomGroupId($id: ID!, $leaguesWomGroupId: String) {
    setLeaguesWomGroupId(id: $id, leaguesWomGroupId: $leaguesWomGroupId) {
      ...GroupDashboardFields
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
  mutation ConfirmGroupDashboardDiscord($id: ID!, $guildId: String!, $channelId: String!, $roleId: String) {
    confirmGroupDashboardDiscord(id: $id, guildId: $guildId, channelId: $channelId, roleId: $roleId) {
      ...GroupDashboardFields
    }
  }
`;

export const UPDATE_GROUP_DISCORD_NOTIFICATIONS = gql`
  ${GROUP_DASHBOARD_FIELDS}
  mutation UpdateGroupDiscordNotifications($id: ID!, $notifications: JSON!) {
    updateGroupDiscordNotifications(id: $id, notifications: $notifications) {
      ...GroupDashboardFields
    }
  }
`;

export const SEND_TEST_GROUP_DISCORD_MESSAGE = gql`
  mutation SendTestGroupDiscordMessage($id: ID!) {
    sendTestGroupDiscordMessage(id: $id)
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

export const TRANSFER_GROUP_DASHBOARD = gql`
  ${GROUP_DASHBOARD_FIELDS}
  mutation TransferGroupDashboard($id: ID!, $newOwnerId: ID!) {
    transferGroupDashboard(id: $id, newOwnerId: $newOwnerId) {
      ...GroupDashboardFields
    }
  }
`;

export const SAVE_GOAL_TEMPLATE = gql`
  ${GROUP_DASHBOARD_FIELDS}
  mutation SaveGoalTemplate($id: ID!, $name: String!, $goals: JSON!) {
    saveGoalTemplate(id: $id, name: $name, goals: $goals) {
      ...GroupDashboardFields
    }
  }
`;

export const DELETE_GOAL_TEMPLATE = gql`
  ${GROUP_DASHBOARD_FIELDS}
  mutation DeleteGoalTemplate($id: ID!, $templateName: String!) {
    deleteGoalTemplate(id: $id, templateName: $templateName) {
      ...GroupDashboardFields
    }
  }
`;

export const DELETE_GROUP_DASHBOARD = gql`
  mutation DeleteGroupDashboard($id: ID!) {
    deleteGroupDashboard(id: $id)
  }
`;
