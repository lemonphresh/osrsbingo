import { gql } from '@apollo/client';

export const GET_USERS = gql`
  query {
    getUsers {
      id
      admin
      displayName
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
      displayName
      admin
      username
      rsn
      editorBoards {
        id
        name
        isPublic
        layout
        theme
        editors {
          id
          displayName
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
      category
      isPublic
      editors {
        id
        rsn
        displayName
        username
      }
      description
      userId
      name
      theme
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
  query GetPublicBoards($limit: Int, $offset: Int, $category: String, $searchQuery: String) {
    getPublicBoards(
      limit: $limit
      offset: $offset
      category: $category
      searchQuery: $searchQuery
    ) {
      boards {
        id
        category
        name
        layout
        theme
        tiles {
          id
          isComplete
        }
        editors {
          displayName
          username
        }
      }
      totalCount
    }
  }
`;

export const GET_PUBLIC_FEATURED_BOARDS = gql`
  query GetFeaturedBoards($limit: Int, $offset: Int) {
    getFeaturedBoards(limit: $limit, offset: $offset) {
      boards {
        id
        category
        name
        layout
        theme
        tiles {
          id
          isComplete
        }
        editors {
          displayName
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

export const GET_PENDING_INVITATIONS = gql`
  query {
    pendingInvitations {
      id
      boardId
      boardDetails {
        name
        id
      }
      inviterUser {
        displayName
        username
      }
      status
    }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($search: String!) {
    searchUsers(search: $search) {
      id
      admin
      displayName
      username
      rsn
    }
  }
`;

export const SEARCH_USERS_BY_IDS = gql`
  query SearchUsersByIds($ids: [ID!]!) {
    searchUsersByIds(ids: $ids) {
      id
      admin
      displayName
      username
      rsn
    }
  }
`;
