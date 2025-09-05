import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation CreateUser(
    $username: String!
    $displayName: String!
    $password: String!
    $rsn: String
    $permissions: String!
  ) {
    createUser(
      username: $username
      password: $password
      displayName: $displayName
      rsn: $rsn
      permissions: $permissions
    ) {
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

export const DELETE_USER = gql`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id) {
      success
      message
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
          theme
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
        theme
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
      theme
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
      theme
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
      theme
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

export const SHUFFLE_BINGO_BOARD_LAYOUT = gql`
  mutation ShuffleBingoBoardLayout($boardId: ID!) {
    shuffleBingoBoardLayout(boardId: $boardId) {
      id
      name
      category
      type
      layout
      isPublic
      theme
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

export const REPLACE_BINGO_BOARD_LAYOUT = gql`
  mutation ReplaceLayout($boardId: ID!, $newType: String!) {
    replaceLayout(boardId: $boardId, newType: $newType) {
      id
      name
      category
      type
      layout
      theme
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

export const AUTHENTICATE_CALENDAR = gql`
  mutation AuthenticateCalendar($password: String!) {
    authenticateCalendar(password: $password) {
      ok
    }
  }
`;

export const CREATE_CAL_EVENT = gql`
  mutation CreateCalendarEvent($input: CreateCalendarEventInput!) {
    createCalendarEvent(input: $input) {
      id
      title
      description
      start
      end
      allDay
      eventType
    }
  }
`;

export const UPDATE_CAL_EVENT = gql`
  mutation UpdateCalendarEvent($id: ID!, $input: UpdateCalendarEventInput!) {
    updateCalendarEvent(id: $id, input: $input) {
      id
      title
      description
      start
      end
      allDay
      eventType
    }
  }
`;

export const DELETE_CAL_EVENT = gql`
  mutation DeleteCalendarEvent($id: ID!) {
    deleteCalendarEvent(id: $id)
  }
`;

export const LIST_SAVED_CAL_EVENTS = gql`
  query SavedCalendarEvents($offset: Int, $limit: Int) {
    savedCalendarEvents(offset: $offset, limit: $limit) {
      totalCount
      items {
        id
        title
        description
        eventType
        allDay
        updatedAt
      }
    }
  }
`;

export const SAVE_CAL_EVENT = gql`
  mutation SaveCalendarEvent($id: ID!) {
    saveCalendarEvent(id: $id) {
      id
      status
    }
  }
`;

export const RESTORE_CAL_EVENT = gql`
  mutation RestoreCalendarEvent($id: ID!, $start: DateTime!, $end: DateTime!) {
    restoreCalendarEvent(id: $id, start: $start, end: $end) {
      id
      status
      start
      end
    }
  }
`;
