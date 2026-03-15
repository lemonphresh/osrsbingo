const { gql } = require('graphql-tag');

const typeDefs = gql`
  scalar DateTime
  scalar JSON

  # ============================================================
  # USER & AUTHENTICATION
  # ============================================================

  type User {
    id: ID!
    username: String!
    displayName: String!
    rsn: String
    discordUserId: String
    discordUsername: String
    discordAvatar: String
    admin: Boolean
    permissions: [String]
    token: String
    teams: [String]
    createdAt: DateTime
    editorBoards: [BingoBoard!]!
  }

  type AuthPayload {
    user: User
    token: String
  }

  input UserUpdateInput {
    username: String
    displayName: String
    password: String
    rsn: String
    admin: Boolean
  }

  type DeleteUserResponse {
    success: Boolean!
    message: String!
  }

  # ============================================================
  # BINGO BOARDS
  # ============================================================

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

  type BingoBoard {
    id: ID!
    name: String!
    description: String
    type: BingoBoardType!
    category: BingoBoardCategory!
    layout: [[ID]]!
    tiles: [BingoTile!]!
    isPublic: Boolean!
    theme: String
    userId: ID!
    editors: [User!]!
    team: ID
    totalValue: Int!
    totalValueCompleted: Int!
    bonusSettings: BonusSettings!
    createdAt: String
  }

  type BingoTile {
    id: ID!
    board: ID!
    name: String!
    value: Int!
    icon: String
    isComplete: Boolean!
    completedBy: String
    dateCompleted: String
  }

  type PopularTile {
    name: String!
    icon: String
    usageCount: Int!
  }

  type BonusSettings {
    allowDiagonals: Boolean
    horizontalBonus: Float
    verticalBonus: Float
    diagonalBonus: Float
    blackoutBonus: Int
  }

  type PaginatedBoards {
    boards: [BingoBoard!]!
    totalCount: Int!
  }

  input CreateBingoBoardInput {
    name: String!
    type: BingoBoardType!
    category: BingoBoardCategory
    description: String
    layout: [[Int!]!]
    isPublic: Boolean
    theme: String
    userId: ID!
    editors: [ID!]
    team: Int
    totalValue: Int!
    totalValueCompleted: Int!
    baseTileValue: Int
    bonusSettings: BonusSettingsInput!
  }

  input UpdateBingoBoardInput {
    name: String
    type: String
    category: BingoBoardCategory
    description: String
    layout: [[Int!]!]
    isPublic: Boolean
    theme: String
    bonusSettings: BonusSettingsInput
  }

  input UpdateBingoTileInput {
    name: String
    value: Int
    icon: String
    isComplete: Boolean
    completedBy: String
    dateCompleted: String
  }

  input BonusSettingsInput {
    allowDiagonals: Boolean!
    horizontalBonus: Float!
    verticalBonus: Float!
    diagonalBonus: Float!
    blackoutBonus: Int!
  }

  # ============================================================
  # EDITOR INVITATIONS
  # ============================================================

  type EditorInvitation {
    id: ID!
    boardId: ID!
    invitedUser: User!
    inviterUser: User!
    status: String!
    boardDetails: BingoBoard!
    createdAt: String!
    updatedAt: String!
  }

  type BatchInvitationResponse {
    success: Boolean!
    message: String
    failedUserIds: [ID!]
  }

  # ============================================================
  # CALENDAR EVENTS
  # ============================================================

  enum CalendarEventType {
    PVM
    MASS
    SKILLING
    MISC
    MIXED_CONTENT
    JAGEX
  }

  enum CalendarEventStatus {
    ACTIVE
    SAVED
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

  type CalendarVersion {
    lastUpdated: DateTime!
    totalCount: Int!
  }

  type CalendarAuthResult {
    ok: Boolean!
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

  # ============================================================
  # GIELINOR RUSH: EVENTS
  # ============================================================

  enum TreasureEventStatus {
    DRAFT
    PUBLIC
    COMPLETED
    ARCHIVED
  }

  type NodeProgressUpdate {
    eventId: ID!
    teamId: ID!
    nodeId: ID!
    value: Int!
  }

  type TreasureEvent {
    eventId: ID!
    eventName: String!
    eventPassword: String
    status: TreasureEventStatus!
    clanId: String
    startDate: DateTime
    endDate: DateTime
    createdAt: DateTime
    updatedAt: DateTime
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
    refIds: [ID!]
    refs: [User!]
    lastMapGeneratedAt: DateTime
  }

  input CreateTreasureEventInput {
    eventName: String!
    clanId: String
    eventPassword: String
    startDate: DateTime
    endDate: DateTime
    eventConfig: JSON!
    contentSelections: JSON
    discordConfig: JSON
  }

  input UpdateTreasureEventInput {
    eventName: String
    status: TreasureEventStatus
    startDate: DateTime
    endDate: DateTime
    eventConfig: JSON
    contentSelections: JSON
    mapStructure: JSON
    discordConfig: JSON
  }

  # ============================================================
  # GIELINOR RUSH: DISCORD
  # ============================================================

  type DiscordVerifyResponse {
    success: Boolean!
    guildName: String
    error: String
  }

  type DiscordConfirmResponse {
    success: Boolean!
    guildId: String
  }

  type DiscordChannelInfo {
    channelId: String!
    channelName: String!
    topic: String
  }

  type DiscordChannelCheckResult {
    success: Boolean!
    error: String
    eventChannels: [DiscordChannelInfo!]
  }

  # ============================================================
  # GIELINOR RUSH: TEAMS
  # ============================================================

  type TreasureTeamMember {
    discordUserId: String!
    discordUsername: String
    discordAvatar: String
    username: String
    rsn: String
  }

  type TreasureTeam {
    teamId: ID!
    eventId: ID!
    teamName: String!
    discordRoleId: String
    members: [TreasureTeamMember!]!
    currentPot: String
    completedNodes: [String!]
    availableNodes: [String!]
    keysHeld: JSON
    activeBuffs: JSON
    buffHistory: JSON
    innTransactions: JSON
    nodeNotes: JSON
    nodeBuffs: JSON
    nodeProgress: JSON
    inProgressNodes: [String]
    nodeUnlockTimes: JSON
    submissions: [TreasureSubmission!]
    event: TreasureEvent
    updatedAt: String
  }

  input CreateTreasureTeamInput {
    teamName: String!
    discordRoleId: String
    members: [String!]
  }

  # ============================================================
  # GIELINOR RUSH: NODES
  # ============================================================

  enum TreasureNodeType {
    START
    STANDARD
    INN
    TREASURE
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

  # ============================================================
  # GIELINOR RUSH: SUBMISSIONS
  # ============================================================

  enum TreasureSubmissionStatus {
    PENDING_REVIEW
    APPROVED
    DENIED
  }

  type TreasureSubmission {
    submissionId: ID!
    eventId: ID!
    teamId: ID!
    nodeId: ID!
    submittedBy: String!
    submittedByUsername: String
    channelId: String
    proofUrl: String
    status: TreasureSubmissionStatus!
    reviewedBy: String
    reviewedAt: DateTime
    submittedAt: DateTime!
    team: TreasureTeam
  }

  type NodeSubmissionSummary {
    nodeId: ID!
    teamId: ID!
    teamName: String!
    pendingCount: Int!
    approvedCount: Int!
  }

  # ============================================================
  # GIELINOR RUSH: ACTIVITY FEED
  # ============================================================

  type TreasureHuntActivity {
    id: ID!
    eventId: ID!
    teamId: ID!
    type: String!
    data: JSON
    timestamp: String!
  }

  # ============================================================
  # GIELINOR RUSH: SUBSCRIPTION PAYLOADS
  # ============================================================

  type NodeCompletionPayload {
    eventId: ID!
    teamId: ID!
    nodeId: ID!
    teamName: String!
    nodeName: String!
    rewards: JSON
  }

  # ============================================================
  # BLIND DRAFT ROOM
  # ============================================================

  enum DraftFormat {
    SNAKE
    LINEAR
    AUCTION
  }

  enum DraftStatus {
    LOBBY
    DRAFTING
    REVEALED
    COMPLETED
  }

  type DraftTeamSlot {
    index: Int!
    name: String!
    captainJoined: Boolean!
    captainUserId: ID
    budget: Int
  }

  type DraftPlayerCard {
    id: ID!
    alias: String!
    rsn: String
    womData: JSON
    tierBadge: String
    teamIndex: Int
    pickOrder: Int
  }

  type DraftRoom {
    roomId: ID!
    roomName: String!
    status: DraftStatus!
    draftFormat: DraftFormat!
    numberOfTeams: Int!
    teams: [DraftTeamSlot!]!
    players: [DraftPlayerCard!]!
    pickTimeSeconds: Int!
    picksPerTurn: Int!
    currentPickIndex: Int!
    currentPickStartedAt: DateTime
    auctionState: JSON
    organizerUserId: ID!
    createdAt: DateTime!
  }

  type DraftRoomUpdate {
    type: String!
    room: DraftRoom!
  }

  # Returned only on joinDraftRoomAsCaptain — captainToken is NOT exposed elsewhere
  type CaptainJoinResult {
    room: DraftRoom!
    captainToken: String!
    teamIndex: Int!
  }

  input CreateDraftRoomInput {
    roomName: String!
    rsns: [String!]!
    numberOfTeams: Int!
    teamNames: [String!]!
    draftFormat: DraftFormat!
    pickTimeSeconds: Int
    picksPerTurn: Int
    tierFormula: JSON
    roomPin: String
  }

  # ============================================================
  # COMMON TYPES
  # ============================================================

  type MutationResponse {
    success: Boolean!
    message: String
  }

  type SiteStats {
    totalBoards: Int!
    totalUsers: Int!
    totalTiles: Int!
    completedTiles: Int!
    boardsThisWeek: Int!
    usersThisWeek: Int!
    publicBoards: Int!
    totalVisits: Int!
    completionRate: Int!
    totalBlindDrafts: Int!
    totalGpWon: Float!
  }

  # ============================================================
  # QUERIES
  # ============================================================

  type Query {
    # --- Users ---
    getUser(id: ID!): User
    getUsers: [User!]
    getUserByDiscordId(discordUserId: String!): User
    searchUsers(search: String!): [User]
    searchUsersByIds(ids: [ID!]): [User]
    searchUsersByDiscord(query: String!, limit: Int): [User!]!

    # --- Bingo Boards ---
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
    getPopularTiles: [PopularTile!]

    # --- Editor Invitations ---
    pendingInvitations: [EditorInvitation!]!

    # --- Calendar ---
    calendarEvents(
      offset: Int = 0
      limit: Int = 500
      status: CalendarEventStatus = ACTIVE
    ): CalendarEventsPage!
    savedCalendarEvents(offset: Int = 0, limit: Int = 500): CalendarEventsPage!
    calendarVersion: CalendarVersion!
    savedCalendarVersion: CalendarVersion!

    # --- Gielinor Rush ---
    getTreasureEvent(eventId: ID!): TreasureEvent
    getTreasureTeam(eventId: ID!, teamId: ID!): TreasureTeam
    getAllTreasureEvents(userId: ID): [TreasureEvent!]
    getMyTreasureEvents: [TreasureEvent!]
    getAssociatedTreasureEvents: [TreasureEvent!]!
    getPendingSubmissions(eventId: ID!): [TreasureSubmission!]
    getAllSubmissions(eventId: ID!): [TreasureSubmission!]
    getNodeSubmissionSummaries(eventId: ID!): [NodeSubmissionSummary!]!
    getNodeSubmissions(nodeId: ID!, teamId: ID!): [TreasureSubmission!]!
    getTreasureEventLeaderboard(eventId: ID!): [TreasureTeam!]
    getTreasureActivities(eventId: ID!, limit: Int, offset: Int): [TreasureHuntActivity!]
    verifyDiscordGuild(guildId: String!): DiscordVerifyResponse!
    checkDiscordChannels(
      guildId: String!
      eventId: ID!
    ): DiscordChannelCheckResult!

    # --- Analytics ---
    getVisitCount: Int!
    getSiteStats: SiteStats!

    # --- Blind Draft Room ---
    getDraftRoom(roomId: ID!): DraftRoom
    getMyDraftRooms: [DraftRoom!]!
  }

  # ============================================================
  # MUTATIONS
  # ============================================================

  type Mutation {
    # --- Analytics ---
    incrementVisit: Int!

    # --- User Management ---
    createUser(
      username: String!
      displayName: String!
      password: String!
      rsn: String
      permissions: String!
    ): User
    updateUser(id: ID!, input: UserUpdateInput!): User
    deleteUser(id: ID!): DeleteUserResponse!
    loginUser(username: String!, password: String!): AuthPayload

    # --- Discord Linking ---
    linkDiscordAccount(userId: ID!, discordUserId: String!): User!
    unlinkDiscordAccount(userId: ID!): User!

    # --- Bingo Boards ---
    createBingoBoard(input: CreateBingoBoardInput!): BingoBoard
    updateBingoBoard(id: ID!, input: UpdateBingoBoardInput!): BingoBoard
    deleteBingoBoard(id: ID!): MutationResponse
    duplicateBingoBoard(boardId: ID!): BingoBoard!
    shuffleBingoBoardLayout(boardId: ID!): BingoBoard!
    replaceLayout(boardId: ID!, newType: String!): BingoBoard!

    # --- Bingo Tiles ---
    createBingoTile(board: ID!, name: String!, value: Int!, icon: String): BingoTile
    editBingoTile(id: ID!, input: UpdateBingoTileInput!): BingoTile

    # --- Board Editors ---
    updateBoardEditors(boardId: ID!, editorIds: [ID!]!): BingoBoard!
    sendEditorInvitation(boardId: ID!, invitedUserId: ID!): EditorInvitation!
    sendEditorInvitations(boardId: ID!, invitedUserIds: [ID!]!): BatchInvitationResponse!
    respondToInvitation(invitationId: ID!, response: String!): EditorInvitation!

    # --- Calendar ---
    authenticateCalendar(password: String!): CalendarAuthResult!
    createCalendarEvent(input: CreateCalendarEventInput!): CalendarEvent!
    updateCalendarEvent(id: ID!, input: UpdateCalendarEventInput!): CalendarEvent!
    deleteCalendarEvent(id: ID!): Boolean!
    saveCalendarEvent(id: ID!): CalendarEvent!
    restoreCalendarEvent(id: ID!, start: DateTime!, end: DateTime!): CalendarEvent!

    # --- Gielinor Rush: Events ---
    createTreasureEvent(input: CreateTreasureEventInput!): TreasureEvent!
    updateTreasureEvent(eventId: ID!, input: UpdateTreasureEventInput!): TreasureEvent!
    deleteTreasureEvent(eventId: ID!): MutationResponse!
    generateTreasureMap(eventId: ID!): TreasureEvent!
    launchEvent(eventId: ID!): TreasureEvent!
    completeEvent(eventId: ID!): TreasureEvent!

    # --- Gielinor Rush: Discord ---
    confirmDiscordSetup(eventId: ID!, guildId: String!): DiscordConfirmResponse!

    # --- Gielinor Rush: Event Admins ---
    addEventAdmin(eventId: ID!, userId: ID!): TreasureEvent!
    removeEventAdmin(eventId: ID!, userId: ID!): TreasureEvent!
    updateEventAdmins(eventId: ID!, adminIds: [ID!]!): TreasureEvent!

    # --- Gielinor Rush: Event Refs ---
    addEventRef(eventId: ID!, userId: ID!): TreasureEvent!
    removeEventRef(eventId: ID!, userId: ID!): TreasureEvent!

    # --- Gielinor Rush: Teams ---
    createTreasureTeam(eventId: ID!, input: CreateTreasureTeamInput!): TreasureTeam!
    updateTreasureTeam(eventId: ID!, teamId: ID!, input: JSON!): TreasureTeam!
    deleteTreasureTeam(eventId: ID!, teamId: ID!): MutationResponse!

    # --- Gielinor Rush: Node Completion ---
    adminCompleteNode(
      eventId: ID!
      teamId: ID!
      nodeId: ID!
      congratsMessage: String
    ): TreasureTeam!
    visitInn(eventId: ID!, teamId: ID!, nodeId: ID!): TreasureTeam
    adminUncompleteNode(eventId: ID!, teamId: ID!, nodeId: ID!): TreasureTeam!
    adminSilentReCompleteNode(eventId: ID!, teamId: ID!, nodeId: ID!): TreasureTeam!
    adminRestoreLocationGroupSiblings(eventId: ID!, teamId: ID!, nodeId: ID!): TreasureTeam!
    adminRepairLocationGroupAvailability(eventId: ID!): [TreasureTeam!]!

    # --- Gielinor Rush: Submissions ---
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

    # --- Gielinor Rush: Buffs ---
    applyBuffToNode(eventId: ID!, teamId: ID!, nodeId: ID!, buffId: ID!): TreasureTeam!
    adminGiveBuff(eventId: ID!, teamId: ID!, buffType: String!): TreasureTeam!
    adminRemoveBuff(eventId: ID!, teamId: ID!, buffId: ID!): TreasureTeam!
    adminRemoveBuffFromNode(eventId: ID!, teamId: ID!, nodeId: ID!): TreasureTeam!

    # --- Gielinor Rush: Admin Notes ---
    addNodeComment(eventId: ID!, teamId: ID!, nodeId: ID!, text: String!): TreasureTeam!
    deleteNodeComment(eventId: ID!, teamId: ID!, nodeId: ID!, commentId: ID!): TreasureTeam!
    updateNodeProgress(eventId: ID!, teamId: ID!, nodeId: ID!, value: Int!): TreasureTeam!
    toggleNodeInProgress(eventId: ID!, teamId: ID!, nodeId: ID!): TreasureTeam!

    # --- Gielinor Rush: Inns ---
    purchaseInnReward(eventId: ID!, teamId: ID!, rewardId: ID!): TreasureTeam!
    adminRefundInnPurchase(eventId: ID!, teamId: ID!, nodeId: ID!): TreasureTeam!

    # --- Blind Draft Room ---
    createDraftRoom(input: CreateDraftRoomInput!): DraftRoom!
    joinDraftRoomAsCaptain(roomId: ID!, teamIndex: Int!, pin: String): CaptainJoinResult!
    startDraft(roomId: ID!): DraftRoom!
    makeDraftPick(roomId: ID!, playerId: ID!, captainToken: String): DraftRoom!
    placeBid(roomId: ID!, teamIndex: Int!, amount: Int!, captainToken: String): DraftRoom!
    revealNames(roomId: ID!): DraftRoom!
  }

  # ============================================================
  # SUBSCRIPTIONS
  # ============================================================

  type Subscription {
    submissionAdded(eventId: ID!): TreasureSubmission!
    submissionReviewed(eventId: ID!): TreasureSubmission!
    nodeCompleted(eventId: ID!): NodeCompletionPayload!
    treasureHuntActivity(eventId: ID!): TreasureHuntActivity
    teamUpdated(eventId: ID!): TreasureTeam!
    nodeProgressUpdated(eventId: ID!): NodeProgressUpdate

    # --- Blind Draft Room ---
    draftRoomUpdated(roomId: ID!): DraftRoomUpdate!
  }
`;

module.exports = typeDefs;
