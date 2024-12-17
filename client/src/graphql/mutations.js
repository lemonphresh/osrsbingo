import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation CreateUser($username: String!, $password: String!, $rsn: String, $permissions: String!) {
    createUser(username: $username, password: $password, rsn: $rsn, permissions: $permissions) {
      id
      admin
      displayName
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
        admin
        displayName
        username
        rsn
        editorBoards {
          id
          name
          category
          type
          description
          layout
          isPublic
          tiles {
            id
            isComplete
          }
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
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: ID!, $input: UserUpdateInput!) {
    updateUser(id: $id, input: $input) {
      id
      admin
      displayName
      username
      rsn
      editorBoards {
        id
        name
        category
        type
        description
        layout
        isPublic
        tiles {
          id
          isComplete
        }
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

export const CREATE_BOARD = gql`
  mutation CreateBingoBoard($input: CreateBingoBoardInput!) {
    createBingoBoard(input: $input) {
      id
      name
      category
      description
      type
      isPublic
      editors {
        id
        displayName
        username
        rsn
      }
      team
      layout
      bonusSettings {
        allowDiagonals
        horizontalBonus
        verticalBonus
        diagonalBonus
        blackoutBonus
      }
      tiles {
        id
        name
        value
      }
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

export const DELETE_BOARD = gql`
  mutation DeleteBingoBoard($id: ID!) {
    deleteBingoBoard(id: $id) {
      success
      message
    }
  }
`;

export const UPDATE_BOARD = gql`
  mutation UpdateBingoBoard($id: ID!, $input: UpdateBingoBoardInput!) {
    updateBingoBoard(id: $id, input: $input) {
      id
      name
      type
      category
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
`;

export const DUPLICATE_BINGO_BOARD = gql`
  mutation DuplicateBingoBoard($boardId: ID!) {
    duplicateBingoBoard(boardId: $boardId) {
      id
      name
      category
      type
      layout
      isPublic
      bonusSettings {
        allowDiagonals
        horizontalBonus
        verticalBonus
        diagonalBonus
        blackoutBonus
      }
      tiles {
        id
        name
        isComplete
        value
      }
    }
  }
`;

export const UPDATE_BOARD_EDITORS = gql`
  mutation updateBoardEditors($boardId: ID!, $editorIds: [ID!]!) {
    updateBoardEditors(boardId: $boardId, editorIds: $editorIds) {
      id
      name
      editors {
        id
        displayName
        username
        rsn
      }
    }
  }
`;

export const RESPOND_TO_INVITATION = gql`
  mutation RespondToInvitation($invitationId: ID!, $response: String!) {
    respondToInvitation(invitationId: $invitationId, response: $response) {
      id
      status
    }
  }
`;

export const SEND_EDITOR_INVITATIONS = gql`
  mutation SendEditorInvitations($boardId: ID!, $invitedUserIds: [ID!]!) {
    sendEditorInvitations(boardId: $boardId, invitedUserIds: $invitedUserIds) {
      success
      message
    }
  }
`;
