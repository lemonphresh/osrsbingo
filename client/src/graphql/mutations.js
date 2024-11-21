import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation CreateUser($username: String!, $password: String!, $rsn: String, $permissions: String!) {
    createUser(username: $username, password: $password, rsn: $rsn, permissions: $permissions) {
      id
      username
      rsn
      permissions
      token
    }
  }
`;

export const LOGIN_USER = gql`
  mutation LoginUser($username: String!, $password: String!) {
    loginUser(username: $username, password: $password) {
      token
      user {
        id
        username
        rsn
      }
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $fields: UserUpdateInput!) {
    updateUser(id: $id, fields: $fields) {
      id
      username
      rsn
    }
  }
`;

export const CREATE_BOARD = gql`
  mutation CreateBingoBoard(
    $type: BingoBoardType!
    $isPublic: Boolean
    $editors: [ID]
    $team: ID
    $bonusSettings: BonusSettingsInput!
  ) {
    createBingoBoard(
      type: $type
      isPublic: $isPublic
      editors: $editors
      team: $team
      bonusSettings: $bonusSettings
    ) {
      id
      type
      layout
    }
  }
`;

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
