const { gql } = require('graphql-tag');

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    rsn: String
    permissions: [String]
    token: String
    teams: [String]
    bingoBoards: [BingoBoard!]!
  }

  input CreateBingoBoardInput {
    type: BingoBoardType!
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
  }

  type BingoBoard {
    id: ID!
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
  }

  enum BingoBoardType {
    FIVE
    SEVEN
  }

  type BonusSettings {
    allowDiagonals: Boolean
    horizontalBonus: Int
    verticalBonus: Int
    diagonalBonus: Int
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
    password: String
    rsn: String
  }

  input BonusSettingsInput {
    allowDiagonals: Boolean!
    horizontalBonus: Int!
    verticalBonus: Int!
    diagonalBonus: Int!
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
    type: String
    description: String
    isPublic: Boolean
    bonusSettings: BonusSettingsInput
  }

  type Query {
    getUser(id: ID!): User
    getUsers: [User!]
    getBingoBoard(id: ID!): BingoBoard
    getBingoTile(id: ID!): BingoTile
    getPublicBoards: [BingoBoard!]!
    searchUsers(search: String!): [User]
    searchUsersByIds(ids: [ID!]): [User]
  }

  type Mutation {
    createUser(username: String!, password: String!, rsn: String, permissions: String!): User
    updateUser(id: ID!, input: UserUpdateInput!): User
    loginUser(username: String!, password: String!): AuthPayload
    createBingoBoard(input: CreateBingoBoardInput!): BingoBoard

    updateBoardEditors(boardId: ID!, editorIds: [ID!]!): BingoBoard!
    updateBingoBoard(id: ID!, input: UpdateBingoBoardInput!): BingoBoard
    duplicateBingoBoard(boardId: ID!): BingoBoard!

    deleteBingoBoard(id: ID!): MutationResponse
    createBingoTile(board: ID!, name: String!, value: Int!, icon: String): BingoTile
    editBingoTile(id: ID!, input: UpdateBingoTileInput!): BingoTile
  }
`;

module.exports = typeDefs;
