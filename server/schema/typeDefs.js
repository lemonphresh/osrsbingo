const { gql } = require('graphql-tag');

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    rsn: String
    permissions: [String]
    token: String
    teams: [String]
  }

  type Query {
    getUser(id: ID!): User
    getUsers: [User!]
  }

  type Mutation {
    createUser(username: String!, password: String!, rsn: String, permissions: String!): User
  }

  type AuthPayload {
    user: User
    token: String
  }

  type Mutation {
    loginUser(username: String!, password: String!): AuthPayload
  }
`;

module.exports = typeDefs;
