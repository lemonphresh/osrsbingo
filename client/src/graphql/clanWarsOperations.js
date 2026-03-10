import { gql } from '@apollo/client';

// ============================================================
// FRAGMENTS
// ============================================================

const CLAN_WARS_ITEM_FIELDS = gql`
  fragment ClanWarsItemFields on ClanWarsItem {
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
  fragment ClanWarsTeamFields on ClanWarsTeam {
    teamId
    eventId
    teamName
    members {
      discordId
      username
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
  fragment ClanWarsSubmissionFields on ClanWarsSubmission {
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
  fragment ClanWarsBattleStateFields on ClanWarsBattle {
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
  query GetAllClanWarsEvents {
    getAllClanWarsEvents {
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
  query GetMyClanWarsEvents {
    getMyClanWarsEvents {
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
  query GetClanWarsEvent($eventId: ID!) {
    getClanWarsEvent(eventId: $eventId) {
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
      guildId
      difficulty
      createdAt
      teams {
        ...ClanWarsTeamFields
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
  query GetClanWarsTeam($eventId: ID!, $teamId: ID!) {
    getClanWarsTeam(eventId: $eventId, teamId: $teamId) {
      teamId
      eventId
      teamName
      members { discordId username avatar role }
      officialLoadout
      loadoutLocked
      captainDiscordId
      completedTaskIds
      items {
        ...ClanWarsItemFields
      }
    }
  }
`;

export const GET_CLAN_WARS_WAR_CHEST = gql`
  ${CLAN_WARS_ITEM_FIELDS}
  query GetClanWarsWarChest($teamId: ID!) {
    getClanWarsWarChest(teamId: $teamId) {
      ...ClanWarsItemFields
    }
  }
`;

export const GET_CLAN_WARS_SUBMISSIONS = gql`
  ${CLAN_WARS_SUBMISSION_FIELDS}
  query GetClanWarsSubmissions($eventId: ID!, $status: ClanWarsSubmissionStatus) {
    getClanWarsSubmissions(eventId: $eventId, status: $status) {
      ...ClanWarsSubmissionFields
    }
  }
`;

export const GET_CLAN_WARS_BATTLE = gql`
  ${CLAN_WARS_BATTLE_STATE_FIELDS}
  query GetClanWarsBattle($battleId: ID!) {
    getClanWarsBattle(battleId: $battleId) {
      ...ClanWarsBattleStateFields
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
  query GetClanWarsTaskPool($eventId: ID!) {
    getClanWarsTaskPool(eventId: $eventId) {
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
  mutation CreateClanWarsEvent($input: CreateClanWarsEventInput!) {
    createClanWarsEvent(input: $input) {
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
  mutation UpdateClanWarsEventSettings($eventId: ID!, $input: UpdateClanWarsEventSettingsInput!) {
    updateClanWarsEventSettings(eventId: $eventId, input: $input) {
      eventId
      guildId
    }
  }
`;

export const UPDATE_CLAN_WARS_EVENT_STATUS = gql`
  mutation UpdateClanWarsEventStatus($eventId: ID!, $status: ClanWarsEventStatus!) {
    updateClanWarsEventStatus(eventId: $eventId, status: $status) {
      eventId
      status
      gatheringStart
      gatheringEnd
      outfittingEnd
    }
  }
`;

export const DELETE_CLAN_WARS_EVENT = gql`
  mutation DeleteClanWarsEvent($eventId: ID!) {
    deleteClanWarsEvent(eventId: $eventId) {
      success
      message
    }
  }
`;

export const GENERATE_CLAN_WARS_BRACKET = gql`
  mutation GenerateClanWarsBracket($eventId: ID!) {
    generateClanWarsBracket(eventId: $eventId) {
      eventId
      bracket
    }
  }
`;

export const UPDATE_CLAN_WARS_TEAM_MEMBERS = gql`
  ${CLAN_WARS_TEAM_FIELDS}
  mutation UpdateClanWarsTeamMembers($teamId: ID!, $members: [ClanWarsMemberInput!]!) {
    updateClanWarsTeamMembers(teamId: $teamId, members: $members) {
      ...ClanWarsTeamFields
    }
  }
`;

export const CREATE_CLAN_WARS_TEAM = gql`
  ${CLAN_WARS_TEAM_FIELDS}
  mutation CreateClanWarsTeam($eventId: ID!, $input: CreateClanWarsTeamInput!) {
    createClanWarsTeam(eventId: $eventId, input: $input) {
      ...ClanWarsTeamFields
    }
  }
`;

export const DELETE_CLAN_WARS_TEAM = gql`
  mutation DeleteClanWarsTeam($eventId: ID!, $teamId: ID!) {
    deleteClanWarsTeam(eventId: $eventId, teamId: $teamId) {
      success
      message
    }
  }
`;

export const SET_CLAN_WARS_CAPTAIN = gql`
  mutation SetClanWarsCaptain($teamId: ID!, $discordId: String!) {
    setClanWarsCaptain(teamId: $teamId, discordId: $discordId) {
      teamId
      captainDiscordId
    }
  }
`;

export const ADD_CLAN_WARS_TASK = gql`
  mutation AddClanWarsTask($eventId: ID!, $input: ClanWarsTaskInput!) {
    addClanWarsTask(eventId: $eventId, input: $input) {
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
  mutation DeleteClanWarsTask($taskId: ID!) {
    deleteClanWarsTask(taskId: $taskId) {
      success
      message
    }
  }
`;

export const CREATE_CLAN_WARS_SUBMISSION = gql`
  mutation CreateClanWarsSubmission($input: ClanWarsSubmissionInput!) {
    createClanWarsSubmission(input: $input) {
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
      ...ClanWarsTeamFields
    }
  }
`;

export const MARK_TASK_COMPLETE = gql`
  ${CLAN_WARS_TEAM_FIELDS}
  mutation MarkTaskComplete($eventId: ID!, $teamId: ID!, $taskId: ID!) {
    markTaskComplete(eventId: $eventId, teamId: $teamId, taskId: $taskId) {
      ...ClanWarsTeamFields
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
  mutation ReviewClanWarsSubmission(
    $submissionId: ID!
    $approved: Boolean!
    $reviewerId: String!
    $rewardSlot: String
    $denialReason: String
  ) {
    reviewClanWarsSubmission(
      submissionId: $submissionId
      approved: $approved
      reviewerId: $reviewerId
      rewardSlot: $rewardSlot
      denialReason: $denialReason
    ) {
      ...ClanWarsSubmissionFields
    }
  }
`;

export const CHANGE_SUBMISSION_REWARD_SLOT = gql`
  ${CLAN_WARS_SUBMISSION_FIELDS}
  mutation ChangeSubmissionRewardSlot($submissionId: ID!, $rewardSlot: String!) {
    changeSubmissionRewardSlot(submissionId: $submissionId, rewardSlot: $rewardSlot) {
      ...ClanWarsSubmissionFields
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
  mutation LockClanWarsLoadout($teamId: ID!) {
    lockClanWarsLoadout(teamId: $teamId) {
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
  mutation StartClanWarsBattle($eventId: ID!, $team1Id: ID!, $team2Id: ID!) {
    startClanWarsBattle(eventId: $eventId, team1Id: $team1Id, team2Id: $team2Id) {
      ...ClanWarsBattleStateFields
    }
  }
`;

export const SUBMIT_BATTLE_ACTION = gql`
  ${CLAN_WARS_BATTLE_STATE_FIELDS}
  mutation SubmitBattleAction(
    $battleId: ID!
    $teamId: ID!
    $action: ClanWarsBattleAction!
    $itemId: ID
  ) {
    submitBattleAction(
      battleId: $battleId
      teamId: $teamId
      action: $action
      itemId: $itemId
    ) {
      ...ClanWarsBattleStateFields
    }
  }
`;

export const DEV_AUTO_BATTLE = gql`
  ${CLAN_WARS_BATTLE_STATE_FIELDS}
  mutation DevAutoBattle($battleId: ID!) {
    devAutoBattle(battleId: $battleId) {
      ...ClanWarsBattleStateFields
    }
  }
`;

export const DEV_SIMULATE_NEXT_MATCH = gql`
  ${CLAN_WARS_BATTLE_STATE_FIELDS}
  mutation DevSimulateNextMatch($eventId: ID!) {
    devSimulateNextMatch(eventId: $eventId) {
      ...ClanWarsBattleStateFields
    }
  }
`;

// ============================================================
// SUBSCRIPTIONS
// ============================================================

export const CLAN_WARS_BATTLE_UPDATED = gql`
  ${CLAN_WARS_BATTLE_STATE_FIELDS}
  subscription ClanWarsBattleUpdated($battleId: ID!) {
    clanWarsBattleUpdated(battleId: $battleId) {
      battleId
      battle {
        ...ClanWarsBattleStateFields
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
  subscription ClanWarsSubmissionAdded($eventId: ID!) {
    clanWarsSubmissionAdded(eventId: $eventId) {
      ...ClanWarsSubmissionFields
    }
  }
`;

export const CLAN_WARS_SUBMISSION_REVIEWED = gql`
  ${CLAN_WARS_SUBMISSION_FIELDS}
  subscription ClanWarsSubmissionReviewed($eventId: ID!) {
    clanWarsSubmissionReviewed(eventId: $eventId) {
      ...ClanWarsSubmissionFields
    }
  }
`;
