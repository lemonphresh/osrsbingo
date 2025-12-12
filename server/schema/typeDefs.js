const { gql } = require('graphql-tag');

const typeDefs = gql`
  scalar DateTime
  scalar JSON

  enum CalendarEventType {
    PVM
    MASS
    SKILLING
    MISC
    MIXED_CONTENT
  }

  enum CalendarEventStatus {
    ACTIVE
    SAVED
  }

  type User {
    id: ID!
    admin: Boolean
    username: String!
    displayName: String!
    discordUserId: String
    rsn: String
    permissions: [String]
    token: String
    teams: [String]
    editorBoards: [BingoBoard!]!
  }

  input CreateBingoBoardInput {
    type: BingoBoardType!
    category: BingoBoardCategory
    name: String!
    editors: [ID!]
    description: String
    layout: [[Int!]!]
    isPublic: Boolean
    team: Int
    totalValue: Int!
    totalValueCompleted: Int!
    bonusSettings: BonusSettingsInput!
    userId: ID!
    baseTileValue: Int
    theme: String
  }

  type EditorInvitation {
    id: ID!
    boardId: ID!
    invitedUser: User!
    inviterUser: User!
    status: String!
    createdAt: String!
    updatedAt: String!
    boardDetails: BingoBoard!
  }

  type BingoBoard {
    id: ID!
    category: BingoBoardCategory!
    createdAt: String
    type: BingoBoardType!
    layout: [[ID]]! # 2D array of BingoTile IDs
    isPublic: Boolean!
    name: String!
    description: String
    editors: [User!]!
    team: ID
    userId: ID!
    totalValue: Int!
    totalValueCompleted: Int!
    bonusSettings: BonusSettings!
    tiles: [BingoTile!]! # Populated with full tile details
    theme: String
  }

  enum BingoBoardType {
    FIVE
    SEVEN
  }

  enum BingoBoardCategory {
    PvP
    PvM
    Skilling
    Social
    Featured
    Other
  }

  type BonusSettings {
    allowDiagonals: Boolean
    horizontalBonus: Float
    verticalBonus: Float
    diagonalBonus: Float
    blackoutBonus: Int
  }

  type AuthPayload {
    user: User
    token: String
  }

  type BingoTile {
    id: ID!
    isComplete: Boolean!
    name: String!
    icon: String
    dateCompleted: String
    completedBy: String
    board: ID!
    value: Int!
  }

  type MutationResponse {
    success: Boolean!
    message: String
  }

  input UserUpdateInput {
    username: String
    admin: Boolean
    displayName: String
    password: String
    rsn: String
  }

  input BonusSettingsInput {
    allowDiagonals: Boolean!
    horizontalBonus: Float!
    verticalBonus: Float!
    diagonalBonus: Float!
    blackoutBonus: Int!
  }

  input UpdateBingoTileInput {
    name: String
    isComplete: Boolean
    value: Int
    icon: String
    dateCompleted: String
    completedBy: String
  }

  input UpdateBingoBoardInput {
    name: String
    category: BingoBoardCategory
    type: String
    description: String
    layout: [[Int!]!]
    isPublic: Boolean
    theme: String
    bonusSettings: BonusSettingsInput
  }

  type PaginatedBoards {
    boards: [BingoBoard!]!
    totalCount: Int!
  }

  type BatchInvitationResponse {
    success: Boolean!
    message: String
    failedUserIds: [ID!] # Optional: IDs for users whose invitations failed
  }

  type Query {
    getUser(id: ID!): User
    getUsers: [User!]
    getUserByDiscordId(discordUserId: String!): User
    getBingoBoard(id: ID!): BingoBoard
    getBingoTile(id: ID!): BingoTile
    getPublicBoards(
      limit: Int
      offset: Int
      category: String
      searchQuery: String
    ): PaginatedBoards!
    getAllBoards(limit: Int, offset: Int, category: String, searchQuery: String): PaginatedBoards!
    getFeaturedBoards(limit: Int, offset: Int): PaginatedBoards!
    searchUsers(search: String!): [User]
    searchUsersByIds(ids: [ID!]): [User]
    pendingInvitations: [EditorInvitation!]!
    getTreasureEvent(eventId: ID!): TreasureEvent
    getTreasureTeam(eventId: ID!, teamId: ID!): TreasureTeam
    getAllTreasureEvents(userId: ID): [TreasureEvent!]
    getMyTreasureEvents: [TreasureEvent!]
    getPendingSubmissions(eventId: ID!): [TreasureSubmission!]
    getTreasureEventLeaderboard(eventId: ID!): [TreasureTeam!]
    getAllSubmissions(eventId: ID!): [TreasureSubmission!]
    getTreasureActivities(eventId: ID!, limit: Int): [TreasureHuntActivity!]
  }

  type DeleteUserResponse {
    success: Boolean!
    message: String!
  }

  type CalendarEvent {
    id: ID!
    title: String!
    description: String
    start: DateTime!
    end: DateTime!
    allDay: Boolean!
    eventType: CalendarEventType!
    status: CalendarEventStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type CalendarEventsPage {
    items: [CalendarEvent!]!
    totalCount: Int!
  }

  type CalendarAuthResult {
    ok: Boolean!
  }

  type CalendarVersion {
    lastUpdated: DateTime!
    totalCount: Int!
  }

  extend type Query {
    calendarEvents(
      offset: Int = 0
      limit: Int = 500
      status: CalendarEventStatus = ACTIVE
    ): CalendarEventsPage!
    savedCalendarEvents(offset: Int = 0, limit: Int = 500): CalendarEventsPage!
    calendarVersion: CalendarVersion!
    savedCalendarVersion: CalendarVersion!
    getVisitCount: Int!
  }

  input CreateCalendarEventInput {
    title: String!
    description: String
    start: DateTime!
    end: DateTime!
    allDay: Boolean = false
    eventType: CalendarEventType!
  }

  input UpdateCalendarEventInput {
    title: String
    description: String
    start: DateTime
    end: DateTime
    allDay: Boolean
    eventType: CalendarEventType
  }

  # Gielinor Rush Types
  type TreasureEvent {
    eventId: ID!
    clanId: String
    eventName: String!
    status: TreasureEventStatus!
    startDate: DateTime
    endDate: DateTime
    eventConfig: JSON
    derivedValues: JSON
    contentSelections: JSON
    mapStructure: JSON
    discordConfig: JSON
    teams: [TreasureTeam!]
    nodes: [TreasureNode!]
    creatorId: ID
    creator: User
    adminIds: [ID!]
    admins: [User!]
    createdAt: DateTime
    updatedAt: DateTime
  }

  enum TreasureEventStatus {
    DRAFT
    ACTIVE
    COMPLETED
    ARCHIVED
  }

  input CreateTreasureEventInput {
    eventName: String!
    clanId: String
    eventConfig: JSON!
    contentSelections: JSON
    startDate: DateTime
    endDate: DateTime
    discordConfig: JSON
  }

  type TreasureTeam {
    teamId: ID!
    eventId: ID!
    teamName: String!
    discordRoleId: String
    members: [String!]
    currentPot: String
    buffHistory: JSON
    activeBuffs: JSON
    keysHeld: JSON
    completedNodes: [String!]
    availableNodes: [String!]
    submissions: [TreasureSubmission!]
    innTransactions: JSON
    event: TreasureEvent
  }

  type TreasureNode {
    nodeId: ID!
    eventId: ID!
    nodeType: TreasureNodeType!
    title: String!
    description: String
    coordinates: JSON
    mapLocation: String
    locationGroupId: String
    prerequisites: [String!]
    unlocks: [String!]
    paths: [String!]
    objective: JSON
    rewards: JSON
    difficultyTier: Int
    innTier: Int
    availableRewards: JSON
  }

  enum TreasureNodeType {
    START
    STANDARD
    INN
    TREASURE
  }

  type TreasureHuntActivity {
    id: ID!
    eventId: ID!
    teamId: ID!
    type: String!
    data: JSON
    timestamp: String!
  }

  type Subscription {
    submissionAdded(eventId: ID!): TreasureSubmission!
    submissionReviewed(eventId: ID!): TreasureSubmission!
    nodeCompleted(eventId: ID!): NodeCompletionPayload!
    treasureHuntActivity(eventId: ID!): TreasureHuntActivity
  }

  type TreasureSubmission {
    submissionId: ID!
    submittedByUsername: String
    channelId: String
    eventId: ID!
    teamId: ID!
    nodeId: ID!
    submittedBy: String!
    proofUrl: String
    status: TreasureSubmissionStatus!
    reviewedBy: String
    reviewedAt: DateTime
    submittedAt: DateTime!
    team: TreasureTeam
  }

  type NodeCompletionPayload {
    eventId: ID!
    teamId: ID!
    nodeId: ID!
    teamName: String!
    nodeName: String!
    rewards: JSON
  }

  enum TreasureSubmissionStatus {
    PENDING_REVIEW
    APPROVED
    DENIED
  }

  input UpdateTreasureEventInput {
    eventName: String
    status: TreasureEventStatus
    eventConfig: JSON
    mapStructure: JSON
    discordConfig: JSON
    contentSelections: JSON
    startDate: DateTime
    endDate: DateTime
  }

  input CreateTreasureTeamInput {
    teamName: String!
    discordRoleId: String
    members: [String!]
  }

  type Mutation {
    incrementVisit: Int!

    linkDiscordAccount(userId: ID!, discordUserId: String!): User!
    unlinkDiscordAccount(userId: ID!): User!

    createUser(
      username: String!
      displayName: String!
      password: String!
      rsn: String
      permissions: String!
    ): User
    updateUser(id: ID!, input: UserUpdateInput!): User
    loginUser(username: String!, password: String!): AuthPayload
    deleteUser(id: ID!): DeleteUserResponse!

    createBingoBoard(input: CreateBingoBoardInput!): BingoBoard

    updateBoardEditors(boardId: ID!, editorIds: [ID!]!): BingoBoard!
    updateBingoBoard(id: ID!, input: UpdateBingoBoardInput!): BingoBoard
    duplicateBingoBoard(boardId: ID!): BingoBoard!
    shuffleBingoBoardLayout(boardId: ID!): BingoBoard!
    replaceLayout(boardId: ID!, newType: String!): BingoBoard!

    deleteBingoBoard(id: ID!): MutationResponse
    createBingoTile(board: ID!, name: String!, value: Int!, icon: String): BingoTile
    editBingoTile(id: ID!, input: UpdateBingoTileInput!): BingoTile

    sendEditorInvitation(boardId: ID!, invitedUserId: ID!): EditorInvitation!
    sendEditorInvitations(boardId: ID!, invitedUserIds: [ID!]!): BatchInvitationResponse!
    respondToInvitation(invitationId: ID!, response: String!): EditorInvitation!
    authenticateCalendar(password: String!): CalendarAuthResult!

    createCalendarEvent(input: CreateCalendarEventInput!): CalendarEvent!
    updateCalendarEvent(id: ID!, input: UpdateCalendarEventInput!): CalendarEvent!
    deleteCalendarEvent(id: ID!): Boolean!
    saveCalendarEvent(id: ID!): CalendarEvent!
    restoreCalendarEvent(id: ID!, start: DateTime!, end: DateTime!): CalendarEvent!

    createTreasureEvent(input: CreateTreasureEventInput!): TreasureEvent!
    updateTreasureEvent(eventId: ID!, input: UpdateTreasureEventInput!): TreasureEvent!
    deleteTreasureEvent(eventId: ID!): MutationResponse!

    createTreasureTeam(eventId: ID!, input: CreateTreasureTeamInput!): TreasureTeam!
    updateTreasureTeam(eventId: ID!, teamId: ID!, input: JSON!): TreasureTeam!
    deleteTreasureTeam(eventId: ID!, teamId: ID!): MutationResponse!

    addEventAdmin(eventId: ID!, userId: ID!): TreasureEvent!
    removeEventAdmin(eventId: ID!, userId: ID!): TreasureEvent!
    updateEventAdmins(eventId: ID!, adminIds: [ID!]!): TreasureEvent!

    adminCompleteNode(
      eventId: ID!
      teamId: ID!
      nodeId: ID!
      congratsMessage: String
    ): TreasureTeam!
    adminUncompleteNode(eventId: ID!, teamId: ID!, nodeId: ID!): TreasureTeam!
    applyBuffToNode(eventId: ID!, teamId: ID!, nodeId: ID!, buffId: ID!): TreasureTeam!
    adminGiveBuff(eventId: ID!, teamId: ID!, buffType: String!): TreasureTeam!
    adminRemoveBuff(eventId: ID!, teamId: ID!, buffId: ID!): TreasureTeam!
    adminRemoveBuffFromNode(eventId: ID!, teamId: ID!, nodeId: ID!): TreasureNode!

    submitNodeCompletion(
      eventId: ID!
      teamId: ID!
      nodeId: ID!
      proofUrl: String!
      submittedBy: String!
      submittedByUsername: String
      channelId: String
    ): TreasureSubmission!

    reviewSubmission(
      submissionId: ID!
      approved: Boolean!
      reviewerId: String!
      denialReason: String
    ): TreasureSubmission!

    purchaseInnReward(eventId: ID!, teamId: ID!, rewardId: ID!): TreasureTeam!

    generateTreasureMap(eventId: ID!): TreasureEvent!
  }
`;

module.exports = typeDefs;
