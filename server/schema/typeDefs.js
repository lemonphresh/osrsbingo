const { gql } = require('graphql-tag');

const typeDefs = gql`
  type User {
    id: ID!
    admin: Boolean
    username: String!
    displayName: String!
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
    getBingoBoard(id: ID!): BingoBoard
    getBingoTile(id: ID!): BingoTile
    getPublicBoards(
      limit: Int
      offset: Int
      category: String
      searchQuery: String
    ): PaginatedBoards!
    getFeaturedBoards(limit: Int, offset: Int): PaginatedBoards!
    searchUsers(search: String!): [User]
    searchUsersByIds(ids: [ID!]): [User]
    pendingInvitations: [EditorInvitation!]!
  }

  type DeleteUserResponse {
    success: Boolean!
    message: String!
  }

  type Mutation {
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
  }
`;

module.exports = typeDefs;
