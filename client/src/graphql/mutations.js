import { gql } from '@apollo/client';

// ============================================================
// FRAGMENTS (Reusable field selections)
// ============================================================

const BONUS_SETTINGS_FIELDS = gql`
  fragment BonusSettingsFields on BonusSettings {
    allowDiagonals
    horizontalBonus
    verticalBonus
    diagonalBonus
    blackoutBonus
  }
`;

// const USER_BASIC_FIELDS = gql`
//   fragment UserBasicFields on User {
//     id
//     displayName
//     username
//     rsn
//   }
// `;

// const BOARD_BASIC_FIELDS = gql`
//   fragment BoardBasicFields on BingoBoard {
//     id
//     name
//     category
//     type
//     description
//     layout
//     isPublic
//     theme
//   }
// `;

// const TEAM_PROGRESS_FIELDS = gql`
//   fragment TeamProgressFields on TreasureTeam {
//     teamId
//     teamName
//     currentPot
//     keysHeld
//     completedNodes
//     availableNodes
//   }
// `;

// const TEAM_BUFF_FIELDS = gql`
//   fragment TeamBuffFields on TreasureTeam {
//     teamId
//     activeBuffs
//     buffHistory
//   }
// `;

// ============================================================
// USER & AUTHENTICATION
// ============================================================

export const CREATE_USER = gql`
  mutation CreateUser(
    $username: String!
    $displayName: String!
    $password: String!
    $rsn: String
    $permissions: String!
  ) {
    createUser(
      username: $username
      password: $password
      displayName: $displayName
      rsn: $rsn
      permissions: $permissions
    ) {
      id
      admin
      displayName
      username
      rsn
      permissions
      token
    }
  }
`;

export const LOGIN_USER = gql`
  ${BONUS_SETTINGS_FIELDS}
  mutation LoginUser($username: String!, $password: String!) {
    loginUser(username: $username, password: $password) {
      token
      user {
        id
        admin
        displayName
        username
        rsn
        editorBoards {
          id
          name
          theme
          category
          type
          description
          layout
          isPublic
          tiles {
            id
            isComplete
          }
          bonusSettings {
            ...BonusSettingsFields
          }
        }
      }
    }
  }
`;

export const UPDATE_USER = gql`
  ${BONUS_SETTINGS_FIELDS}
  mutation UpdateUser($id: ID!, $input: UserUpdateInput!) {
    updateUser(id: $id, input: $input) {
      id
      admin
      displayName
      username
      rsn
      editorBoards {
        id
        name
        category
        theme
        type
        description
        layout
        isPublic
        tiles {
          id
          isComplete
        }
        bonusSettings {
          ...BonusSettingsFields
        }
      }
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      success
      message
    }
  }
`;

// ============================================================
// DISCORD ACCOUNT LINKING
// ============================================================

export const LINK_DISCORD_ACCOUNT = gql`
  mutation LinkDiscordAccount($userId: ID!, $discordUserId: String!) {
    linkDiscordAccount(userId: $userId, discordUserId: $discordUserId) {
      id
      discordUserId
      displayName
    }
  }
`;

export const UNLINK_DISCORD_ACCOUNT = gql`
  mutation UnlinkDiscordAccount($userId: ID!) {
    unlinkDiscordAccount(userId: $userId) {
      id
      discordUserId
      displayName
    }
  }
`;

// ============================================================
// BINGO BOARDS
// ============================================================

export const CREATE_BOARD = gql`
  ${BONUS_SETTINGS_FIELDS}
  mutation CreateBingoBoard($input: CreateBingoBoardInput!) {
    createBingoBoard(input: $input) {
      id
      name
      category
      description
      type
      isPublic
      theme
      editors {
        id
        displayName
        username
        rsn
      }
      team
      layout
      bonusSettings {
        ...BonusSettingsFields
      }
      tiles {
        id
        name
        value
      }
    }
  }
`;

export const UPDATE_BOARD = gql`
  ${BONUS_SETTINGS_FIELDS}
  mutation UpdateBingoBoard($id: ID!, $input: UpdateBingoBoardInput!) {
    updateBingoBoard(id: $id, input: $input) {
      id
      name
      type
      category
      description
      theme
      layout
      isPublic
      bonusSettings {
        ...BonusSettingsFields
      }
    }
  }
`;

export const DELETE_BOARD = gql`
  mutation DeleteBingoBoard($id: ID!) {
    deleteBingoBoard(id: $id) {
      success
      message
    }
  }
`;

export const DUPLICATE_BINGO_BOARD = gql`
  ${BONUS_SETTINGS_FIELDS}
  mutation DuplicateBingoBoard($boardId: ID!) {
    duplicateBingoBoard(boardId: $boardId) {
      id
      name
      category
      type
      layout
      isPublic
      theme
      bonusSettings {
        ...BonusSettingsFields
      }
      tiles {
        id
        name
        isComplete
        value
      }
    }
  }
`;

export const SHUFFLE_BINGO_BOARD_LAYOUT = gql`
  ${BONUS_SETTINGS_FIELDS}
  mutation ShuffleBingoBoardLayout($boardId: ID!) {
    shuffleBingoBoardLayout(boardId: $boardId) {
      id
      name
      category
      type
      layout
      isPublic
      theme
      bonusSettings {
        ...BonusSettingsFields
      }
      tiles {
        id
        name
        isComplete
        value
      }
    }
  }
`;

export const REPLACE_BINGO_BOARD_LAYOUT = gql`
  ${BONUS_SETTINGS_FIELDS}
  mutation ReplaceLayout($boardId: ID!, $newType: String!) {
    replaceLayout(boardId: $boardId, newType: $newType) {
      id
      name
      category
      type
      layout
      theme
      isPublic
      bonusSettings {
        ...BonusSettingsFields
      }
      tiles {
        id
        name
        isComplete
        value
      }
    }
  }
`;

// ============================================================
// BINGO TILES
// ============================================================

export const UPDATE_TILE = gql`
  mutation EditBingoTile($id: ID!, $input: UpdateBingoTileInput!) {
    editBingoTile(id: $id, input: $input) {
      id
      isComplete
      name
      icon
      dateCompleted
      completedBy
      board
      value
    }
  }
`;

// ============================================================
// BOARD EDITORS & INVITATIONS
// ============================================================

export const UPDATE_BOARD_EDITORS = gql`
  mutation UpdateBoardEditors($boardId: ID!, $editorIds: [ID!]!) {
    updateBoardEditors(boardId: $boardId, editorIds: $editorIds) {
      id
      name
      editors {
        id
        displayName
        username
        rsn
      }
    }
  }
`;

export const SEND_EDITOR_INVITATIONS = gql`
  mutation SendEditorInvitations($boardId: ID!, $invitedUserIds: [ID!]!) {
    sendEditorInvitations(boardId: $boardId, invitedUserIds: $invitedUserIds) {
      success
      message
    }
  }
`;

export const RESPOND_TO_INVITATION = gql`
  mutation RespondToInvitation($invitationId: ID!, $response: String!) {
    respondToInvitation(invitationId: $invitationId, response: $response) {
      id
      status
    }
  }
`;

// ============================================================
// CALENDAR EVENTS
// ============================================================

export const AUTHENTICATE_CALENDAR = gql`
  mutation AuthenticateCalendar($password: String!) {
    authenticateCalendar(password: $password) {
      ok
    }
  }
`;

export const CREATE_CAL_EVENT = gql`
  mutation CreateCalendarEvent($input: CreateCalendarEventInput!) {
    createCalendarEvent(input: $input) {
      id
      title
      description
      start
      end
      allDay
      eventType
    }
  }
`;

export const UPDATE_CAL_EVENT = gql`
  mutation UpdateCalendarEvent($id: ID!, $input: UpdateCalendarEventInput!) {
    updateCalendarEvent(id: $id, input: $input) {
      id
      title
      description
      start
      end
      allDay
      eventType
    }
  }
`;

export const DELETE_CAL_EVENT = gql`
  mutation DeleteCalendarEvent($id: ID!) {
    deleteCalendarEvent(id: $id)
  }
`;

export const SAVE_CAL_EVENT = gql`
  mutation SaveCalendarEvent($id: ID!) {
    saveCalendarEvent(id: $id) {
      id
      status
    }
  }
`;

export const RESTORE_CAL_EVENT = gql`
  mutation RestoreCalendarEvent($id: ID!, $start: DateTime!, $end: DateTime!) {
    restoreCalendarEvent(id: $id, start: $start, end: $end) {
      id
      status
      start
      end
    }
  }
`;

// Calendar Query (keeping here since it was in original file)
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

// ============================================================
// GIELINOR RUSH: EVENTS
// ============================================================

export const CREATE_TREASURE_EVENT = gql`
  mutation CreateTreasureEvent($input: CreateTreasureEventInput!) {
    createTreasureEvent(input: $input) {
      eventId
      eventName
      eventPassword
      status
      clanId
      startDate
      endDate
      eventConfig
      derivedValues
      contentSelections
      discordConfig
      creatorId
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_TREASURE_EVENT = gql`
  mutation UpdateTreasureEvent($eventId: ID!, $input: UpdateTreasureEventInput!) {
    updateTreasureEvent(eventId: $eventId, input: $input) {
      eventId
      eventName
      status
      clanId
      startDate
      endDate
      eventConfig
      derivedValues
      contentSelections
      mapStructure
      discordConfig
      updatedAt
    }
  }
`;

export const DELETE_TREASURE_EVENT = gql`
  mutation DeleteTreasureEvent($eventId: ID!) {
    deleteTreasureEvent(eventId: $eventId) {
      success
      message
    }
  }
`;

export const GENERATE_TREASURE_MAP = gql`
  mutation GenerateTreasureMap($eventId: ID!) {
    generateTreasureMap(eventId: $eventId) {
      eventId
      mapStructure
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

// ============================================================
// GIELINOR RUSH: EVENT ADMINS
// ============================================================

export const ADD_EVENT_ADMIN = gql`
  mutation AddEventAdmin($eventId: ID!, $userId: ID!) {
    addEventAdmin(eventId: $eventId, userId: $userId) {
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

export const REMOVE_EVENT_ADMIN = gql`
  mutation RemoveEventAdmin($eventId: ID!, $userId: ID!) {
    removeEventAdmin(eventId: $eventId, userId: $userId) {
      eventId
      adminIds
    }
  }
`;

export const UPDATE_EVENT_ADMINS = gql`
  mutation UpdateEventAdmins($eventId: ID!, $adminIds: [ID!]!) {
    updateEventAdmins(eventId: $eventId, adminIds: $adminIds) {
      eventId
      adminIds
      admins {
        id
        displayName
        username
      }
    }
  }
`;

// ============================================================
// GIELINOR RUSH: EVENT REFS
// ============================================================

export const ADD_EVENT_REF = gql`
  mutation AddEventRef($eventId: ID!, $userId: ID!) {
    addEventRef(eventId: $eventId, userId: $userId) {
      eventId
      refIds
      refs {
        id
        displayName
        username
      }
    }
  }
`;

export const REMOVE_EVENT_REF = gql`
  mutation RemoveEventRef($eventId: ID!, $userId: ID!) {
    removeEventRef(eventId: $eventId, userId: $userId) {
      eventId
      refIds
    }
  }
`;

// ============================================================
// GIELINOR RUSH: TEAMS
// ============================================================

export const CREATE_TREASURE_TEAM = gql`
  mutation CreateTreasureTeam($eventId: ID!, $input: CreateTreasureTeamInput!) {
    createTreasureTeam(eventId: $eventId, input: $input) {
      teamId
      eventId
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
    }
  }
`;

export const UPDATE_TREASURE_TEAM = gql`
  mutation UpdateTreasureTeam($eventId: ID!, $teamId: ID!, $input: JSON!) {
    updateTreasureTeam(eventId: $eventId, teamId: $teamId, input: $input) {
      teamId
      teamName
      currentPot
      keysHeld
      completedNodes
      availableNodes
      innTransactions
    }
  }
`;

export const DELETE_TREASURE_TEAM = gql`
  mutation DeleteTreasureTeam($eventId: ID!, $teamId: ID!) {
    deleteTreasureTeam(eventId: $eventId, teamId: $teamId) {
      success
      message
    }
  }
`;

// ============================================================
// GIELINOR RUSH: NODE COMPLETION (Admin)
// ============================================================

export const ADMIN_COMPLETE_NODE = gql`
  mutation AdminCompleteNode($eventId: ID!, $teamId: ID!, $nodeId: ID!, $congratsMessage: String) {
    adminCompleteNode(
      eventId: $eventId
      teamId: $teamId
      nodeId: $nodeId
      congratsMessage: $congratsMessage
    ) {
      teamId
      completedNodes
      availableNodes
      currentPot
      keysHeld
    }
  }
`;

export const VISIT_INN = gql`
  mutation VisitInn($eventId: ID!, $teamId: ID!, $nodeId: ID!) {
    visitInn(eventId: $eventId, teamId: $teamId, nodeId: $nodeId) {
      teamId
      completedNodes
      availableNodes
      currentPot
      keysHeld
      activeBuffs
      innTransactions
    }
  }
`;

export const ADMIN_UNCOMPLETE_NODE = gql`
  mutation AdminUncompleteNode($eventId: ID!, $teamId: ID!, $nodeId: ID!) {
    adminUncompleteNode(eventId: $eventId, teamId: $teamId, nodeId: $nodeId) {
      teamId
      completedNodes
      availableNodes
      currentPot
      keysHeld
      activeBuffs
    }
  }
`;

// ============================================================
// GIELINOR RUSH: SUBMISSIONS
// ============================================================

export const SUBMIT_NODE_COMPLETION = gql`
  mutation SubmitNodeCompletion(
    $eventId: ID!
    $teamId: ID!
    $nodeId: ID!
    $proofUrl: String!
    $submittedBy: String!
  ) {
    submitNodeCompletion(
      eventId: $eventId
      teamId: $teamId
      nodeId: $nodeId
      proofUrl: $proofUrl
      submittedBy: $submittedBy
    ) {
      submissionId
      teamId
      nodeId
      submittedBy
      proofUrl
      status
      submittedAt
    }
  }
`;

export const REVIEW_SUBMISSION = gql`
  mutation ReviewSubmission(
    $submissionId: ID!
    $approved: Boolean!
    $reviewerId: String!
    $denialReason: String
  ) {
    reviewSubmission(
      submissionId: $submissionId
      approved: $approved
      reviewerId: $reviewerId
      denialReason: $denialReason
    ) {
      submissionId
      status
      reviewedBy
      reviewedAt
    }
  }
`;

// ============================================================
// GIELINOR RUSH: BUFFS
// ============================================================

export const APPLY_BUFF_TO_NODE = gql`
  mutation ApplyBuffToNode($eventId: ID!, $teamId: ID!, $nodeId: ID!, $buffId: ID!) {
    applyBuffToNode(eventId: $eventId, teamId: $teamId, nodeId: $nodeId, buffId: $buffId) {
      teamId
      teamName
      activeBuffs
      buffHistory
      currentPot
      keysHeld
      completedNodes
      availableNodes
    }
  }
`;

export const ADD_NODE_COMMENT = gql`
  mutation AddNodeComment($eventId: ID!, $teamId: ID!, $nodeId: ID!, $text: String!) {
    addNodeComment(eventId: $eventId, teamId: $teamId, nodeId: $nodeId, text: $text) {
      teamId
      nodeNotes
    }
  }
`;

export const DELETE_NODE_COMMENT = gql`
  mutation DeleteNodeComment($eventId: ID!, $teamId: ID!, $nodeId: ID!, $commentId: ID!) {
    deleteNodeComment(
      eventId: $eventId
      teamId: $teamId
      nodeId: $nodeId
      commentId: $commentId
    ) {
      teamId
      nodeNotes
    }
  }
`;

export const ADMIN_GIVE_BUFF = gql`
  mutation AdminGiveBuff($eventId: ID!, $teamId: ID!, $buffType: String!) {
    adminGiveBuff(eventId: $eventId, teamId: $teamId, buffType: $buffType) {
      teamId
      activeBuffs
      buffHistory
    }
  }
`;

export const ADMIN_REMOVE_BUFF = gql`
  mutation AdminRemoveBuff($eventId: ID!, $teamId: ID!, $buffId: ID!) {
    adminRemoveBuff(eventId: $eventId, teamId: $teamId, buffId: $buffId) {
      teamId
      activeBuffs
      buffHistory
    }
  }
`;

export const ADMIN_REMOVE_BUFF_FROM_NODE = gql`
  mutation AdminRemoveBuffFromNode($eventId: ID!, $teamId: ID!, $nodeId: ID!) {
    adminRemoveBuffFromNode(eventId: $eventId, teamId: $teamId, nodeId: $nodeId) {
      nodeId
      objective
    }
  }
`;

// ============================================================
// GIELINOR RUSH: INNS
// ============================================================

export const PURCHASE_INN_REWARD = gql`
  mutation PurchaseInnReward($eventId: ID!, $teamId: ID!, $rewardId: ID!) {
    purchaseInnReward(eventId: $eventId, teamId: $teamId, rewardId: $rewardId) {
      teamId
      currentPot
      keysHeld
      innTransactions
      activeBuffs
    }
  }
`;

// ============================================================
// GIELINOR RUSH: ACTIVITY FEED (Query)
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
// GIELINOR RUSH: SUBSCRIPTIONS (Real-time)
// ============================================================

export const SUBMISSION_ADDED_SUB = gql`
  subscription OnSubmissionAdded($eventId: ID!) {
    submissionAdded(eventId: $eventId) {
      submissionId
      status
      proofUrl
      submittedAt
      submittedBy
      submittedByUsername
      nodeId
      team {
        teamId
        teamName
      }
    }
  }
`;

export const SUBMISSION_REVIEWED_SUB = gql`
  subscription OnSubmissionReviewed($eventId: ID!) {
    submissionReviewed(eventId: $eventId) {
      submissionId
      status
      reviewedAt
      nodeId
      team {
        teamId
        teamName
      }
    }
  }
`;

export const NODE_COMPLETED_SUB = gql`
  subscription OnNodeCompleted($eventId: ID!) {
    nodeCompleted(eventId: $eventId) {
      eventId
      teamId
      nodeId
      teamName
      nodeName
    }
  }
`;

export const TREASURE_ACTIVITY_SUB = gql`
  subscription OnTreasureHuntActivity($eventId: ID!) {
    treasureHuntActivity(eventId: $eventId) {
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

export const INCREMENT_VISIT = gql`
  mutation IncrementVisit {
    incrementVisit
  }
`;
