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
    fetchWomStats(rsns: [String!]!): [JSON!]!
    fetchPlayerCompHistory(rsns: [String!]!): [PlayerCompHistory!]!

    # --- Champion Forge ---
    getClanWarsEvent(eventId: ID!): ClanWarsEvent
    getAllClanWarsEvents: [ClanWarsEvent!]!
    getMyClanWarsEvents: [ClanWarsEvent!]!
    getClanWarsTeam(eventId: ID!, teamId: ID!): ClanWarsTeam
    getClanWarsWarChest(teamId: ID!): [ClanWarsItem!]!
    getClanWarsSubmissions(eventId: ID!, status: ClanWarsSubmissionStatus): [ClanWarsSubmission!]!
    getClanWarsSubmissionSummaries(eventId: ID!): [ClanWarsSubmissionSummary!]!
    getClanWarsTaskSubmissions(eventId: ID!, taskId: String!, teamId: ID!): [ClanWarsSubmission!]!
    getClanWarsPreScreenshots(eventId: ID!): [ClanWarsPreScreenshot!]!
    getClanWarsBattle(battleId: ID!): ClanWarsBattle
    getClanWarsBattleLog(battleId: ID!): [ClanWarsBattleEvent!]!
    getClanWarsTaskPool(eventId: ID!): [ClanWarsTask!]!

    # --- Group Goal Dashboard ---
    getGroupDashboard(slug: String!): GroupDashboard
    getGroupDashboardProgress(eventId: ID!): [GroupGoalProgress!]!
    getMyGroupDashboards: [GroupDashboard!]!
    getGroupCompetitions(slug: String!): [WOMCompetition!]!
    getMyGroupActivity: [GroupActivityItem!]!
    getUnreadGroupNotificationCount: Int!
    getMyGroupAssociations: [GroupAssociation!]!
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

    # --- Champion Forge: Events ---
    createClanWarsEvent(input: CreateClanWarsEventInput!): ClanWarsEvent!
    updateClanWarsEventStatus(eventId: ID!, status: ClanWarsEventStatus!): ClanWarsEvent!
    updateClanWarsEventSettings(eventId: ID!, input: UpdateClanWarsEventSettingsInput!): ClanWarsEvent!
    joinTaskInProgress(eventId: ID!, teamId: ID!, taskId: ID!): ClanWarsTeam!
    leaveTaskInProgress(eventId: ID!, teamId: ID!, taskId: ID!): ClanWarsTeam!
    deleteClanWarsEvent(eventId: ID!): MutationResponse!
    generateClanWarsBracket(eventId: ID!, bracketType: String): ClanWarsEvent!
    addClanWarsAdmin(eventId: ID!, userId: ID!): ClanWarsEvent!
    removeClanWarsAdmin(eventId: ID!, userId: ID!): ClanWarsEvent!
    addClanWarsRef(eventId: ID!, userId: ID!): ClanWarsEvent!
    removeClanWarsRef(eventId: ID!, userId: ID!): ClanWarsEvent!

    # --- Champion Forge: Teams ---
    createClanWarsTeam(eventId: ID!, input: CreateClanWarsTeamInput!): ClanWarsTeam!
    updateClanWarsTeamMembers(teamId: ID!, members: [ClanWarsMemberInput!]!): ClanWarsTeam!
    deleteClanWarsTeam(eventId: ID!, teamId: ID!): MutationResponse!
    setClanWarsCaptain(teamId: ID!, discordId: String!): ClanWarsTeam!

    # --- Champion Forge: Tasks ---
    addClanWarsTask(eventId: ID!, input: ClanWarsTaskInput!): ClanWarsTask!
    deleteClanWarsTask(taskId: ID!): MutationResponse!
    setTaskProgress(eventId: ID!, teamId: ID!, taskId: ID!, value: Int!): ClanWarsTeam!
    markTaskComplete(eventId: ID!, teamId: ID!, taskId: ID!): ClanWarsTeam!
    undoTaskComplete(eventId: ID!, teamId: ID!, taskId: ID!): ClanWarsTeam!

    # --- Champion Forge: Submissions ---
    createClanWarsSubmission(input: ClanWarsSubmissionInput!): ClanWarsSubmission!
    createClanWarsPreScreenshot(
      eventId: ID!
      teamId: ID
      taskId: String!
      taskLabel: String
      submittedBy: String!
      submittedUsername: String
      screenshotUrl: String
      channelId: String
      messageId: String
    ): ClanWarsPreScreenshot!
    reviewClanWarsSubmission(
      submissionId: ID!
      approved: Boolean!
      reviewerId: String!
      rewardSlot: String
      denialReason: String
    ): ClanWarsSubmission!
    changeSubmissionRewardSlot(submissionId: ID!, rewardSlot: String!): ClanWarsSubmission!
    undoSubmissionApproval(submissionId: ID!): ClanWarsSubmission!

    # --- Champion Forge: Outfitting ---
    saveOfficialLoadout(teamId: ID!, loadout: JSON!): ClanWarsTeam!
    lockClanWarsLoadout(teamId: ID!): ClanWarsTeam!

    # --- Champion Forge: Admin shortcuts (dev / fast-forward) ---
    adminForceEventStatus(eventId: ID!, status: String!): ClanWarsEvent!
    adminLockAllLoadouts(eventId: ID!): [ClanWarsTeam!]!

    # --- Champion Forge: Battle ---
    setCaptainReady(eventId: ID!, teamId: ID!): ClanWarsEvent!
    startClanWarsBattle(eventId: ID!, team1Id: ID!, team2Id: ID!): ClanWarsBattle!
    submitBattleAction(
      battleId: ID!
      teamId: ID!
      action: ClanWarsBattleAction!
      itemId: ID
    ): ClanWarsBattle!

    # Dev-only: seed all CF scenario events; adds caller to adminIds on each
    devSeedCfEvent: Boolean!
    # Dev-only: auto-play a battle to completion (admin only)
    devAutoBattle(battleId: ID!): ClanWarsBattle!
    # Dev-only: start the next unstarted bracket match and simulate it to completion
    devSimulateNextMatch(eventId: ID!): ClanWarsBattle!
    sendBattleEmote(battleId: ID!, emote: String!): Boolean!

    # --- Group Goal Dashboard ---
    createGroupDashboard(input: CreateGroupDashboardInput!): GroupDashboard!
    updateGroupDashboard(id: ID!, input: UpdateGroupDashboardInput!): GroupDashboard!
    createGroupGoalEvent(dashboardId: ID!, input: GroupGoalEventInput!): GroupGoalEvent!
    updateGroupGoalEvent(id: ID!, input: GroupGoalEventInput!): GroupGoalEvent!
    deleteGroupGoalEvent(id: ID!): Boolean!
    confirmGroupDashboardDiscord(id: ID!, guildId: String!, channelId: String!, roleId: String): GroupDashboard!
    updateGroupDiscordNotifications(id: ID!, notifications: JSON!): GroupDashboard!
    refreshGroupGoalData(eventId: ID!): GroupGoalEvent!
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
  }

  # ============================================================
  # CHAMPION FORGE: CORE TYPES
  # ============================================================

  enum ClanWarsEventStatus {
    DRAFT
    GATHERING
    OUTFITTING
    BATTLE
    COMPLETED
  }

  enum ClanWarsSubmissionStatus {
    PENDING
    APPROVED
    DENIED
  }

  enum ClanWarsBattleStatus {
    WAITING
    IN_PROGRESS
    COMPLETED
  }

  enum ClanWarsBattleAction {
    ATTACK
    DEFEND
    USE_ITEM
    SPECIAL
  }

  type ClanWarsEvent {
    eventId: ID!
    clanId: String
    eventName: String!
    status: ClanWarsEventStatus!
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
    teams: [ClanWarsTeam!]
    submissions: [ClanWarsSubmission!]
    tasks: [ClanWarsTask!]
    battles: [ClanWarsBattle!]
    createdAt: DateTime
    updatedAt: DateTime
  }

  type ClanWarsMember {
    discordId: String!
    username: String
    rsn: String
    avatar: String
    role: String
  }

  type ClanWarsTeam {
    teamId: ID!
    eventId: ID!
    teamName: String!
    discordRoleId: String
    members: [ClanWarsMember!]
    officialLoadout: JSON
    loadoutLocked: Boolean!
    captainDiscordId: String
    completedTaskIds: [String!]
    taskProgress: JSON
    numericTaskProgress: JSON
    items: [ClanWarsItem!]
    submissions: [ClanWarsSubmission!]
  }

  type ClanWarsItem {
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

  type ClanWarsSubmissionSummary {
    taskId: String!
    teamId: ID!
    pendingCount: Int!
    approvedCount: Int!
    deniedCount: Int!
  }

  type ClanWarsPreScreenshot {
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

  type ClanWarsSubmission {
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
    status: ClanWarsSubmissionStatus!
    rewardSlot: String
    rewardItemId: String
    rewardItem: ClanWarsItem
    reviewedBy: String
    reviewNote: String
    reviewedAt: DateTime
    submittedAt: DateTime
    createdAt: DateTime
  }

  type ClanWarsBattle {
    battleId: ID!
    eventId: ID!
    team1Id: ID!
    team2Id: ID!
    status: ClanWarsBattleStatus!
    championSnapshots: JSON
    battleState: JSON
    rngSeed: String
    winnerId: String
    startedAt: DateTime
    endedAt: DateTime
    battleLog: [ClanWarsBattleEvent!]
  }

  type ClanWarsBattleEvent {
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

  type ClanWarsTask {
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

  type ClanWarsSubmitResult {
    success: Boolean!
    message: String!
    item: ClanWarsItem
  }

  type BattleEmote {
    battleId: ID!
    emote: String!
  }

  type ClanWarsBattleUpdate {
    battleId: ID!
    battle: ClanWarsBattle!
    latestEvent: ClanWarsBattleEvent
  }

  # ============================================================
  # CHAMPION FORGE: INPUTS
  # ============================================================

  input UpdateClanWarsEventSettingsInput {
    guildId: String
    announcementsChannelId: String
    scheduledGatheringStart: DateTime
  }

  input CreateClanWarsEventInput {
    eventName: String!
    clanId: String
    gatheringHours: Int
    outfittingHours: Int
    turnTimerSeconds: Int
    maxConsumableSlots: Int
    flexRolesAllowed: Boolean
    difficulty: String
    bracketType: String
    teams: [CreateClanWarsTeamInput!]
  }

  input CreateClanWarsTeamInput {
    teamName: String!
    discordRoleId: String
    members: [ClanWarsMemberInput!]
  }

  input ClanWarsMemberInput {
    discordId: String!
    username: String
    avatar: String
    role: String
  }

  input ClanWarsTaskInput {
    label: String!
    description: String
    difficulty: String!
    role: String!
    quantity: Int
  }

  input ClanWarsSubmissionInput {
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
    startDate: DateTime!
    endDate: DateTime!
    goals: [JSON!]!
    cachedData: JSON
    lastSyncedAt: DateTime
    isVisible: Boolean!
    notificationsSent: JSON
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
    startDate: DateTime!
    endDate: DateTime!
    goals: [JSON!]!
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

    # --- Champion Forge ---
    clanWarsBattleUpdated(battleId: ID!): ClanWarsBattleUpdate!
    battleEmoteReceived(battleId: ID!): BattleEmote!
    clanWarsSubmissionAdded(eventId: ID!): ClanWarsSubmission!
    clanWarsSubmissionReviewed(eventId: ID!): ClanWarsSubmission!
    clanWarsPreScreenshotAdded(eventId: ID!): ClanWarsPreScreenshot!
    clanWarsEventUpdated(eventId: ID!): ClanWarsEvent!
  }
`;

module.exports = typeDefs;
