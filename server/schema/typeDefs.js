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
    progress: Int
    progressMax: Int
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
    progress: Int
    progressMax: Int
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

  enum CalendarEventPublishStatus {
    DRAFT
    OFFICIAL
  }

  type CalendarEvent {
    id: ID!
    title: String!
    description: String
    threadUrl: String
    start: DateTime!
    end: DateTime!
    allDay: Boolean!
    eventType: CalendarEventType!
    status: CalendarEventStatus!
    publishStatus: CalendarEventPublishStatus!
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
    threadUrl: String
    start: DateTime!
    end: DateTime!
    allDay: Boolean = false
    eventType: CalendarEventType!
    publishStatus: CalendarEventPublishStatus = OFFICIAL
  }

  input UpdateCalendarEventInput {
    title: String
    description: String
    threadUrl: String
    start: DateTime
    end: DateTime
    allDay: Boolean
    eventType: CalendarEventType
  }

  # ============================================================
  # GIELINOR RUSH: EVENTS
  # ============================================================

  enum GREventStatus {
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

  type AssociatedEvent {
    type: String!
    eventId: ID!
    eventName: String!
    status: String!
    url: String!
    role: String!
    createdAt: DateTime
  }

  type GREvent {
    eventId: ID!
    eventName: String!
    eventPassword: String
    status: GREventStatus!
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
    teams: [GRTeam!]
    nodes: [GRNode!]
    creatorId: ID
    creator: User
    adminIds: [ID!]
    admins: [User!]
    refIds: [ID!]
    refs: [User!]
    lastMapGeneratedAt: DateTime
  }

  input CreateGREventInput {
    eventName: String!
    clanId: String
    eventPassword: String
    startDate: DateTime
    endDate: DateTime
    eventConfig: JSON!
    contentSelections: JSON
    discordConfig: JSON
  }

  input UpdateGREventInput {
    eventName: String
    status: GREventStatus
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

  type GRTeamMember {
    discordUserId: String!
    discordUsername: String
    discordAvatar: String
    username: String
    rsn: String
  }

  type GRTeam {
    teamId: ID!
    eventId: ID!
    teamName: String!
    discordRoleId: String
    members: [GRTeamMember!]!
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
    submissions: [GRSubmission!]
    event: GREvent
    updatedAt: String
  }

  input CreateGRTeamInput {
    teamName: String!
    discordRoleId: String
    members: [String!]
  }

  # ============================================================
  # GIELINOR RUSH: NODES
  # ============================================================

  enum GRNodeType {
    START
    STANDARD
    INN
    TREASURE
  }

  type GRNode {
    nodeId: ID!
    eventId: ID!
    nodeType: GRNodeType!
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

  enum GRSubmissionStatus {
    PENDING_REVIEW
    APPROVED
    DENIED
  }

  type GRSubmission {
    submissionId: ID!
    eventId: ID!
    teamId: ID!
    nodeId: ID!
    submittedBy: String!
    submittedByUsername: String
    channelId: String
    proofUrl: String
    status: GRSubmissionStatus!
    reviewedBy: String
    reviewedAt: DateTime
    submittedAt: DateTime!
    team: GRTeam
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

  type GRActivity {
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

  type PlayerCompRecentEntry {
    id: String!
    title: String!
  }

  type PlayerCompHistory {
    rsn: String!
    count: Int!
    recent: [PlayerCompRecentEntry!]!
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

  type SyncTeamWomResult {
    updatedTiles: Int!
    lastWomSync:  DateTime
  }

  type StartTeamWomSyncResult {
    tileCodes: [String!]!
  }

  type SyncTeamWomTileResult {
    tileCode: String!
    progress: Int
  }

  type FinalizeTeamWomSyncResult {
    lastWomSync: DateTime
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
    teamsBalanced: Int!
    groupsTracked: Int!
    championsForged: Int!
    navalBattlesWaged: Int!
  }

  # ============================================================
  # RAINBOW BINGO
  # ============================================================

  enum RainbowEventStatus { SETUP ACTIVE COMPLETE }
  enum RainbowTileStatus  { LOCKED UNLOCKED SUBMITTED COMPLETE }
  enum RainbowSubmissionType   { PRE FINAL }
  enum RainbowSubmissionStatus { PENDING APPROVED DENIED }

  type RainbowTileDef {
    tileCode:      String!
    color:         String!
    colorIndex:    Int!
    bossOrSkill:   String!
    metricType:    String!
    metricTarget:  Float
    metricUnit:    String
    metricLabel:   String!
    hoursEstimate: Float
    theme:         String
    funName:       String
    validDrops:    [String]
    notes:         String
  }

  type RainbowEvent {
    eventId:          ID!
    eventName:        String!
    status:           RainbowEventStatus!
    startDate:        DateTime
    endDate:          DateTime
    adminIds:         [String!]!
    staffChannelId:   String
    guildId:          String
    womCompetitionId: String
    tileGraph:        JSON!
    teams:            [RainbowTeam!]!
    admins:           [User!]!
    createdAt:        DateTime
    updatedAt:        DateTime
  }

  type RainbowTeam {
    teamId:           ID!
    eventId:          ID!
    teamName:         String!
    discordChannelId: String!
    discordRoleId:    String
    captainDiscordId: String
    notes:            String
    teamToken:        String
    tiles:            [RainbowTeamTile!]!
    createdAt:        DateTime
    lastWomSync:      DateTime
  }

  type RainbowTeamTile {
    teamTileId:     ID!
    teamId:         ID!
    eventId:        ID!
    tileCode:       String!
    status:         RainbowTileStatus!
    progress:       Int!
    womBaseline:    Float
    unlockedAt:     DateTime
    completedAt:    DateTime
    tileDef:        RainbowTileDef!
    hasSubmissions: Boolean!
  }

  type RainbowSubmission {
    submissionId:     ID!
    teamId:           ID!
    eventId:          ID!
    tileCode:         String!
    type:             RainbowSubmissionType!
    screenshotUrl:    String
    discordMessageId: String
    channelId:        String!
    status:           RainbowSubmissionStatus!
    discordUsername:  String
    discordUserId:    String
    reviewedBy:       String
    reviewedAt:       DateTime
    denialReason:     String
    submittedAt:      DateTime
    team:             RainbowTeam
  }

  input CreateRainbowEventInput {
    eventName:      String!
    startDate:      DateTime
    endDate:        DateTime
    staffChannelId: String
  }

  input CreateRainbowTeamInput {
    teamName:         String!
    discordChannelId: String!
    discordRoleId:    String
  }

  input CreateRainbowSubmissionInput {
    tileCode:         String!
    type:             RainbowSubmissionType!
    screenshotUrl:    String
    discordMessageId: String
    channelId:        String!
    submittedAt:      DateTime
    discordUsername:  String
    discordUserId:    String
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
      publishStatus: CalendarEventPublishStatus
    ): CalendarEventsPage!
    savedCalendarEvents(offset: Int = 0, limit: Int = 500): CalendarEventsPage!
    calendarVersion: CalendarVersion!
    savedCalendarVersion: CalendarVersion!
    getPublicCalendarEvents(limit: Int = 20): [CalendarEvent!]!

    # --- Gielinor Rush ---
    getGREvent(eventId: ID!): GREvent
    getGRTeam(eventId: ID!, teamId: ID!): GRTeam
    getAllGREvents(userId: ID): [GREvent!]
    getMyGREvents: [GREvent!]
    getAssociatedGREvents: [GREvent!]!
    getAssociatedEvents: [AssociatedEvent!]!
    getPendingSubmissions(eventId: ID!): [GRSubmission!]
    getAllSubmissions(eventId: ID!): [GRSubmission!]
    getNodeSubmissionSummaries(eventId: ID!): [NodeSubmissionSummary!]!
    getNodeSubmissions(nodeId: ID!, teamId: ID!): [GRSubmission!]!
    getGREventLeaderboard(eventId: ID!): [GRTeam!]
    getGRActivities(eventId: ID!, limit: Int, offset: Int): [GRActivity!]
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
    fetchWomStats(rsns: [String!]!): [JSON!]!
    fetchPlayerCompHistory(rsns: [String!]!): [PlayerCompHistory!]!

    # --- Champion Forge ---
    getCFEvent(eventId: ID!): CFEvent
    getAllCFEvents: [CFEvent!]!
    getMyCFEvents: [CFEvent!]!
    getCFTeam(eventId: ID!, teamId: ID!): CFTeam
    getCFWarChest(teamId: ID!): [CFItem!]!
    getCFSubmissions(eventId: ID!, status: CFSubmissionStatus, limit: Int, offset: Int): [CFSubmission!]!
    getCFSubmissionSummaries(eventId: ID!): [CFSubmissionSummary!]!
    getCFTaskSubmissions(eventId: ID!, taskId: String!, teamId: ID!): [CFSubmission!]!
    getCFPreScreenshots(eventId: ID!, limit: Int, offset: Int): [CFPreScreenshot!]!
    getBattleViewerCount(eventId: ID!): Int!
    getCFBattle(battleId: ID!): CFBattle
    getCFBattleLog(battleId: ID!, limit: Int, offset: Int): [CFBattleEvent!]!
    getCFBattlesByEvent(eventId: ID!): [CFBattle!]!
    getCFTaskPool(eventId: ID!): [CFTask!]!

    # --- Rainbow Bingo ---
    isRainbowBingoChannelActive(channelId: String!): Boolean!
    getActiveRainbowEvent: RainbowEvent
    getRainbowEvent(eventId: ID!): RainbowEvent
    getRainbowTeams(eventId: ID!): [RainbowTeam!]!
    getRainbowTeamBoard(teamId: ID!): [RainbowTeamTile!]!
    getRainbowTeamByToken(token: String!): RainbowTeam
    getRainbowSubmissions(eventId: ID!, status: RainbowSubmissionStatus, teamId: ID, tileCode: String): [RainbowSubmission!]!
    getRainbowTileDefs: [RainbowTileDef!]!
    getRainbowSyncInProgress: Boolean!

    # --- Group Goal Dashboard ---
    getGroupDashboard(slug: String!): GroupDashboard
    getGroupDashboardProgress(eventId: ID!): [GroupGoalProgress!]!
    getMyGroupDashboards: [GroupDashboard!]!
    getGroupCompetitions(slug: String!): [WOMCompetition!]!
    getMyGroupActivity: [GroupActivityItem!]!
    getUnreadGroupNotificationCount: Int!
    getMyGroupAssociations: [GroupAssociation!]!

    # --- Battleship ---
    getBSEvent(eventId: ID!): BSEvent
    getAllBSEvents(creatorId: ID): [BSEvent!]!
    getBSTaskPool(eventId: ID!): [BSTask!]!
    getBSBoard(boardId: ID!): BSBoard
    getBSShotLog(eventId: ID!): [BSShotLog!]!
    getBSViewerCount(eventId: ID!): Int!
    getBSSubmissions(eventId: ID!, status: BSSubmissionStatus, tileId: ID): [BSSubmission!]!
    getActiveBSProposal(teamId: ID!): BSProposal
  }

  # ============================================================
  # MUTATIONS
  # ============================================================

  type Mutation {
    # --- Analytics ---
    incrementVisit: Int!
    incrementTeamBalance: Int!

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
    linkDiscordAccount(userId: ID!, discordUserId: String!): AuthPayload!
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
    promoteCalendarEvent(id: ID!): CalendarEvent!
    demoteCalendarEvent(id: ID!): CalendarEvent!

    # --- Gielinor Rush: Events ---
    createGREvent(input: CreateGREventInput!): GREvent!
    updateGREvent(eventId: ID!, input: UpdateGREventInput!): GREvent!
    deleteGREvent(eventId: ID!): MutationResponse!
    generateGRMap(eventId: ID!): GREvent!
    launchEvent(eventId: ID!): GREvent!
    completeEvent(eventId: ID!): GREvent!

    # --- Gielinor Rush: Discord ---
    confirmDiscordSetup(eventId: ID!, guildId: String!): DiscordConfirmResponse!

    # --- Gielinor Rush: Event Admins ---
    addEventAdmin(eventId: ID!, userId: ID!): GREvent!
    removeEventAdmin(eventId: ID!, userId: ID!): GREvent!
    updateEventAdmins(eventId: ID!, adminIds: [ID!]!): GREvent!

    # --- Gielinor Rush: Event Refs ---
    addEventRef(eventId: ID!, userId: ID!): GREvent!
    removeEventRef(eventId: ID!, userId: ID!): GREvent!

    # --- Gielinor Rush: Teams ---
    createGRTeam(eventId: ID!, input: CreateGRTeamInput!): GRTeam!
    updateGRTeam(eventId: ID!, teamId: ID!, input: JSON!): GRTeam!
    deleteGRTeam(eventId: ID!, teamId: ID!): MutationResponse!

    # --- Gielinor Rush: Node Completion ---
    adminCompleteNode(
      eventId: ID!
      teamId: ID!
      nodeId: ID!
      congratsMessage: String
    ): GRTeam!
    visitInn(eventId: ID!, teamId: ID!, nodeId: ID!): GRTeam
    adminUncompleteNode(eventId: ID!, teamId: ID!, nodeId: ID!): GRTeam!
    adminSilentReCompleteNode(eventId: ID!, teamId: ID!, nodeId: ID!): GRTeam!
    adminRestoreLocationGroupSiblings(eventId: ID!, teamId: ID!, nodeId: ID!): GRTeam!
    adminRepairLocationGroupAvailability(eventId: ID!): [GRTeam!]!

    # --- Gielinor Rush: Submissions ---
    submitNodeCompletion(
      eventId: ID!
      teamId: ID!
      nodeId: ID!
      proofUrl: String!
      submittedBy: String!
      submittedByUsername: String
      channelId: String
    ): GRSubmission!
    reviewSubmission(
      submissionId: ID!
      approved: Boolean!
      reviewerId: String!
      denialReason: String
    ): GRSubmission!

    # --- Gielinor Rush: Buffs ---
    applyBuffToNode(eventId: ID!, teamId: ID!, nodeId: ID!, buffId: ID!): GRTeam!
    adminGiveBuff(eventId: ID!, teamId: ID!, buffType: String!): GRTeam!
    adminRemoveBuff(eventId: ID!, teamId: ID!, buffId: ID!): GRTeam!
    adminRemoveBuffFromNode(eventId: ID!, teamId: ID!, nodeId: ID!): GRTeam!

    # --- Gielinor Rush: Admin Notes ---
    addNodeComment(eventId: ID!, teamId: ID!, nodeId: ID!, text: String!): GRTeam!
    deleteNodeComment(eventId: ID!, teamId: ID!, nodeId: ID!, commentId: ID!): GRTeam!
    updateNodeProgress(eventId: ID!, teamId: ID!, nodeId: ID!, value: Int!): GRTeam!
    toggleNodeInProgress(eventId: ID!, teamId: ID!, nodeId: ID!): GRTeam!

    # --- Gielinor Rush: Inns ---
    purchaseInnReward(eventId: ID!, teamId: ID!, rewardId: ID!): GRTeam!
    adminRefundInnPurchase(eventId: ID!, teamId: ID!, nodeId: ID!): GRTeam!

    # --- Blind Draft Room ---
    createDraftRoom(input: CreateDraftRoomInput!): DraftRoom!
    joinDraftRoomAsCaptain(roomId: ID!, teamIndex: Int!, pin: String): CaptainJoinResult!
    startDraft(roomId: ID!): DraftRoom!
    makeDraftPick(roomId: ID!, playerId: ID!, captainToken: String): DraftRoom!
    placeBid(roomId: ID!, teamIndex: Int!, amount: Int!, captainToken: String): DraftRoom!
    revealNames(roomId: ID!): DraftRoom!

    # --- Champion Forge: Events ---
    createCFEvent(input: CreateCFEventInput!): CFEvent!
    updateCFEventStatus(eventId: ID!, status: CFEventStatus!): CFEvent!
    updateCFEventSettings(eventId: ID!, input: UpdateCFEventSettingsInput!): CFEvent!
    joinTaskInProgress(eventId: ID!, teamId: ID!, taskId: ID!): CFTeam!
    leaveTaskInProgress(eventId: ID!, teamId: ID!, taskId: ID!): CFTeam!
    deleteCFEvent(eventId: ID!): MutationResponse!
    generateCFBracket(eventId: ID!, bracketType: String): CFEvent!
    addCFAdmin(eventId: ID!, userId: ID!): CFEvent!
    removeCFAdmin(eventId: ID!, userId: ID!): CFEvent!
    addCFRef(eventId: ID!, userId: ID!): CFEvent!
    removeCFRef(eventId: ID!, userId: ID!): CFEvent!

    # --- Champion Forge: Teams ---
    createCFTeam(eventId: ID!, input: CreateCFTeamInput!): CFTeam!
    updateCFTeamMembers(teamId: ID!, members: [CFMemberInput!]!): CFTeam!
    deleteCFTeam(eventId: ID!, teamId: ID!): MutationResponse!
    setCFCaptain(teamId: ID!, discordId: String!): CFTeam!

    # --- Champion Forge: Tasks ---
    addCFTask(eventId: ID!, input: CFTaskInput!): CFTask!
    deleteCFTask(taskId: ID!): MutationResponse!
    setTaskProgress(eventId: ID!, teamId: ID!, taskId: ID!, value: Int!): CFTeam!
    markTaskComplete(eventId: ID!, teamId: ID!, taskId: ID!): CFTeam!
    undoTaskComplete(eventId: ID!, teamId: ID!, taskId: ID!): CFTeam!

    # --- Champion Forge: Submissions ---
    createCFSubmission(input: CFSubmissionInput!): CFSubmission!
    createCFPreScreenshot(
      eventId: ID!
      teamId: ID
      taskId: String!
      taskLabel: String
      submittedBy: String!
      submittedUsername: String
      screenshotUrl: String
      channelId: String
      messageId: String
    ): CFPreScreenshot!
    reviewCFSubmission(
      submissionId: ID!
      approved: Boolean!
      reviewerId: String!
      rewardSlot: String
      denialReason: String
    ): CFSubmission!
    changeSubmissionRewardSlot(submissionId: ID!, rewardSlot: String!): CFSubmission!
    undoSubmissionApproval(submissionId: ID!): CFSubmission!

    # --- Champion Forge: Outfitting ---
    saveOfficialLoadout(teamId: ID!, loadout: JSON!): CFTeam!
    lockCFLoadout(teamId: ID!): CFTeam!

    # --- Champion Forge: Admin shortcuts (dev / fast-forward) ---
    adminForceEventStatus(eventId: ID!, status: String!): CFEvent!
    adminLockAllLoadouts(eventId: ID!): [CFTeam!]!

    # --- Champion Forge: Battle ---
    joinBattleView(eventId: ID!): Boolean
    leaveBattleView(eventId: ID!): Boolean
    setCaptainReady(eventId: ID!, teamId: ID!): CFEvent!
    startCFBattle(eventId: ID!, team1Id: ID!, team2Id: ID!): CFBattle!
    submitBattleAction(
      battleId: ID!
      teamId: ID!
      action: CFBattleAction!
      itemId: ID
    ): CFBattle!

    # Dev-only: seed all CF scenario events; adds caller to adminIds on each
    devSeedCfEvent: Boolean!
    devReseedCfEvents: Boolean!
    # Dev-only: auto-play a battle to completion (admin only)
    devAutoBattle(battleId: ID!): CFBattle!
    # Dev-only: start the next unstarted bracket match and simulate it to completion
    devSimulateNextMatch(eventId: ID!): CFBattle!
    sendBattleEmote(battleId: ID!, emote: String!): Boolean!

    # --- Group Goal Dashboard ---
    createGroupDashboard(input: CreateGroupDashboardInput!): GroupDashboard!
    updateGroupDashboard(id: ID!, input: UpdateGroupDashboardInput!): GroupDashboard!
    createGroupGoalEvent(dashboardId: ID!, input: GroupGoalEventInput!): GroupGoalEvent!
    updateGroupGoalEvent(id: ID!, input: GroupGoalEventInput!): GroupGoalEvent!
    deleteGroupGoalEvent(id: ID!): Boolean!
    deleteGroupDashboard(id: ID!): Boolean!
    confirmGroupDashboardDiscord(id: ID!, guildId: String!, channelId: String!, roleId: String): GroupDashboard!
    updateGroupDiscordNotifications(id: ID!, notifications: JSON!): GroupDashboard!
    sendTestGroupDiscordMessage(id: ID!): Boolean!
    refreshGroupGoalData(eventId: ID!): GroupGoalEvent!
    setEventWomStartBuffer(eventId: ID!, hours: Int!): GroupGoalEvent!
    addGroupDashboardAdmin(id: ID!, userId: ID!): GroupDashboard!
    removeGroupDashboardAdmin(id: ID!, userId: ID!): GroupDashboard!
    transferGroupDashboard(id: ID!, newOwnerId: ID!): GroupDashboard!
    saveGoalTemplate(id: ID!, name: String!, goals: JSON!): GroupDashboard!
    deleteGoalTemplate(id: ID!, templateName: String!): GroupDashboard!
    setLeaguesWomGroupId(id: ID!, leaguesWomGroupId: String): GroupDashboard!
    followGroupDashboard(dashboardId: ID!): Boolean!
    unfollowGroupDashboard(dashboardId: ID!): Boolean!
    muteGroupDashboard(dashboardId: ID!): Boolean!
    unmuteGroupDashboard(dashboardId: ID!): Boolean!
    markGroupNotificationsRead: Boolean!

    # --- Rainbow Bingo ---
    createRainbowEvent(input: CreateRainbowEventInput!): RainbowEvent!
    createRainbowTeam(eventId: ID!, input: CreateRainbowTeamInput!): RainbowTeam!
    updateRainbowEventStatus(eventId: ID!, status: RainbowEventStatus!): RainbowEvent!
    setRainbowEventSchedule(eventId: ID!, startDate: DateTime, endDate: DateTime): RainbowEvent!
    setRainbowEventGuildId(eventId: ID!, guildId: String!): RainbowEvent!
    setRainbowEventWomCompetitionId(eventId: ID!, womCompetitionId: String): RainbowEvent!
    createRainbowSubmission(input: CreateRainbowSubmissionInput!): RainbowSubmission!
    reviewRainbowSubmission(submissionId: ID!, approved: Boolean!, denialReason: String): RainbowSubmission!
    completeRainbowTile(teamId: ID!, tileCode: String!): RainbowTeamTile!
    setRainbowTileProgress(teamId: ID!, tileCode: String!, progress: Int!): RainbowTeamTile!
    undoRainbowTileComplete(teamId: ID!, tileCode: String!): Boolean!
    addRainbowAdmin(eventId: ID!, userId: ID!): RainbowEvent!
    removeRainbowAdmin(eventId: ID!, userId: ID!): RainbowEvent!
    testRainbowChannel(teamId: ID!): Boolean!
    testRainbowNotification(teamId: ID!, type: String!): Boolean!
    deleteRainbowEvent(eventId: ID!): Boolean!
    deleteRainbowTeam(teamId: ID!): Boolean!
    syncTeamWomProgress(teamId: ID!): SyncTeamWomResult!
    startTeamWomSync(teamId: ID!): StartTeamWomSyncResult!
    syncTeamWomTile(teamId: ID!, tileCode: String!): SyncTeamWomTileResult!
    finalizeTeamWomSync(teamId: ID!): FinalizeTeamWomSyncResult!
    resetTeamWomCooldown(teamId: ID!): Boolean!
    generateRainbowTeamToken(teamId: ID!): RainbowTeam!

    # --- Battleship: Event & Teams ---
    createBSEvent(input: CreateBSEventInput!): BSEvent!
    updateBSEvent(eventId: ID!, input: UpdateBSEventInput!): BSEvent!
    deleteBSEvent(eventId: ID!): MutationResponse!
    addBSTeam(eventId: ID!, input: CreateBSTeamInput!): BSTeam!
    updateBSTeamMembers(teamId: ID!, members: [String!]!): BSTeam!
    updateBSTeamDiscord(teamId: ID!, discordChannelId: String, discordRoleId: String, womTeamName: String): BSTeam!
    joinBSTeam(teamId: ID!): BSTeam!
    addBSAdmin(eventId: ID!, userId: ID!): BSEvent!
    addBSRef(eventId: ID!, userId: ID!): BSEvent!
    removeBSRef(eventId: ID!, userId: ID!): BSEvent!

    # --- Battleship: Task Pool ---
    addBSTask(eventId: ID!, input: BSTaskInput!): BSTask!
    updateBSTask(taskId: ID!, input: BSTaskInput!): BSTask!
    removeBSTask(taskId: ID!): Boolean!

    # --- Battleship: Ship Templates ---
    setBSShipTemplate(eventId: ID!, shipType: BSShipType!, cellIndex: Int!, taskId: ID!): BSShipTemplate!

    # --- Battleship: Placement Phase ---
    updateBSContentSelections(eventId: ID!, contentSelections: JSON!): BSEvent!
    updateBSMultiplier(eventId: ID!, multiplier: Float!): BSEvent!
    startBSPlacementPhase(eventId: ID!): BSEvent!
    placeBSShip(boardId: ID!, input: BSShipPlacementInput!): BSShipPlacement!
    joinBSView(eventId: ID!): Boolean
    leaveBSView(eventId: ID!): Boolean

    # --- Battleship: Game Phase ---
    startBSGame(eventId: ID!): BSEvent!
    triggerBSWomSync(eventId: ID!): Boolean!
    fireBS(eventId: ID!, targetTeamId: ID!, row: Int!, col: Int!, firingTeamId: ID): BSShotLog!
    completeBSTile(tileId: ID!): BSTile!
    skipBSTile(tileId: ID!): BSTile!
    addBSSkipTokens(teamId: ID!, count: Int!): BSTeam!
    updateBSTileTask(tileId: ID!, taskId: ID!): BSTile!
    setBSTileProgress(tileId: ID!, progress: Int!): BSTile!

    # --- Battleship: Submissions ---
    createBSSubmission(input: CreateBSSubmissionInput!): BSSubmission!
    reviewBSSubmission(submissionId: ID!, approved: Boolean!, denialReason: String): BSSubmission!

    # --- Battleship: Shot proposals ---
    proposeBSShot(eventId: ID!, row: Int!, col: Int!, firingTeamId: ID): BSProposal!
    voteOnBSProposal(proposalId: ID!, approve: Boolean!): BSProposal!
    clearBSProposal(teamId: ID!): Boolean!

    # --- Battleship: Skip token proposals ---
    proposeSkipToken(tileId: ID!, firingTeamId: ID): BSSkipProposal!
    voteOnSkipProposal(proposalId: ID!, approve: Boolean!): BSSkipProposal!
    clearSkipProposal(teamId: ID!): Boolean!
  }

  # ============================================================
  # CHAMPION FORGE: CORE TYPES
  # ============================================================

  enum CFEventStatus {
    DRAFT
    GATHERING
    OUTFITTING
    BATTLE
    COMPLETED
  }

  enum CFSubmissionStatus {
    PENDING
    APPROVED
    DENIED
  }

  enum CFBattleStatus {
    WAITING
    IN_PROGRESS
    COMPLETED
  }

  enum CFBattleAction {
    ATTACK
    DEFEND
    USE_ITEM
    SPECIAL
  }

  type CFEvent {
    eventId: ID!
    clanId: String
    eventName: String!
    status: CFEventStatus!
    gatheringStart: DateTime
    gatheringEnd: DateTime
    outfittingEnd: DateTime
    eventConfig: JSON
    bracket: JSON
    creatorId: String
    adminIds: [String!]
    admins: [User!]
    refIds: [String!]
    refs: [User!]
    seed: String
    guildId: String
    announcementsChannelId: String
    scheduledGatheringStart: DateTime
    difficulty: String
    eventPassword: String
    teams: [CFTeam!]
    submissions: [CFSubmission!]
    tasks: [CFTask!]
    battles: [CFBattle!]
    createdAt: DateTime
    updatedAt: DateTime
  }

  type CFMember {
    discordId: String!
    username: String
    rsn: String
    avatar: String
    role: String
  }

  type CFTeam {
    teamId: ID!
    eventId: ID!
    teamName: String!
    discordRoleId: String
    members: [CFMember!]
    officialLoadout: JSON
    loadoutLocked: Boolean!
    captainDiscordId: String
    completedTaskIds: [String!]
    taskProgress: JSON
    numericTaskProgress: JSON
    items: [CFItem!]
    submissions: [CFSubmission!]
  }

  type CFItem {
    itemId: ID!
    teamId: ID!
    eventId: ID!
    name: String!
    slot: String!
    rarity: String!
    itemSnapshot: JSON!
    sourceSubmissionId: String
    earnedAt: DateTime
    isEquipped: Boolean!
    isUsed: Boolean!
  }

  type CFSubmissionSummary {
    taskId: String!
    teamId: ID!
    pendingCount: Int!
    approvedCount: Int!
    deniedCount: Int!
  }

  type CFPreScreenshot {
    preScreenshotId: ID!
    eventId: ID!
    teamId: ID
    taskId: String!
    taskLabel: String
    submittedBy: String!
    submittedUsername: String
    screenshotUrl: String
    channelId: String
    messageId: String
    submittedAt: DateTime
    createdAt: DateTime
  }

  type CFSubmission {
    submissionId: ID!
    eventId: ID!
    teamId: ID!
    submittedBy: String!
    submittedUsername: String
    channelId: String
    taskId: String!
    taskLabel: String
    difficulty: String!
    role: String!
    screenshot: String
    status: CFSubmissionStatus!
    rewardSlot: String
    rewardItemId: String
    rewardItem: CFItem
    reviewedBy: String
    reviewNote: String
    reviewedAt: DateTime
    submittedAt: DateTime
    createdAt: DateTime
  }

  type CFBattle {
    battleId: ID!
    eventId: ID!
    team1Id: ID!
    team2Id: ID!
    status: CFBattleStatus!
    championSnapshots: JSON
    battleState: JSON
    rngSeed: String
    winnerId: String
    startedAt: DateTime
    endedAt: DateTime
    battleLog: [CFBattleEvent!]
  }

  type CFBattleEvent {
    eventLogId: ID!
    battleId: ID!
    turnNumber: Int!
    actorTeamId: String
    action: String!
    rollInputs: JSON
    damageDealt: Int
    isCrit: Boolean
    itemUsedId: String
    effectApplied: String
    hpAfter: JSON
    narrative: String
    createdAt: DateTime
  }

  type CFTask {
    taskId: ID!
    eventId: ID!
    label: String!
    description: String
    difficulty: String!
    role: String!
    isActive: Boolean!
    acceptableItems: [String!]
    quantity: Int
  }

  type CFSubmitResult {
    success: Boolean!
    message: String!
    item: CFItem
  }

  type BattleEmote {
    battleId: ID!
    emote: String!
  }

  type CFBattleUpdate {
    battleId: ID!
    battle: CFBattle!
    latestEvent: CFBattleEvent
  }

  # ============================================================
  # CHAMPION FORGE: INPUTS
  # ============================================================

  input UpdateCFEventSettingsInput {
    guildId: String
    announcementsChannelId: String
    scheduledGatheringStart: DateTime
  }

  input CreateCFEventInput {
    eventName: String!
    clanId: String
    gatheringHours: Int
    outfittingHours: Int
    turnTimerSeconds: Int
    maxConsumableSlots: Int
    flexRolesAllowed: Boolean
    difficulty: String
    bracketType: String
    teams: [CreateCFTeamInput!]
  }

  input CreateCFTeamInput {
    teamName: String!
    discordRoleId: String
    members: [CFMemberInput!]
  }

  input CFMemberInput {
    discordId: String!
    username: String
    avatar: String
    role: String
  }

  input CFTaskInput {
    label: String!
    description: String
    difficulty: String!
    role: String!
    quantity: Int
  }

  input CFSubmissionInput {
    eventId: ID!
    teamId: ID!
    submittedBy: String!
    submittedUsername: String
    channelId: String
    taskId: String!
    difficulty: String!
    role: String!
    screenshot: String
  }

  # ============================================================
  # GROUP GOAL DASHBOARD
  # ============================================================

  type GroupDashboard {
    id: ID!
    slug: String!
    groupName: String!
    womGroupId: String!
    leaguesWomGroupId: String
    creatorId: ID!
    adminIds: [ID!]!
    theme: JSON
    discordConfig: JSON
    goalTemplates: JSON
    events: [GroupGoalEvent!]!
    creator: User
    admins: [User!]
    isFollowing: Boolean
  }

  type GroupAssociation {
    dashboardId: ID!
    dashboardName: String!
    dashboardSlug: String!
    role: String!
    isMuted: Boolean!
  }

  type GroupActivityItem {
    id: ID!
    type: String!
    dashboardId: ID!
    dashboardSlug: String!
    dashboardName: String!
    eventId: ID
    eventName: String
    metadata: JSON
    readAt: DateTime
    createdAt: DateTime!
  }

  type GroupGoalEvent {
    id: ID!
    dashboardId: ID!
    eventName: String!
    description: String
    startDate: DateTime!
    endDate: DateTime!
    goals: [JSON!]!
    cachedData: JSON
    lastSyncedAt: DateTime
    isVisible: Boolean!
    notificationsSent: JSON
    womStartBufferHours: Int!
  }

  type GroupGoalProgress {
    goalId: ID!
    metric: String!
    displayName: String!
    current: Float!
    target: Float!
    percent: Float!
    topContributors: [GroupGoalContributor!]!
  }

  type GroupGoalContributor {
    rsn: String!
    value: Float!
    percent: Float!
    role: String
    completed: Boolean
  }

  type WOMCompetition {
    id: ID!
    title: String!
    metric: String!
    type: String!
    status: String!
    startsAt: DateTime!
    endsAt: DateTime!
    participantCount: Int!
    groupId: ID
    isLeagues: Boolean
  }

  input CreateGroupDashboardInput {
    groupName: String!
    womGroupId: String!
    slug: String
    theme: JSON
  }

  input UpdateGroupDashboardInput {
    groupName: String
    theme: JSON
    discordConfig: JSON
  }

  input GroupGoalEventInput {
    eventName: String!
    description: String
    startDate: DateTime!
    endDate: DateTime!
    goals: [JSON!]!
  }

  # ============================================================
  # BATTLESHIP
  # ============================================================

  enum BSEventStatus {
    DRAFT
    PLACEMENT
    ACTIVE
    COMPLETED
    ARCHIVED
  }

  enum BSShipType {
    CARRIER
    BATTLESHIP
    CRUISER
    SUBMARINE
    DESTROYER
  }

  enum BSShipOrientation {
    HORIZONTAL
    VERTICAL
  }

  enum BSShotResult {
    HIT
    MISS
  }

  type BSEvent {
    eventId: ID!
    eventName: String!
    status: BSEventStatus!
    placementPhaseHours: Int!
    cooldownMinutes: Int!
    initialSkipTokens: Int!
    voteThreshold: Int
    metricMultiplier: Float!
    placementStartsAt: DateTime
    placementEndsAt: DateTime
    scheduledPlacementStart: DateTime
    creatorId: String
    adminIds: [String!]!
    refIds: [String!]!
    refs: [User!]!
    guildId: String
    announcementsChannelId: String
    eventPassword: String
    womCompetitionId: String
    contentSelections: JSON
    winnerId: ID
    completedAt: DateTime
    teams: [BSTeam!]!
    tasks: [BSTask!]!
    shipTemplates: [BSShipTemplate!]!
    templateBoard: BSBoard
  }

  type BSGameOver {
    eventId: ID!
    winnerId: ID!
    losingTeamId: ID!
    completedAt: DateTime!
  }

  type BSTeam {
    teamId: ID!
    eventId: ID!
    teamName: String!
    color: String
    members: [String!]!
    skipTokens: Int!
    lastShotAt: DateTime
    discordChannelId: String
    discordRoleId: String
    womTeamName: String
    board: BSBoard
  }

  type BSTask {
    taskId: ID!
    eventId: ID!
    label: String!
    bossOrSkill: String
    metricType: String
    metricTarget: Int
    metricUnit: String
    metricLabel: String
    validDrops: [String!]!
    womMetric: String
    description: String
    isActive: Boolean!
  }

  type BSShipTemplate {
    templateId: ID!
    eventId: ID!
    shipType: BSShipType!
    cellIndex: Int!
    taskId: String
    task: BSTask
  }

  type BSBoard {
    boardId: ID!
    eventId: ID!
    teamId: ID
    isPlacementLocked: Boolean!
    shipPlacements: [BSShipPlacement!]!
    tiles: [BSTile!]!
  }

  type BSShipPlacement {
    placementId: ID!
    boardId: ID!
    shipType: BSShipType!
    orientation: BSShipOrientation!
    startRow: Int!
    startCol: Int!
    updatedAt: String
  }

  type BSTile {
    tileId: ID!
    boardId: ID!
    row: Int
    col: Int
    shipType: BSShipType
    cellIndex: Int
    taskId: String
    task: BSTask
    isShot: Boolean!
    taskCompleted: Boolean!
    skipped: Boolean!
    progress: Int!
    metricBaseline: Int
    shotAt: DateTime
    taskCompletedAt: DateTime
  }

  type BSShotLog {
    shotId: ID!
    eventId: ID!
    firingTeamId: ID!
    targetBoardId: ID!
    tileId: ID!
    row: Int!
    col: Int!
    result: BSShotResult!
    taskId: String
    shotAt: DateTime!
  }

  enum BSProposalStatus { PENDING APPROVED REJECTED CLEARED }
  enum BSSubmissionStatus { PENDING APPROVED DENIED }

  type BSProposal {
    proposalId: ID
    eventId: ID
    firingTeamId: ID!
    targetTeamId: ID
    row: Int
    col: Int
    proposedBy: String
    approvals: [String!]!
    rejections: [String!]!
    status: BSProposalStatus!
    threshold: Int
    proposedAt: DateTime
    expiresAt: DateTime
  }

  type BSSkipProposal {
    proposalId: ID
    eventId: ID
    teamId: ID!
    tileId: ID
    tileLabel: String
    proposedBy: String
    approvals: [String!]!
    rejections: [String!]!
    status: BSProposalStatus!
    threshold: Int
    proposedAt: DateTime
    expiresAt: DateTime
  }

  type BSSubmission {
    submissionId: ID!
    id: ID!
    eventId: ID!
    tileId: ID!
    boardId: ID!
    teamId: ID!
    tileLabel: String
    discordUserId: String
    discordUsername: String
    screenshotUrl: String
    channelId: String
    discordMessageId: String
    status: BSSubmissionStatus!
    submissionType: BSSubmissionType!
    reviewedBy: String
    reviewedAt: DateTime
    denialReason: String
    submittedAt: DateTime
    submittedBy: String
    screenshot: String
    reviewNote: String
    tile: BSTile
    team: BSTeam
  }

  enum BSSubmissionType {
    PRESCREENSHOT
    SUBMISSION
  }

  input CreateBSSubmissionInput {
    tileId: ID!
    discordUserId: String
    discordUsername: String
    screenshotUrl: String
    channelId: String
    discordMessageId: String
    submissionType: BSSubmissionType
  }

  input CreateBSEventInput {
    eventName: String!
    placementPhaseHours: Int
    cooldownMinutes: Int
    initialSkipTokens: Int
    metricMultiplier: Float
    adminIds: [String!]
    refIds: [String!]
    guildId: String
    eventPassword: String
    contentSelections: JSON
  }

  input UpdateBSEventInput {
    eventName: String
    placementPhaseHours: Int
    cooldownMinutes: Int
    voteThreshold: Int
    guildId: String
    announcementsChannelId: String
    womCompetitionId: String
    scheduledPlacementStart: DateTime
  }

  input CreateBSTeamInput {
    teamName: String!
    color: String
    members: [String!]
    discordChannelId: String
    discordRoleId: String
  }

  input BSTaskInput {
    label: String!
    bossOrSkill: String
    metricType: String
    metricTarget: Int
    metricUnit: String
    metricLabel: String
    validDrops: [String!]
    womMetric: String
    description: String
  }

  input BSShipPlacementInput {
    shipType: BSShipType!
    orientation: BSShipOrientation!
    startRow: Int!
    startCol: Int!
  }

  # ============================================================
  # SUBSCRIPTIONS
  # ============================================================

  type Subscription {
    submissionAdded(eventId: ID!): GRSubmission!
    submissionReviewed(eventId: ID!): GRSubmission!
    nodeCompleted(eventId: ID!): NodeCompletionPayload!
    grActivity(eventId: ID!): GRActivity
    teamUpdated(eventId: ID!): GRTeam!
    nodeProgressUpdated(eventId: ID!): NodeProgressUpdate

    # --- Blind Draft Room ---
    draftRoomUpdated(roomId: ID!): DraftRoomUpdate!

    # --- Champion Forge ---
    cfBattleUpdated(battleId: ID!): CFBattleUpdate!
    battleEmoteReceived(battleId: ID!): BattleEmote!
    cfSubmissionAdded(eventId: ID!): CFSubmission!
    cfSubmissionReviewed(eventId: ID!): CFSubmission!
    cfPreScreenshotAdded(eventId: ID!): CFPreScreenshot!
    cfEventUpdated(eventId: ID!): CFEvent!
    battleViewersUpdated(eventId: ID!): Int!

    # --- Rainbow Bingo ---
    rainbowSubmissionAdded(eventId: ID!): RainbowSubmission!
    rainbowSubmissionReviewed(eventId: ID!): RainbowSubmission!
    rainbowTeamBoardUpdated(teamId: ID!): [RainbowTeamTile!]!
    rainbowEventBoardUpdated(eventId: ID!): ID!
    rainbowSyncStatusChanged: Boolean!

    # --- Battleship ---
    bsBoardUpdated(eventId: ID!): BSBoard!
    bsShotFired(eventId: ID!): BSShotLog!
    bsTileUpdated(boardId: ID!): BSTile!
    bsViewersUpdated(eventId: ID!): Int!
    bsSubmissionAdded(eventId: ID!): BSSubmission!
    bsSubmissionReviewed(eventId: ID!): BSSubmission!
    bsProposalUpdated(teamId: ID!): BSProposal!
    bsSkipProposalUpdated(teamId: ID!): BSSkipProposal!
    bsGameOver(eventId: ID!): BSGameOver!
  }
`;

module.exports = typeDefs;
