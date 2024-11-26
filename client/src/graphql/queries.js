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
        name
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
      editors
      description
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
