import { gql } from '@apollo/client';

// ---------------------------------------------------------------------------
// Fragments
// ---------------------------------------------------------------------------

export const DRAFT_PLAYER_FIELDS = gql`
  fragment DraftPlayerFields on DraftPlayerCard {
    id
    alias
    rsn
    womData
    tierBadge
    teamIndex
    pickOrder
  }
`;

export const DRAFT_ROOM_FIELDS = gql`
  fragment DraftRoomFields on DraftRoom {
    roomId
    roomName
    status
    draftFormat
    numberOfTeams
    teams {
      index
      name
      captainJoined
      captainUserId
      budget
    }
    players {
      ...DraftPlayerFields
    }
    pickTimeSeconds
    picksPerTurn
    currentPickIndex
    currentPickStartedAt
    auctionState
    organizerUserId
    createdAt
  }
  ${DRAFT_PLAYER_FIELDS}
`;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const GET_DRAFT_ROOM = gql`
  query GetDraftRoom($roomId: ID!) {
    getDraftRoom(roomId: $roomId) {
      ...DraftRoomFields
    }
  }
  ${DRAFT_ROOM_FIELDS}
`;

export const GET_MY_DRAFT_ROOMS = gql`
  query GetMyDraftRooms {
    getMyDraftRooms {
      roomId
      roomName
      status
      draftFormat
      numberOfTeams
      createdAt
    }
  }
`;

export const FETCH_WOM_STATS = gql`
  query FetchWomStats($rsns: [String!]!) {
    fetchWomStats(rsns: $rsns)
  }
`;

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const CREATE_DRAFT_ROOM = gql`
  mutation CreateDraftRoom($input: CreateDraftRoomInput!) {
    createDraftRoom(input: $input) {
      ...DraftRoomFields
    }
  }
  ${DRAFT_ROOM_FIELDS}
`;

export const JOIN_DRAFT_ROOM_AS_CAPTAIN = gql`
  mutation JoinDraftRoomAsCaptain($roomId: ID!, $teamIndex: Int!, $pin: String) {
    joinDraftRoomAsCaptain(roomId: $roomId, teamIndex: $teamIndex, pin: $pin) {
      room {
        ...DraftRoomFields
      }
      captainToken
      teamIndex
    }
  }
  ${DRAFT_ROOM_FIELDS}
`;

export const START_DRAFT = gql`
  mutation StartDraft($roomId: ID!) {
    startDraft(roomId: $roomId) {
      ...DraftRoomFields
    }
  }
  ${DRAFT_ROOM_FIELDS}
`;

export const MAKE_DRAFT_PICK = gql`
  mutation MakeDraftPick($roomId: ID!, $playerId: ID!, $captainToken: String) {
    makeDraftPick(roomId: $roomId, playerId: $playerId, captainToken: $captainToken) {
      ...DraftRoomFields
    }
  }
  ${DRAFT_ROOM_FIELDS}
`;

export const PLACE_BID = gql`
  mutation PlaceBid($roomId: ID!, $teamIndex: Int!, $amount: Int!, $captainToken: String) {
    placeBid(roomId: $roomId, teamIndex: $teamIndex, amount: $amount, captainToken: $captainToken) {
      ...DraftRoomFields
    }
  }
  ${DRAFT_ROOM_FIELDS}
`;

export const REVEAL_NAMES = gql`
  mutation RevealNames($roomId: ID!) {
    revealNames(roomId: $roomId) {
      ...DraftRoomFields
    }
  }
  ${DRAFT_ROOM_FIELDS}
`;

// ---------------------------------------------------------------------------
// Subscriptions
// ---------------------------------------------------------------------------

export const DRAFT_ROOM_UPDATED = gql`
  subscription DraftRoomUpdated($roomId: ID!) {
    draftRoomUpdated(roomId: $roomId) {
      type
      room {
        ...DraftRoomFields
      }
    }
  }
  ${DRAFT_ROOM_FIELDS}
`;
