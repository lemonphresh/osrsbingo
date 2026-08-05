import { gql } from '@apollo/client';

// ── Fragments ──────────────────────────────────────────────────────────────

const BS_TASK_FIELDS = gql`
  fragment BSTaskFields on BSTask {
    taskId
    label
    bossOrSkill
    metricType
    metricTarget
    metricUnit
    metricLabel
    validDrops
    womMetric
    description
    isActive
  }
`;

const BS_TILE_FIELDS = gql`
  fragment BSTileFields on BSTile {
    tileId
    boardId
    row
    col
    shipType
    cellIndex
    taskId
    task { ...BSTaskFields }
    isShot
    taskCompleted
    skipped
    shotAt
    taskCompletedAt
  }
  ${BS_TASK_FIELDS}
`;

const BS_SHIP_PLACEMENT_FIELDS = gql`
  fragment BSShipPlacementFields on BSShipPlacement {
    placementId
    boardId
    shipType
    orientation
    startRow
    startCol
  }
`;

const BS_BOARD_FIELDS = gql`
  fragment BSBoardFields on BSBoard {
    boardId
    eventId
    teamId
    isPlacementLocked
    shipPlacements { ...BSShipPlacementFields }
    tiles { ...BSTileFields }
  }
  ${BS_SHIP_PLACEMENT_FIELDS}
  ${BS_TILE_FIELDS}
`;

const BS_TEAM_FIELDS = gql`
  fragment BSTeamFields on BSTeam {
    teamId
    eventId
    teamName
    color
    members
    skipTokens
    lastShotAt
  }
`;

const BS_EVENT_FIELDS = gql`
  fragment BSEventFields on BSEvent {
    eventId
    eventName
    status
    placementPhaseHours
    cooldownMinutes
    placementStartsAt
    placementEndsAt
    creatorId
    adminIds
    refIds
    guildId
    teams { ...BSTeamFields }
    tasks { ...BSTaskFields }
    shipTemplates {
      templateId
      shipType
      cellIndex
      taskId
      task { ...BSTaskFields }
    }
  }
  ${BS_TEAM_FIELDS}
  ${BS_TASK_FIELDS}
`;

// ── Queries ────────────────────────────────────────────────────────────────

export const GET_BS_EVENT = gql`
  query GetBSEvent($eventId: ID!) {
    getBSEvent(eventId: $eventId) {
      ...BSEventFields
    }
  }
  ${BS_EVENT_FIELDS}
`;

export const GET_ALL_BS_EVENTS = gql`
  query GetAllBSEvents {
    getAllBSEvents {
      eventId
      eventName
      status
      placementPhaseHours
      cooldownMinutes
      teams { teamId teamName color }
    }
  }
`;

export const GET_BS_BOARD = gql`
  query GetBSBoard($boardId: ID!) {
    getBSBoard(boardId: $boardId) {
      ...BSBoardFields
    }
  }
  ${BS_BOARD_FIELDS}
`;

export const GET_BS_SHOT_LOG = gql`
  query GetBSShotLog($eventId: ID!) {
    getBSShotLog(eventId: $eventId) {
      shotId
      firingTeamId
      targetBoardId
      row
      col
      result
      taskId
      shotAt
    }
  }
`;

// ── Mutations ──────────────────────────────────────────────────────────────

export const CREATE_BS_EVENT = gql`
  mutation CreateBSEvent($input: CreateBSEventInput!) {
    createBSEvent(input: $input) {
      ...BSEventFields
    }
  }
  ${BS_EVENT_FIELDS}
`;

export const DELETE_BS_EVENT = gql`
  mutation DeleteBSEvent($eventId: ID!) {
    deleteBSEvent(eventId: $eventId) {
      success
      message
    }
  }
`;

export const ADD_BS_REF = gql`
  mutation AddBSRef($eventId: ID!, $userId: ID!) {
    addBSRef(eventId: $eventId, userId: $userId) {
      eventId
      refIds
      refs { id displayName username }
    }
  }
`;

export const REMOVE_BS_REF = gql`
  mutation RemoveBSRef($eventId: ID!, $userId: ID!) {
    removeBSRef(eventId: $eventId, userId: $userId) {
      eventId
      refIds
      refs { id displayName username }
    }
  }
`;

export const ADD_BS_TEAM = gql`
  mutation AddBSTeam($eventId: ID!, $input: CreateBSTeamInput!) {
    addBSTeam(eventId: $eventId, input: $input) {
      ...BSTeamFields
    }
  }
  ${BS_TEAM_FIELDS}
`;

export const UPDATE_BS_TEAM_MEMBERS = gql`
  mutation UpdateBSTeamMembers($teamId: ID!, $members: [String!]!) {
    updateBSTeamMembers(teamId: $teamId, members: $members) {
      teamId
      members
    }
  }
`;

export const ADD_BS_TASK = gql`
  mutation AddBSTask($eventId: ID!, $input: BSTaskInput!) {
    addBSTask(eventId: $eventId, input: $input) {
      ...BSTaskFields
    }
  }
  ${BS_TASK_FIELDS}
`;

export const UPDATE_BS_TASK = gql`
  mutation UpdateBSTask($taskId: ID!, $input: BSTaskInput!) {
    updateBSTask(taskId: $taskId, input: $input) {
      ...BSTaskFields
    }
  }
  ${BS_TASK_FIELDS}
`;

export const REMOVE_BS_TASK = gql`
  mutation RemoveBSTask($taskId: ID!) {
    removeBSTask(taskId: $taskId)
  }
`;

export const SET_BS_SHIP_TEMPLATE = gql`
  mutation SetBSShipTemplate($eventId: ID!, $shipType: BSShipType!, $cellIndex: Int!, $taskId: ID!) {
    setBSShipTemplate(eventId: $eventId, shipType: $shipType, cellIndex: $cellIndex, taskId: $taskId) {
      templateId
      shipType
      cellIndex
      taskId
      task { ...BSTaskFields }
    }
  }
  ${BS_TASK_FIELDS}
`;

export const START_BS_PLACEMENT_PHASE = gql`
  mutation StartBSPlacementPhase($eventId: ID!) {
    startBSPlacementPhase(eventId: $eventId) {
      eventId
      status
      placementStartsAt
      placementEndsAt
    }
  }
`;

export const PLACE_BS_SHIP = gql`
  mutation PlaceBSShip($boardId: ID!, $input: BSShipPlacementInput!) {
    placeBSShip(boardId: $boardId, input: $input) {
      ...BSShipPlacementFields
    }
  }
  ${BS_SHIP_PLACEMENT_FIELDS}
`;

export const LOCK_BS_BOARD = gql`
  mutation LockBSBoard($boardId: ID!) {
    lockBSBoard(boardId: $boardId) {
      boardId
      isPlacementLocked
    }
  }
`;

export const START_BS_GAME = gql`
  mutation StartBSGame($eventId: ID!) {
    startBSGame(eventId: $eventId) {
      eventId
      status
    }
  }
`;

export const FIRE_BS = gql`
  mutation FireBS($eventId: ID!, $targetTeamId: ID!, $row: Int!, $col: Int!) {
    fireBS(eventId: $eventId, targetTeamId: $targetTeamId, row: $row, col: $col) {
      shotId
      firingTeamId
      targetBoardId
      row
      col
      result
      taskId
      shotAt
    }
  }
`;

export const COMPLETE_BS_TILE = gql`
  mutation CompleteBSTile($tileId: ID!) {
    completeBSTile(tileId: $tileId) {
      tileId
      taskCompleted
      taskCompletedAt
    }
  }
`;

export const SKIP_BS_TILE = gql`
  mutation SkipBSTile($tileId: ID!) {
    skipBSTile(tileId: $tileId) {
      tileId
      skipped
      taskCompletedAt
    }
  }
`;

export const ADD_BS_SKIP_TOKENS = gql`
  mutation AddBSSkipTokens($teamId: ID!, $count: Int!) {
    addBSSkipTokens(teamId: $teamId, count: $count) {
      teamId
      skipTokens
    }
  }
`;

export const UPDATE_BS_TILE_TASK = gql`
  mutation UpdateBSTileTask($tileId: ID!, $taskId: ID!) {
    updateBSTileTask(tileId: $tileId, taskId: $taskId) {
      tileId
      taskId
      task { ...BSTaskFields }
    }
  }
  ${BS_TASK_FIELDS}
`;

// ── Subscriptions ──────────────────────────────────────────────────────────

export const BS_SHOT_FIRED = gql`
  subscription BSShotFired($eventId: ID!) {
    bsShotFired(eventId: $eventId) {
      shotId
      firingTeamId
      targetBoardId
      row
      col
      result
      taskId
      shotAt
    }
  }
`;

export const BS_BOARD_UPDATED = gql`
  subscription BSBoardUpdated($eventId: ID!) {
    bsBoardUpdated(eventId: $eventId) {
      boardId
      teamId
    }
  }
`;

export const GET_BS_VIEWER_COUNT = gql`
  query GetBSViewerCount($eventId: ID!) {
    getBSViewerCount(eventId: $eventId)
  }
`;

export const JOIN_BS_VIEW = gql`
  mutation JoinBSView($eventId: ID!) {
    joinBSView(eventId: $eventId)
  }
`;

export const LEAVE_BS_VIEW = gql`
  mutation LeaveBSView($eventId: ID!) {
    leaveBSView(eventId: $eventId)
  }
`;

export const BS_VIEWERS_UPDATED = gql`
  subscription BSViewersUpdated($eventId: ID!) {
    bsViewersUpdated(eventId: $eventId)
  }
`;

export const BS_TILE_UPDATED = gql`
  subscription BSTileUpdated($boardId: ID!) {
    bsTileUpdated(boardId: $boardId) {
      tileId
      taskCompleted
      skipped
      progress
      taskCompletedAt
    }
  }
`;

// ── Fragments ──────────────────────────────────────────────────────────────

const BS_SUBMISSION_FIELDS = gql`
  fragment BSSubmissionFields on BSSubmission {
    submissionId
    id
    eventId
    tileId
    boardId
    teamId
    tileLabel
    discordUserId
    discordUsername
    screenshotUrl
    channelId
    discordMessageId
    status
    reviewedBy
    reviewedAt
    denialReason
    submittedAt
    submittedBy
    screenshot
    reviewNote
    tile { tileId row col progress taskCompleted }
    team { teamId teamName color discordChannelId }
  }
`;

// ── Submission queries / mutations / subscriptions ─────────────────────────

export const GET_BS_SUBMISSIONS = gql`
  query GetBSSubmissions($eventId: ID!, $status: BSSubmissionStatus, $tileId: ID) {
    submissions: getBSSubmissions(eventId: $eventId, status: $status, tileId: $tileId) {
      ...BSSubmissionFields
    }
  }
  ${BS_SUBMISSION_FIELDS}
`;

export const CREATE_BS_SUBMISSION = gql`
  mutation CreateBSSubmission($input: CreateBSSubmissionInput!) {
    createBSSubmission(input: $input) {
      ...BSSubmissionFields
    }
  }
  ${BS_SUBMISSION_FIELDS}
`;

export const REVIEW_BS_SUBMISSION = gql`
  mutation ReviewBSSubmission($submissionId: ID!, $approved: Boolean!, $denialReason: String) {
    reviewBSSubmission(submissionId: $submissionId, approved: $approved, denialReason: $denialReason) {
      ...BSSubmissionFields
    }
  }
  ${BS_SUBMISSION_FIELDS}
`;

export const SET_BS_TILE_PROGRESS = gql`
  mutation SetBSTileProgress($tileId: ID!, $progress: Int!) {
    setBSTileProgress(tileId: $tileId, progress: $progress) {
      tileId
      progress
    }
  }
`;

export const BS_SUBMISSION_ADDED = gql`
  subscription BSSubmissionAdded($eventId: ID!) {
    bsSubmissionAdded(eventId: $eventId) {
      ...BSSubmissionFields
    }
  }
  ${BS_SUBMISSION_FIELDS}
`;

export const BS_SUBMISSION_REVIEWED = gql`
  subscription BSSubmissionReviewed($eventId: ID!) {
    bsSubmissionReviewed(eventId: $eventId) {
      submissionId
      status
    }
  }
`;

// ── Shot Proposals ─────────────────────────────────────────────────────────

const BS_PROPOSAL_FIELDS = gql`
  fragment BSProposalFields on BSProposal {
    proposalId
    eventId
    firingTeamId
    targetTeamId
    row
    col
    proposedBy
    approvals
    rejections
    status
    threshold
    proposedAt
  }
`;

export const GET_ACTIVE_BS_PROPOSAL = gql`
  query GetActiveBSProposal($teamId: ID!) {
    getActiveBSProposal(teamId: $teamId) {
      ...BSProposalFields
    }
  }
  ${BS_PROPOSAL_FIELDS}
`;

export const PROPOSE_BS_SHOT = gql`
  mutation ProposeBSShot($eventId: ID!, $row: Int!, $col: Int!) {
    proposeBSShot(eventId: $eventId, row: $row, col: $col) {
      ...BSProposalFields
    }
  }
  ${BS_PROPOSAL_FIELDS}
`;

export const VOTE_ON_BS_PROPOSAL = gql`
  mutation VoteOnBSProposal($proposalId: ID!, $approve: Boolean!) {
    voteOnBSProposal(proposalId: $proposalId, approve: $approve) {
      ...BSProposalFields
    }
  }
  ${BS_PROPOSAL_FIELDS}
`;

export const CLEAR_BS_PROPOSAL = gql`
  mutation ClearBSProposal($teamId: ID!) {
    clearBSProposal(teamId: $teamId)
  }
`;

export const BS_PROPOSAL_UPDATED = gql`
  subscription BSProposalUpdated($teamId: ID!) {
    bsProposalUpdated(teamId: $teamId) {
      ...BSProposalFields
    }
  }
  ${BS_PROPOSAL_FIELDS}
`;
