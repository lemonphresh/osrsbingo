import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query {
    getUsers {
      id
      username
      rsn
      permissions
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      username
      rsn
      bingoBoards {
        id
        createdAt
        name
        editors {
          id
          rsn
          username
        }
        type
        description
        layout
        isPublic
        bonusSettings {
          allowDiagonals
          horizontalBonus
          verticalBonus
          diagonalBonus
          blackoutBonus
        }
      }
      editorBoards {
        id
        name
        editors {
          id
          username
          rsn
        }
      }
    }
  }
`;

export const GET_BOARD = gql`
  query GetBingoBoard($id: ID!) {
    getBingoBoard(id: $id) {
      id
      type
      layout
      isPublic
      editors {
        id
        rsn
        username
      }
      description
      userId
      name
      team
      totalValue
      totalValueCompleted
      bonusSettings {
        allowDiagonals
        horizontalBonus
        verticalBonus
        diagonalBonus
        blackoutBonus
      }
      tiles {
        id
        icon
        name
        isComplete
        dateCompleted
        completedBy
        value
      }
    }
  }
`;

export const GET_PUBLIC_BOARDS = gql`
  query GetPublicBoards {
    getPublicBoards {
      id
      name
      layout
      tiles {
        id
        isComplete
      }
    }
  }
`;

export const GET_TILE = gql`
  query GetBingoTile($id: ID!) {
    getBingoTile(id: $id) {
      id
      name
      isComplete
      value
      icon
      dateCompleted
      completedBy
      board
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($search: String!) {
    searchUsers(search: $search) {
      id
      username
      rsn
    }
  }
`;

export const SEARCH_USERS_BY_IDS = gql`
  query SearchUsersByIds($ids: [ID!]!) {
    searchUsersByIds(ids: $ids) {
      id
      username
      rsn
    }
  }
`;
