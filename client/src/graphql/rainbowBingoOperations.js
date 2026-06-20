import { gql } from '@apollo/client';

export const RAINBOW_ADMIN_EVENT_FIELDS = gql`
  fragment RainbowAdminEventFields on RainbowEvent {
    eventId
    eventName
    status
    adminIds
    staffChannelId
    teams {
      teamId
      teamName
      discordChannelId
      discordRoleId
    }
  }
`;

export const GET_ACTIVE_RAINBOW_EVENT = gql`
  query GetActiveRainbowEvent {
    getActiveRainbowEvent {
      eventId
      eventName
      status
      startDate
      endDate
      adminIds
      staffChannelId
      guildId
      womCompetitionId
      teams {
        teamId
        teamName
        discordChannelId
        discordRoleId
        teamToken
      }
      admins {
        id
        displayName
        username
      }
    }
  }
`;

export const GET_RAINBOW_TILE_DEFS = gql`
  query GetRainbowTileDefs {
    getRainbowTileDefs {
      tileCode
      color
      colorIndex
      bossOrSkill
      metricType
      metricTarget
      metricUnit
      metricLabel
      hoursEstimate
      theme
      funName
      validDrops
      notes
    }
  }
`;

export const GET_RAINBOW_TILE_SUBMISSIONS = gql`
  query GetRainbowTileSubmissions($eventId: ID!, $teamId: ID!, $tileCode: String!) {
    getRainbowSubmissions(eventId: $eventId, teamId: $teamId, tileCode: $tileCode) {
      submissionId
      type
      screenshotUrl
      discordMessageId
      channelId
      status
      denialReason
      submittedAt
      reviewedAt
    }
  }
`;

export const GET_RAINBOW_SUBMISSIONS = gql`
  query GetRainbowSubmissions($eventId: ID!, $status: RainbowSubmissionStatus) {
    getRainbowSubmissions(eventId: $eventId, status: $status) {
      submissionId
      teamId
      tileCode
      type
      screenshotUrl
      discordMessageId
      channelId
      status
      discordUsername
      reviewedBy
      reviewedAt
      denialReason
      submittedAt
      team {
        teamId
        teamName
      }
    }
  }
`;

export const RAINBOW_SUBMISSION_ADDED = gql`
  subscription RainbowSubmissionAdded($eventId: ID!) {
    rainbowSubmissionAdded(eventId: $eventId) {
      submissionId
      teamId
      tileCode
      type
      screenshotUrl
      channelId
      status
      submittedAt
      team {
        teamId
        teamName
      }
    }
  }
`;

export const RAINBOW_SUBMISSION_REVIEWED = gql`
  subscription RainbowSubmissionReviewed($eventId: ID!) {
    rainbowSubmissionReviewed(eventId: $eventId) {
      submissionId
      status
      type
    }
  }
`;

export const CREATE_RAINBOW_EVENT = gql`
  mutation CreateRainbowEvent($input: CreateRainbowEventInput!) {
    createRainbowEvent(input: $input) {
      eventId
      eventName
      status
      startDate
      endDate
      adminIds
      staffChannelId
      teams {
        teamId
        teamName
        discordChannelId
      }
    }
  }
`;

export const CREATE_RAINBOW_TEAM = gql`
  mutation CreateRainbowTeam($eventId: ID!, $input: CreateRainbowTeamInput!) {
    createRainbowTeam(eventId: $eventId, input: $input) {
      teamId
      teamName
      discordChannelId
      captainDiscordId
      notes
    }
  }
`;

export const REVIEW_RAINBOW_SUBMISSION = gql`
  mutation ReviewRainbowSubmission($submissionId: ID!, $approved: Boolean!, $denialReason: String) {
    reviewRainbowSubmission(submissionId: $submissionId, approved: $approved, denialReason: $denialReason) {
      submissionId
      status
      reviewedBy
      reviewedAt
      denialReason
    }
  }
`;

export const COMPLETE_RAINBOW_TILE = gql`
  mutation CompleteRainbowTile($teamId: ID!, $tileCode: String!) {
    completeRainbowTile(teamId: $teamId, tileCode: $tileCode) {
      teamTileId
      tileCode
      status
      completedAt
    }
  }
`;

export const SET_RAINBOW_TILE_PROGRESS = gql`
  mutation SetRainbowTileProgress($teamId: ID!, $tileCode: String!, $progress: Int!) {
    setRainbowTileProgress(teamId: $teamId, tileCode: $tileCode, progress: $progress) {
      teamTileId
      tileCode
      progress
    }
  }
`;

export const UNDO_RAINBOW_TILE_COMPLETE = gql`
  mutation UndoRainbowTileComplete($teamId: ID!, $tileCode: String!) {
    undoRainbowTileComplete(teamId: $teamId, tileCode: $tileCode)
  }
`;

export const ADD_RAINBOW_ADMIN = gql`
  mutation AddRainbowAdmin($eventId: ID!, $userId: ID!) {
    addRainbowAdmin(eventId: $eventId, userId: $userId) {
      eventId
      adminIds
      admins { id displayName username }
    }
  }
`;

export const REMOVE_RAINBOW_ADMIN = gql`
  mutation RemoveRainbowAdmin($eventId: ID!, $userId: ID!) {
    removeRainbowAdmin(eventId: $eventId, userId: $userId) {
      eventId
      adminIds
      admins { id displayName username }
    }
  }
`;

export const TEST_RAINBOW_CHANNEL = gql`
  mutation TestRainbowChannel($teamId: ID!) {
    testRainbowChannel(teamId: $teamId)
  }
`;

export const TEST_RAINBOW_NOTIFICATION = gql`
  mutation TestRainbowNotification($teamId: ID!, $type: String!) {
    testRainbowNotification(teamId: $teamId, type: $type)
  }
`;

export const DELETE_RAINBOW_TEAM = gql`
  mutation DeleteRainbowTeam($teamId: ID!) {
    deleteRainbowTeam(teamId: $teamId)
  }
`;

export const GENERATE_RAINBOW_TEAM_TOKEN = gql`
  mutation GenerateRainbowTeamToken($teamId: ID!) {
    generateRainbowTeamToken(teamId: $teamId) {
      teamId
      teamToken
    }
  }
`;

export const DELETE_RAINBOW_EVENT = gql`
  mutation DeleteRainbowEvent($eventId: ID!) {
    deleteRainbowEvent(eventId: $eventId)
  }
`;

export const UPDATE_RAINBOW_EVENT_STATUS = gql`
  mutation UpdateRainbowEventStatus($eventId: ID!, $status: RainbowEventStatus!) {
    updateRainbowEventStatus(eventId: $eventId, status: $status) {
      eventId
      status
    }
  }
`;

export const SET_RAINBOW_EVENT_GUILD_ID = gql`
  mutation SetRainbowEventGuildId($eventId: ID!, $guildId: String!) {
    setRainbowEventGuildId(eventId: $eventId, guildId: $guildId) {
      eventId
      guildId
    }
  }
`;

export const SET_RAINBOW_EVENT_SCHEDULE = gql`
  mutation SetRainbowEventSchedule($eventId: ID!, $startDate: DateTime, $endDate: DateTime) {
    setRainbowEventSchedule(eventId: $eventId, startDate: $startDate, endDate: $endDate) {
      eventId
      startDate
      endDate
    }
  }
`;

export const SET_RAINBOW_EVENT_WOM_COMPETITION_ID = gql`
  mutation SetRainbowEventWomCompetitionId($eventId: ID!, $womCompetitionId: String) {
    setRainbowEventWomCompetitionId(eventId: $eventId, womCompetitionId: $womCompetitionId) {
      eventId
      womCompetitionId
    }
  }
`;

export const GET_RAINBOW_TEAM_BY_TOKEN = gql`
  query GetRainbowTeamByToken($token: String!) {
    getRainbowTeamByToken(token: $token) {
      teamId
      teamName
      teamToken
      eventId
    }
  }
`;

export const GET_RAINBOW_EVENT_BOARDS = gql`
  query GetRainbowEventBoards($eventId: ID!) {
    getRainbowTeams(eventId: $eventId) {
      teamId
      teamName
      teamToken
      tiles {
        tileCode
        status
        progress
        completedAt
        tileDef {
          tileCode
          color
          bossOrSkill
          metricLabel
        }
      }
    }
  }
`;

export const GET_RAINBOW_TEAM_BOARD = gql`
  query GetRainbowTeamBoard($teamId: ID!) {
    getRainbowTeamBoard(teamId: $teamId) {
      teamTileId
      teamId
      eventId
      tileCode
      status
      progress
      hasSubmissions
      unlockedAt
      completedAt
      tileDef {
        tileCode
        color
        colorIndex
        bossOrSkill
        metricType
        metricTarget
        metricUnit
        metricLabel
        funName
        validDrops
        theme
      }
    }
  }
`;

export const RAINBOW_EVENT_BOARD_UPDATED = gql`
  subscription RainbowEventBoardUpdated($eventId: ID!) {
    rainbowEventBoardUpdated(eventId: $eventId)
  }
`;

export const RAINBOW_TEAM_BOARD_UPDATED = gql`
  subscription RainbowTeamBoardUpdated($teamId: ID!) {
    rainbowTeamBoardUpdated(teamId: $teamId) {
      teamTileId
      teamId
      tileCode
      status
      progress
      hasSubmissions
      unlockedAt
      completedAt
      tileDef {
        tileCode
        color
        colorIndex
        bossOrSkill
        metricType
        metricTarget
        metricUnit
        metricLabel
        funName
        validDrops
        theme
      }
    }
  }
`;
