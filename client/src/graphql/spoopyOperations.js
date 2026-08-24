import { gql } from '@apollo/client';

// ── Fragments ────────────────────────────────────────────────────────────

export const SPOOPY_EVENT_FIELDS = gql`
  fragment SpoopyEventFields on SpoopyEvent {
    eventId
    eventName
    status
    curfewStart
    curfewEnd
    adminIds
    staffChannelId
    board
    contentById
    hauntedHouse
    startingTileIds
    createdAt
  }
`;

export const SPOOPY_TEAM_FIELDS = gql`
  fragment SpoopyTeamFields on SpoopyTeam {
    teamId
    eventId
    teamName
    color
    members
    discordChannelId
    discordRoleId
    teamToken
    gpEarned
    cashedOut
  }
`;

export const SPOOPY_TEAM_BOARD_FIELDS = gql`
  fragment SpoopyTeamBoardFields on SpoopyTeamBoardState {
    eventId
    teamId
    roster
    gpEarned
    cashedOut
    tiles
  }
`;

export const SPOOPY_SUBMISSION_FIELDS = gql`
  fragment SpoopySubmissionFields on SpoopySubmission {
    submissionId
    teamId
    eventId
    tileId
    screenshotUrl
    discordMessageId
    channelId
    status
    discordUsername
    discordUserId
    reviewedBy
    reviewedAt
    denialReason
    submittedAt
  }
`;

// ── Queries ──────────────────────────────────────────────────────────────

// One-shot for /spoopy-event — resolves current event + caller's team + board.
export const MY_SPOOPY_SITUATION = gql`
  query MySpoopySituation($eventId: ID) {
    mySpoopySituation(eventId: $eventId) {
      event { ...SpoopyEventFields }
      myTeam { ...SpoopyTeamFields }
      teamBoard { ...SpoopyTeamBoardFields }
    }
  }
  ${SPOOPY_EVENT_FIELDS}
  ${SPOOPY_TEAM_FIELDS}
  ${SPOOPY_TEAM_BOARD_FIELDS}
`;

export const GET_ACTIVE_SPOOPY_EVENT = gql`
  query GetActiveSpoopyEvent {
    getActiveSpoopyEvent { ...SpoopyEventFields }
  }
  ${SPOOPY_EVENT_FIELDS}
`;

export const GET_SPOOPY_EVENT = gql`
  query SpoopyEvent($eventId: ID!) {
    spoopyEvent(eventId: $eventId) { ...SpoopyEventFields }
  }
  ${SPOOPY_EVENT_FIELDS}
`;

export const GET_SPOOPY_EVENTS = gql`
  query SpoopyEvents {
    spoopyEvents { ...SpoopyEventFields }
  }
  ${SPOOPY_EVENT_FIELDS}
`;

export const GET_SPOOPY_TEAM = gql`
  query SpoopyTeam($teamId: ID!) {
    spoopyTeam(teamId: $teamId) { ...SpoopyTeamFields }
  }
  ${SPOOPY_TEAM_FIELDS}
`;

export const GET_SPOOPY_TEAM_BOARD = gql`
  query SpoopyTeamBoard($teamId: ID!) {
    spoopyTeamBoard(teamId: $teamId) { ...SpoopyTeamBoardFields }
  }
  ${SPOOPY_TEAM_BOARD_FIELDS}
`;

export const GET_SPOOPY_TEAM_BOARD_BY_TOKEN = gql`
  query SpoopyTeamBoardByToken($token: String!) {
    spoopyTeamBoardByToken(token: $token) { ...SpoopyTeamBoardFields }
  }
  ${SPOOPY_TEAM_BOARD_FIELDS}
`;

export const GET_SPOOPY_SUBMISSIONS = gql`
  query SpoopySubmissions($eventId: ID!, $status: String) {
    spoopySubmissions(eventId: $eventId, status: $status) { ...SpoopySubmissionFields }
  }
  ${SPOOPY_SUBMISSION_FIELDS}
`;

// ── Admin mutations ──────────────────────────────────────────────────────

export const CREATE_SPOOPY_EVENT = gql`
  mutation CreateSpoopyEvent($input: CreateSpoopyEventInput!) {
    createSpoopyEvent(input: $input) { ...SpoopyEventFields }
  }
  ${SPOOPY_EVENT_FIELDS}
`;

export const UPDATE_SPOOPY_EVENT_STATUS = gql`
  mutation UpdateSpoopyEventStatus($eventId: ID!, $status: SpoopyEventStatus!) {
    updateSpoopyEventStatus(eventId: $eventId, status: $status) { ...SpoopyEventFields }
  }
  ${SPOOPY_EVENT_FIELDS}
`;

export const UPDATE_SPOOPY_EVENT_BOARD = gql`
  mutation UpdateSpoopyEventBoard(
    $eventId: ID!
    $board: JSON
    $contentById: JSON
    $hauntedHouse: JSON
    $startingTileIds: [String!]
  ) {
    updateSpoopyEventBoard(
      eventId: $eventId
      board: $board
      contentById: $contentById
      hauntedHouse: $hauntedHouse
      startingTileIds: $startingTileIds
    ) { ...SpoopyEventFields }
  }
  ${SPOOPY_EVENT_FIELDS}
`;

export const CREATE_SPOOPY_TEAM = gql`
  mutation CreateSpoopyTeam($eventId: ID!, $input: CreateSpoopyTeamInput!) {
    createSpoopyTeam(eventId: $eventId, input: $input) { ...SpoopyTeamFields }
  }
  ${SPOOPY_TEAM_FIELDS}
`;

export const UPDATE_SPOOPY_TEAM_MEMBERS = gql`
  mutation UpdateSpoopyTeamMembers($teamId: ID!, $members: [String!]!) {
    updateSpoopyTeamMembers(teamId: $teamId, members: $members) { ...SpoopyTeamFields }
  }
  ${SPOOPY_TEAM_FIELDS}
`;

export const ADD_SPOOPY_ADMIN = gql`
  mutation AddSpoopyAdmin($eventId: ID!, $userId: ID!) {
    addSpoopyAdmin(eventId: $eventId, userId: $userId) { ...SpoopyEventFields }
  }
  ${SPOOPY_EVENT_FIELDS}
`;

export const REMOVE_SPOOPY_ADMIN = gql`
  mutation RemoveSpoopyAdmin($eventId: ID!, $userId: ID!) {
    removeSpoopyAdmin(eventId: $eventId, userId: $userId) { ...SpoopyEventFields }
  }
  ${SPOOPY_EVENT_FIELDS}
`;

export const REVIEW_SPOOPY_SUBMISSION = gql`
  mutation ReviewSpoopySubmission($submissionId: ID!, $approved: Boolean!, $denialReason: String) {
    reviewSpoopySubmission(submissionId: $submissionId, approved: $approved, denialReason: $denialReason) {
      ...SpoopySubmissionFields
    }
  }
  ${SPOOPY_SUBMISSION_FIELDS}
`;

// ── Team-member mutations (site-user auth, member gated) ────────────────

export const CREATE_SPOOPY_CHOICE = gql`
  mutation CreateSpoopyChoice($input: CreateSpoopyChoiceInput!) {
    createSpoopyChoice(input: $input) { ...SpoopyTeamBoardFields }
  }
  ${SPOOPY_TEAM_BOARD_FIELDS}
`;

export const CREATE_SPOOPY_SUBMISSION = gql`
  mutation CreateSpoopySubmission($input: CreateSpoopySubmissionInput!) {
    createSpoopySubmission(input: $input) { ...SpoopySubmissionFields }
  }
  ${SPOOPY_SUBMISSION_FIELDS}
`;

export const ENTER_SPOOPY_HAUNTED_HOUSE = gql`
  mutation EnterSpoopyHauntedHouse($input: EnterSpoopyHauntedHouseInput!) {
    enterSpoopyHauntedHouse(input: $input) {
      warningDialog
      msRemaining
      candybagTileId
      currentGp
    }
  }
`;

// ── Subscriptions ────────────────────────────────────────────────────────

export const SPOOPY_SUBMISSION_ADDED = gql`
  subscription SpoopySubmissionAdded($eventId: ID!) {
    spoopySubmissionAdded(eventId: $eventId) { ...SpoopySubmissionFields }
  }
  ${SPOOPY_SUBMISSION_FIELDS}
`;

export const SPOOPY_SUBMISSION_REVIEWED = gql`
  subscription SpoopySubmissionReviewed($eventId: ID!) {
    spoopySubmissionReviewed(eventId: $eventId) { ...SpoopySubmissionFields }
  }
  ${SPOOPY_SUBMISSION_FIELDS}
`;

export const SPOOPY_TEAM_BOARD_UPDATED = gql`
  subscription SpoopyTeamBoardUpdated($teamId: ID!) {
    spoopyTeamBoardUpdated(teamId: $teamId) { ...SpoopyTeamBoardFields }
  }
  ${SPOOPY_TEAM_BOARD_FIELDS}
`;
