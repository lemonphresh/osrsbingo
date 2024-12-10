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
      editorBoards {
        id
        name
        isPublic
        layout
        editors {
          id
          username
          rsn
        }
        tiles {
          id
          isComplete
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
  query GetPublicBoards($limit: Int, $offset: Int) {
    getPublicBoards(limit: $limit, offset: $offset) {
      boards {
        id
        name
        layout
        tiles {
          id
          isComplete
        }
        editors {
          username
        }
      }
      totalCount
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
