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
    layout: [[Int!]!]!
    isPublic: Boolean
    team: Int
    totalValue: Int!
    totalValueCompleted: Int!
    bonusSettings: BonusSettingsInput!
    userId: ID!
  }

  type BingoBoard {
    id: ID!
    type: BingoBoardType!
    layout: [[ID]]! # 2D array of BingoTile IDs
    isPublic: Boolean!
    name: String!
    editors: [ID!]! # List of user IDs
    team: ID
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
    completedBy: ID
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

  type Query {
    getUser(id: ID!): User
    getUsers: [User!]
    getBingoBoard(id: ID!): BingoBoard
    getBingoTile(id: ID!): BingoTile
  }

  type Mutation {
    createUser(username: String!, password: String!, rsn: String, permissions: String!): User
    updateUser(id: ID!, fields: UserUpdateInput!): User
    loginUser(username: String!, password: String!): AuthPayload

    createBingoBoard(
      type: BingoBoardType!
      isPublic: Boolean
      editors: [ID]
      team: ID
      bonusSettings: BonusSettingsInput!
    ): BingoBoard

    editBingoBoard(
      id: ID!
      type: BingoBoardType
      isPublic: Boolean
      editors: [ID]
      team: ID
      bonusSettings: BonusSettingsInput
    ): BingoBoard
    deleteBingoBoard(id: ID!): MutationResponse
    createBingoTile(board: ID!, name: String!, value: Int!, icon: String): BingoTile
    editBingoTile(id: ID!, input: UpdateBingoTileInput!): BingoTile
  }
`;

module.exports = typeDefs;
