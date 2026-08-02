import { gql } from '@apollo/client';

// ============================================================
// FRAGMENTS
// ============================================================

const CLAN_WARS_ITEM_FIELDS = gql`
  fragment CFItemFields on CFItem {
    itemId
    teamId
    eventId
    name
    slot
    rarity
    itemSnapshot
    sourceSubmissionId
    earnedAt
    isEquipped
    isUsed
  }
`;

const CLAN_WARS_TEAM_FIELDS = gql`
  fragment CFTeamFields on CFTeam {
    teamId
    eventId
    teamName
    members {
      discordId
      username
      rsn
      avatar
      role
    }
    officialLoadout
    loadoutLocked
    captainDiscordId
    completedTaskIds
    taskProgress
    numericTaskProgress
  }
`;

const CLAN_WARS_SUBMISSION_FIELDS = gql`
  fragment CFSubmissionFields on CFSubmission {
    submissionId
    eventId
    teamId
    submittedBy
    submittedUsername
    taskId
    taskLabel
    difficulty
    role
    screenshot
    status
    rewardSlot
    rewardItemId
    rewardItem {
      itemId
      name
      slot
      rarity
      itemSnapshot
    }
    reviewedBy
    reviewNote
    reviewedAt
    submittedAt
  }
`;

const CLAN_WARS_BATTLE_STATE_FIELDS = gql`
  fragment CFBattleStateFields on CFBattle {
    battleId
    eventId
    team1Id
    team2Id
    status
    championSnapshots
    battleState
    rngSeed
    winnerId
    startedAt
    endedAt
  }
`;

// ============================================================
// QUERIES
// ============================================================

export const GET_ALL_CLAN_WARS_EVENTS = gql`
  query GetAllCFEvents {
    getAllCFEvents {
      eventId
      eventName
      status
      gatheringStart
      gatheringEnd
      outfittingEnd
      eventConfig
      bracket
      creatorId
      adminIds
      refIds
      difficulty
      createdAt
      teams {
        teamId
        teamName
      }
    }
  }
`;

export const GET_MY_CLAN_WARS_EVENTS = gql`
  query GetMyCFEvents {
    getMyCFEvents {
      eventId
      eventName
      status
      gatheringStart
      gatheringEnd
      outfittingEnd
      eventConfig
      bracket
      creatorId
      adminIds
      refIds
      difficulty
      createdAt
      teams {
        teamId
        teamName
      }
    }
  }
`;

export const GET_CLAN_WARS_EVENT = gql`
  ${CLAN_WARS_TEAM_FIELDS}
  query GetCFEvent($eventId: ID!) {
    getCFEvent(eventId: $eventId) {
      eventId
      eventName
      status
      clanId
      gatheringStart
      gatheringEnd
      outfittingEnd
      eventConfig
      bracket
      creatorId
      adminIds
      refIds
      admins {
        id
        displayName
        username
        rsn
      }
      refs {
        id
        displayName
        username
        rsn
      }
      guildId
      announcementsChannelId
      scheduledGatheringStart
      difficulty
      eventPassword
      createdAt
      teams {
        ...CFTeamFields
      }
      tasks {
        taskId
        label
        description
        difficulty
        role
        isActive
        acceptableItems
        quantity
      }
    }
  }
`;

export const GET_CLAN_WARS_TEAM = gql`
  ${CLAN_WARS_ITEM_FIELDS}
  query GetCFTeam($eventId: ID!, $teamId: ID!) {
    getCFTeam(eventId: $eventId, teamId: $teamId) {
      teamId
      eventId
      teamName
      members { discordId username avatar role }
      officialLoadout
      loadoutLocked
      captainDiscordId
      completedTaskIds
      items {
        ...CFItemFields
      }
    }
  }
`;

export const GET_CLAN_WARS_WAR_CHEST = gql`
  ${CLAN_WARS_ITEM_FIELDS}
  query GetCFWarChest($teamId: ID!) {
    getCFWarChest(teamId: $teamId) {
      ...CFItemFields
    }
  }
`;

export const GET_CLAN_WARS_SUBMISSIONS = gql`
  ${CLAN_WARS_SUBMISSION_FIELDS}
  query GetCFSubmissions($eventId: ID!, $status: CFSubmissionStatus) {
    getCFSubmissions(eventId: $eventId, status: $status) {
      ...CFSubmissionFields
    }
  }
`;

export const GET_CLAN_WARS_SUBMISSION_SUMMARIES = gql`
  query GetCFSubmissionSummaries($eventId: ID!) {
    getCFSubmissionSummaries(eventId: $eventId) {
      taskId
      teamId
      pendingCount
      approvedCount
      deniedCount
    }
  }
`;

export const GET_CLAN_WARS_TASK_SUBMISSIONS = gql`
  ${CLAN_WARS_SUBMISSION_FIELDS}
  query GetCFTaskSubmissions($eventId: ID!, $taskId: String!, $teamId: ID!) {
    getCFTaskSubmissions(eventId: $eventId, taskId: $taskId, teamId: $teamId) {
      ...CFSubmissionFields
    }
  }
`;

export const GET_CLAN_WARS_BATTLE = gql`
  ${CLAN_WARS_BATTLE_STATE_FIELDS}
  query GetCFBattle($battleId: ID!) {
    getCFBattle(battleId: $battleId) {
      ...CFBattleStateFields
      battleLog {
        eventLogId
        turnNumber
        actorTeamId
        action
        rollInputs
        damageDealt
        isCrit
        itemUsedId
        effectApplied
        hpAfter
        narrative
        createdAt
      }
    }
  }
`;

export const GET_CLAN_WARS_TASK_POOL = gql`
  query GetCFTaskPool($eventId: ID!) {
    getCFTaskPool(eventId: $eventId) {
      taskId
      label
      description
      difficulty
      role
      isActive
    }
  }
`;

// ============================================================
// MUTATIONS
// ============================================================

export const CREATE_CLAN_WARS_EVENT = gql`
  mutation CreateCFEvent($input: CreateCFEventInput!) {
    createCFEvent(input: $input) {
      eventId
      eventName
      status
      eventConfig
      creatorId
      adminIds
      createdAt
    }
  }
`;

export const VERIFY_DISCORD_GUILD = gql`
  query VerifyDiscordGuild($guildId: String!) {
    verifyDiscordGuild(guildId: $guildId) {
      success
      guildName
      error
    }
  }
`;

export const UPDATE_CLAN_WARS_EVENT_SETTINGS = gql`
  mutation UpdateCFEventSettings($eventId: ID!, $input: UpdateCFEventSettingsInput!) {
    updateCFEventSettings(eventId: $eventId, input: $input) {
      eventId
      guildId
      announcementsChannelId
      scheduledGatheringStart
    }
  }
`;

export const UPDATE_CLAN_WARS_EVENT_STATUS = gql`
  mutation UpdateCFEventStatus($eventId: ID!, $status: CFEventStatus!) {
    updateCFEventStatus(eventId: $eventId, status: $status) {
      eventId
      status
      gatheringStart
      gatheringEnd
      outfittingEnd
    }
  }
`;

export const DELETE_CLAN_WARS_EVENT = gql`
  mutation DeleteCFEvent($eventId: ID!) {
    deleteCFEvent(eventId: $eventId) {
      success
      message
    }
  }
`;

export const GENERATE_CLAN_WARS_BRACKET = gql`
  mutation GenerateCFBracket($eventId: ID!, $bracketType: String) {
    generateCFBracket(eventId: $eventId, bracketType: $bracketType) {
      eventId
      bracket
    }
  }
`;

export const UPDATE_CLAN_WARS_TEAM_MEMBERS = gql`
  ${CLAN_WARS_TEAM_FIELDS}
  mutation UpdateCFTeamMembers($teamId: ID!, $members: [CFMemberInput!]!) {
    updateCFTeamMembers(teamId: $teamId, members: $members) {
      ...CFTeamFields
    }
  }
`;

export const CREATE_CLAN_WARS_TEAM = gql`
  ${CLAN_WARS_TEAM_FIELDS}
  mutation CreateCFTeam($eventId: ID!, $input: CreateCFTeamInput!) {
    createCFTeam(eventId: $eventId, input: $input) {
      ...CFTeamFields
    }
  }
`;

export const DELETE_CLAN_WARS_TEAM = gql`
  mutation DeleteCFTeam($eventId: ID!, $teamId: ID!) {
    deleteCFTeam(eventId: $eventId, teamId: $teamId) {
      success
      message
    }
  }
`;

export const SET_CLAN_WARS_CAPTAIN = gql`
  mutation SetCFCaptain($teamId: ID!, $discordId: String!) {
    setCFCaptain(teamId: $teamId, discordId: $discordId) {
      teamId
      captainDiscordId
    }
  }
`;

export const ADD_CLAN_WARS_TASK = gql`
  mutation AddCFTask($eventId: ID!, $input: CFTaskInput!) {
    addCFTask(eventId: $eventId, input: $input) {
      taskId
      label
      description
      difficulty
      role
      isActive
    }
  }
`;

export const DELETE_CLAN_WARS_TASK = gql`
  mutation DeleteCFTask($taskId: ID!) {
    deleteCFTask(taskId: $taskId) {
      success
      message
    }
  }
`;

export const CREATE_CLAN_WARS_SUBMISSION = gql`
  mutation CreateCFSubmission($input: CFSubmissionInput!) {
    createCFSubmission(input: $input) {
      submissionId
      eventId
      teamId
      taskId
      taskLabel
      difficulty
      role
      status
      submittedAt
    }
  }
`;

export const JOIN_TASK_IN_PROGRESS = gql`
  mutation JoinTaskInProgress($eventId: ID!, $teamId: ID!, $taskId: ID!) {
    joinTaskInProgress(eventId: $eventId, teamId: $teamId, taskId: $taskId) {
      teamId
      taskProgress
    }
  }
`;

export const SET_TASK_PROGRESS = gql`
  ${CLAN_WARS_TEAM_FIELDS}
  mutation SetTaskProgress($eventId: ID!, $teamId: ID!, $taskId: ID!, $value: Int!) {
    setTaskProgress(eventId: $eventId, teamId: $teamId, taskId: $taskId, value: $value) {
      ...CFTeamFields
    }
  }
`;

export const MARK_TASK_COMPLETE = gql`
  ${CLAN_WARS_TEAM_FIELDS}
  mutation MarkTaskComplete($eventId: ID!, $teamId: ID!, $taskId: ID!) {
    markTaskComplete(eventId: $eventId, teamId: $teamId, taskId: $taskId) {
      ...CFTeamFields
    }
  }
`;

export const LEAVE_TASK_IN_PROGRESS = gql`
  mutation LeaveTaskInProgress($eventId: ID!, $teamId: ID!, $taskId: ID!) {
    leaveTaskInProgress(eventId: $eventId, teamId: $teamId, taskId: $taskId) {
      teamId
      taskProgress
    }
  }
`;

export const REVIEW_CLAN_WARS_SUBMISSION = gql`
  ${CLAN_WARS_SUBMISSION_FIELDS}
  mutation ReviewCFSubmission(
    $submissionId: ID!
    $approved: Boolean!
    $reviewerId: String!
    $rewardSlot: String
    $denialReason: String
  ) {
    reviewCFSubmission(
      submissionId: $submissionId
      approved: $approved
      reviewerId: $reviewerId
      rewardSlot: $rewardSlot
      denialReason: $denialReason
    ) {
      ...CFSubmissionFields
    }
  }
`;

export const CHANGE_SUBMISSION_REWARD_SLOT = gql`
  ${CLAN_WARS_SUBMISSION_FIELDS}
  mutation ChangeSubmissionRewardSlot($submissionId: ID!, $rewardSlot: String!) {
    changeSubmissionRewardSlot(submissionId: $submissionId, rewardSlot: $rewardSlot) {
      ...CFSubmissionFields
    }
  }
`;

export const UNDO_SUBMISSION_APPROVAL = gql`
  ${CLAN_WARS_SUBMISSION_FIELDS}
  mutation UndoSubmissionApproval($submissionId: ID!) {
    undoSubmissionApproval(submissionId: $submissionId) {
      ...CFSubmissionFields
    }
  }
`;

export const UNDO_TASK_COMPLETE = gql`
  ${CLAN_WARS_TEAM_FIELDS}
  mutation UndoTaskComplete($eventId: ID!, $teamId: ID!, $taskId: ID!) {
    undoTaskComplete(eventId: $eventId, teamId: $teamId, taskId: $taskId) {
      ...CFTeamFields
    }
  }
`;

export const SAVE_OFFICIAL_LOADOUT = gql`
  mutation SaveOfficialLoadout($teamId: ID!, $loadout: JSON!) {
    saveOfficialLoadout(teamId: $teamId, loadout: $loadout) {
      teamId
      officialLoadout
      loadoutLocked
    }
  }
`;

export const LOCK_CLAN_WARS_LOADOUT = gql`
  mutation LockCFLoadout($teamId: ID!) {
    lockCFLoadout(teamId: $teamId) {
      teamId
      loadoutLocked
    }
  }
`;

export const ADMIN_FORCE_EVENT_STATUS = gql`
  mutation AdminForceEventStatus($eventId: ID!, $status: String!) {
    adminForceEventStatus(eventId: $eventId, status: $status) {
      eventId
      status
      gatheringStart
      gatheringEnd
      outfittingEnd
    }
  }
`;

export const ADMIN_LOCK_ALL_LOADOUTS = gql`
  mutation AdminLockAllLoadouts($eventId: ID!) {
    adminLockAllLoadouts(eventId: $eventId) {
      teamId
      teamName
      loadoutLocked
    }
  }
`;

export const ADD_CLAN_WARS_ADMIN = gql`
  mutation AddCFAdmin($eventId: ID!, $userId: ID!) {
    addCFAdmin(eventId: $eventId, userId: $userId) {
      eventId
      adminIds
      admins {
        id
        displayName
        username
        rsn
      }
    }
  }
`;

export const REMOVE_CLAN_WARS_ADMIN = gql`
  mutation RemoveCFAdmin($eventId: ID!, $userId: ID!) {
    removeCFAdmin(eventId: $eventId, userId: $userId) {
      eventId
      adminIds
      admins {
        id
        displayName
        username
        rsn
      }
    }
  }
`;

export const ADD_CLAN_WARS_REF = gql`
  mutation AddCFRef($eventId: ID!, $userId: ID!) {
    addCFRef(eventId: $eventId, userId: $userId) {
      eventId
      refIds
      refs {
        id
        displayName
        username
        rsn
      }
    }
  }
`;

export const REMOVE_CLAN_WARS_REF = gql`
  mutation RemoveCFRef($eventId: ID!, $userId: ID!) {
    removeCFRef(eventId: $eventId, userId: $userId) {
      eventId
      refIds
      refs {
        id
        displayName
        username
        rsn
      }
    }
  }
`;

export const SET_CAPTAIN_READY = gql`
  mutation SetCaptainReady($eventId: ID!, $teamId: ID!) {
    setCaptainReady(eventId: $eventId, teamId: $teamId) {
      eventId
      bracket
    }
  }
`;

export const START_CLAN_WARS_BATTLE = gql`
  ${CLAN_WARS_BATTLE_STATE_FIELDS}
  mutation StartCFBattle($eventId: ID!, $team1Id: ID!, $team2Id: ID!) {
    startCFBattle(eventId: $eventId, team1Id: $team1Id, team2Id: $team2Id) {
      ...CFBattleStateFields
    }
  }
`;

export const SUBMIT_BATTLE_ACTION = gql`
  ${CLAN_WARS_BATTLE_STATE_FIELDS}
  mutation SubmitBattleAction(
    $battleId: ID!
    $teamId: ID!
    $action: CFBattleAction!
    $itemId: ID
  ) {
    submitBattleAction(
      battleId: $battleId
      teamId: $teamId
      action: $action
      itemId: $itemId
    ) {
      ...CFBattleStateFields
    }
  }
`;

export const DEV_AUTO_BATTLE = gql`
  ${CLAN_WARS_BATTLE_STATE_FIELDS}
  mutation DevAutoBattle($battleId: ID!) {
    devAutoBattle(battleId: $battleId) {
      ...CFBattleStateFields
    }
  }
`;

export const DEV_SIMULATE_NEXT_MATCH = gql`
  ${CLAN_WARS_BATTLE_STATE_FIELDS}
  mutation DevSimulateNextMatch($eventId: ID!) {
    devSimulateNextMatch(eventId: $eventId) {
      ...CFBattleStateFields
    }
  }
`;

export const DEV_SEED_CF_EVENT = gql`
  mutation DevSeedCfEvent {
    devSeedCfEvent
  }
`;

// ============================================================
// SUBSCRIPTIONS
// ============================================================

export const CLAN_WARS_BATTLE_UPDATED = gql`
  ${CLAN_WARS_BATTLE_STATE_FIELDS}
  subscription CFBattleUpdated($battleId: ID!) {
    cfBattleUpdated(battleId: $battleId) {
      battleId
      battle {
        ...CFBattleStateFields
      }
      latestEvent {
        eventLogId
        turnNumber
        actorTeamId
        action
        damageDealt
        isCrit
        effectApplied
        hpAfter
        narrative
        createdAt
      }
    }
  }
`;

export const SEND_BATTLE_EMOTE = gql`
  mutation SendBattleEmote($battleId: ID!, $emote: String!) {
    sendBattleEmote(battleId: $battleId, emote: $emote)
  }
`;

export const BATTLE_EMOTE_RECEIVED = gql`
  subscription BattleEmoteReceived($battleId: ID!) {
    battleEmoteReceived(battleId: $battleId) {
      battleId
      emote
    }
  }
`;

export const CLAN_WARS_SUBMISSION_ADDED = gql`
  ${CLAN_WARS_SUBMISSION_FIELDS}
  subscription CFSubmissionAdded($eventId: ID!) {
    cfSubmissionAdded(eventId: $eventId) {
      ...CFSubmissionFields
    }
  }
`;

export const CLAN_WARS_SUBMISSION_REVIEWED = gql`
  ${CLAN_WARS_SUBMISSION_FIELDS}
  subscription CFSubmissionReviewed($eventId: ID!) {
    cfSubmissionReviewed(eventId: $eventId) {
      ...CFSubmissionFields
    }
  }
`;

const CLAN_WARS_PRESCREENSHOT_FIELDS = gql`
  fragment CFPreScreenshotFields on CFPreScreenshot {
    preScreenshotId
    eventId
    teamId
    taskId
    taskLabel
    submittedBy
    submittedUsername
    screenshotUrl
    channelId
    messageId
    submittedAt
  }
`;

export const GET_CLAN_WARS_PRE_SCREENSHOTS = gql`
  ${CLAN_WARS_PRESCREENSHOT_FIELDS}
  query GetCFPreScreenshots($eventId: ID!) {
    getCFPreScreenshots(eventId: $eventId) {
      ...CFPreScreenshotFields
    }
  }
`;

export const CLAN_WARS_PRESCREENSHOT_ADDED = gql`
  ${CLAN_WARS_PRESCREENSHOT_FIELDS}
  subscription CFPreScreenshotAdded($eventId: ID!) {
    cfPreScreenshotAdded(eventId: $eventId) {
      ...CFPreScreenshotFields
    }
  }
`;

export const CLAN_WARS_EVENT_UPDATED = gql`
  subscription CFEventUpdated($eventId: ID!) {
    cfEventUpdated(eventId: $eventId) {
      eventId
      status
    }
  }
`;

export const GET_BATTLE_VIEWER_COUNT = gql`
  query GetBattleViewerCount($eventId: ID!) {
    getBattleViewerCount(eventId: $eventId)
  }
`;

export const JOIN_BATTLE_VIEW = gql`
  mutation JoinBattleView($eventId: ID!) {
    joinBattleView(eventId: $eventId)
  }
`;

export const LEAVE_BATTLE_VIEW = gql`
  mutation LeaveBattleView($eventId: ID!) {
    leaveBattleView(eventId: $eventId)
  }
`;

export const BATTLE_VIEWERS_UPDATED = gql`
  subscription BattleViewersUpdated($eventId: ID!) {
    battleViewersUpdated(eventId: $eventId)
  }
`;
