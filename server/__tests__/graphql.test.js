// server/__tests__/graphql.test.js
//
// Schema validation tests - no database required!
// Tests that all queries/mutations are valid against the schema.
// Run with: npm test

const { parse, validate } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { typeDefs } = require('../schema');

// Build schema with mock resolvers (just need structure, not implementation)
const mockResolvers = {
  Query: {},
  Mutation: {},
  Subscription: {},
  DateTime: require('graphql-scalars').DateTimeResolver,
  JSON: require('graphql-scalars').JSONResolver,
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: mockResolvers,
  resolverValidationOptions: { requireResolversForResolveType: 'ignore' },
});

// Helper to validate an operation
const validateOperation = (operationString) => {
  try {
    const document = parse(operationString);
    const errors = validate(schema, document);
    return { valid: errors.length === 0, errors };
  } catch (parseError) {
    return { valid: false, errors: [parseError] };
  }
};

// ============================================================
// USER QUERIES
// ============================================================

describe('User Queries', () => {
  test('GET_USERS', () => {
    const result = validateOperation(`
      query GetUsers {
        getUsers {
          id
          admin
          displayName
          username
          rsn
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('GET_USER', () => {
    const result = validateOperation(`
      query GetUser($id: ID!) {
        getUser(id: $id) {
          id
          displayName
          username
          rsn
          admin
          discordUserId
          editorBoards {
            id
            name
          }
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('SEARCH_USERS', () => {
    const result = validateOperation(`
      query SearchUsers($search: String!) {
        searchUsers(search: $search) {
          id
          displayName
          username
          rsn
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('SEARCH_USERS_BY_IDS', () => {
    const result = validateOperation(`
      query SearchUsersByIds($ids: [ID!]!) {
        searchUsersByIds(ids: $ids) {
          id
          displayName
          username
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('GET_USER_BY_DISCORD_ID', () => {
    const result = validateOperation(`
      query GetUserByDiscordId($discordUserId: String!) {
        getUserByDiscordId(discordUserId: $discordUserId) {
          id
          displayName
          username
          rsn
          discordUserId
        }
      }
    `);
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// BINGO BOARD QUERIES
// ============================================================

describe('BingoBoard Queries', () => {
  test('GET_BOARD', () => {
    const result = validateOperation(`
      query GetBingoBoard($id: ID!) {
        getBingoBoard(id: $id) {
          id
          name
          description
          type
          category
          layout
          isPublic
          theme
          userId
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
          editors {
            id
            displayName
            username
            rsn
          }
          tiles {
            id
            name
            value
            icon
            isComplete
            completedBy
            dateCompleted
          }
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('GET_PUBLIC_BOARDS', () => {
    const result = validateOperation(`
      query GetPublicBoards($limit: Int, $offset: Int, $category: String, $searchQuery: String) {
        getPublicBoards(limit: $limit, offset: $offset, category: $category, searchQuery: $searchQuery) {
          totalCount
          boards {
            id
            name
            category
            layout
            theme
          }
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('GET_ALL_BOARDS', () => {
    const result = validateOperation(`
      query GetAllBoards($limit: Int, $offset: Int) {
        getAllBoards(limit: $limit, offset: $offset) {
          totalCount
          boards {
            id
            name
            category
            isPublic
          }
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('GET_FEATURED_BOARDS', () => {
    const result = validateOperation(`
      query GetFeaturedBoards($limit: Int, $offset: Int) {
        getFeaturedBoards(limit: $limit, offset: $offset) {
          totalCount
          boards {
            id
            name
          }
        }
      }
    `);
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// EDITOR INVITATION QUERIES
// ============================================================

describe('EditorInvitation Queries', () => {
  test('GET_PENDING_INVITATIONS', () => {
    const result = validateOperation(`
      query GetPendingInvitations {
        pendingInvitations {
          id
          boardId
          status
          boardDetails {
            id
            name
          }
          inviterUser {
            displayName
            username
          }
        }
      }
    `);
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// TREASURE HUNT QUERIES
// ============================================================

describe('TreasureHunt Queries', () => {
  test('GET_TREASURE_EVENT', () => {
    const result = validateOperation(`
      query GetTreasureEvent($eventId: ID!) {
        getTreasureEvent(eventId: $eventId) {
          eventId
          eventName
          eventPassword
          status
          clanId
          startDate
          endDate
          eventConfig
          derivedValues
          contentSelections
          mapStructure
          discordConfig
          creatorId
          adminIds
          admins {
            id
            displayName
            username
          }
          teams {
            teamId
            teamName
            currentPot
            completedNodes
            availableNodes
          }
          nodes {
            nodeId
            nodeType
            title
            description
            coordinates
            mapLocation
          }
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('GET_ALL_TREASURE_EVENTS', () => {
    const result = validateOperation(`
      query GetAllTreasureEvents($userId: ID) {
        getAllTreasureEvents(userId: $userId) {
          eventId
          eventName
          status
          startDate
          endDate
          teams {
            teamId
            teamName
          }
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('GET_MY_TREASURE_EVENTS', () => {
    const result = validateOperation(`
      query GetMyTreasureEvents {
        getMyTreasureEvents {
          eventId
          eventName
          status
          startDate
          endDate
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('GET_TREASURE_TEAM', () => {
    const result = validateOperation(`
      query GetTreasureTeam($eventId: ID!, $teamId: ID!) {
        getTreasureTeam(eventId: $eventId, teamId: $teamId) {
          teamId
          teamName
          members
          currentPot
          keysHeld
          completedNodes
          availableNodes
          activeBuffs
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('GET_TREASURE_LEADERBOARD', () => {
    const result = validateOperation(`
      query GetTreasureEventLeaderboard($eventId: ID!) {
        getTreasureEventLeaderboard(eventId: $eventId) {
          teamId
          teamName
          currentPot
          completedNodes
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('GET_PENDING_SUBMISSIONS', () => {
    const result = validateOperation(`
      query GetPendingSubmissions($eventId: ID!) {
        getPendingSubmissions(eventId: $eventId) {
          submissionId
          teamId
          nodeId
          status
          team {
            teamId
            teamName
          }
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('GET_ALL_SUBMISSIONS', () => {
    const result = validateOperation(`
      query GetAllSubmissions($eventId: ID!) {
        getAllSubmissions(eventId: $eventId) {
          submissionId
          teamId
          nodeId
          submittedBy
          submittedByUsername
          channelId
          proofUrl
          status
          reviewedBy
          reviewedAt
          submittedAt
          team {
            teamId
            teamName
          }
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('GET_TREASURE_ACTIVITIES', () => {
    const result = validateOperation(`
      query GetTreasureActivities($eventId: ID!, $limit: Int) {
        getTreasureActivities(eventId: $eventId, limit: $limit) {
          id
          eventId
          teamId
          type
          data
          timestamp
        }
      }
    `);
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// SITE STATS QUERIES
// ============================================================

describe('SiteStats Queries', () => {
  test('GET_VISIT_COUNT', () => {
    const result = validateOperation(`
      query GetVisitCount {
        getVisitCount
      }
    `);
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// USER MUTATIONS
// ============================================================

describe('User Mutations', () => {
  test('CREATE_USER', () => {
    const result = validateOperation(`
      mutation CreateUser($username: String!, $displayName: String!, $password: String!, $rsn: String, $permissions: String!) {
        createUser(username: $username, displayName: $displayName, password: $password, rsn: $rsn, permissions: $permissions) {
          id
          displayName
          username
          token
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('LOGIN_USER', () => {
    const result = validateOperation(`
      mutation LoginUser($username: String!, $password: String!) {
        loginUser(username: $username, password: $password) {
          user {
            id
            displayName
            username
          }
          token
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('UPDATE_USER', () => {
    const result = validateOperation(`
      mutation UpdateUser($id: ID!, $input: UserUpdateInput!) {
        updateUser(id: $id, input: $input) {
          id
          displayName
          rsn
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('DELETE_USER', () => {
    const result = validateOperation(`
      mutation DeleteUser($id: ID!) {
        deleteUser(id: $id) {
          success
          message
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('LINK_DISCORD_ACCOUNT', () => {
    const result = validateOperation(`
      mutation LinkDiscordAccount($userId: ID!, $discordUserId: String!) {
        linkDiscordAccount(userId: $userId, discordUserId: $discordUserId) {
          id
          discordUserId
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('UNLINK_DISCORD_ACCOUNT', () => {
    const result = validateOperation(`
      mutation UnlinkDiscordAccount($userId: ID!) {
        unlinkDiscordAccount(userId: $userId) {
          id
          discordUserId
        }
      }
    `);
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// BINGO BOARD MUTATIONS
// ============================================================

describe('BingoBoard Mutations', () => {
  test('CREATE_BINGO_BOARD', () => {
    const result = validateOperation(`
      mutation CreateBingoBoard($input: CreateBingoBoardInput!) {
        createBingoBoard(input: $input) {
          id
          name
          type
          category
          isPublic
          theme
          layout
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('UPDATE_BINGO_BOARD', () => {
    const result = validateOperation(`
      mutation UpdateBingoBoard($id: ID!, $input: UpdateBingoBoardInput!) {
        updateBingoBoard(id: $id, input: $input) {
          id
          name
          description
          isPublic
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('DELETE_BINGO_BOARD', () => {
    const result = validateOperation(`
      mutation DeleteBingoBoard($id: ID!) {
        deleteBingoBoard(id: $id) {
          success
          message
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('DUPLICATE_BINGO_BOARD', () => {
    const result = validateOperation(`
      mutation DuplicateBingoBoard($boardId: ID!) {
        duplicateBingoBoard(boardId: $boardId) {
          id
          name
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('SHUFFLE_BINGO_BOARD_LAYOUT', () => {
    const result = validateOperation(`
      mutation ShuffleBingoBoardLayout($boardId: ID!) {
        shuffleBingoBoardLayout(boardId: $boardId) {
          id
          layout
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('REPLACE_LAYOUT', () => {
    const result = validateOperation(`
      mutation ReplaceLayout($boardId: ID!, $newType: String!) {
        replaceLayout(boardId: $boardId, newType: $newType) {
          id
          type
          layout
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('UPDATE_BOARD_EDITORS', () => {
    const result = validateOperation(`
      mutation UpdateBoardEditors($boardId: ID!, $editorIds: [ID!]!) {
        updateBoardEditors(boardId: $boardId, editorIds: $editorIds) {
          id
          editors {
            id
            displayName
          }
        }
      }
    `);
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// BINGO TILE MUTATIONS
// ============================================================

describe('BingoTile Mutations', () => {
  test('EDIT_BINGO_TILE', () => {
    const result = validateOperation(`
      mutation EditBingoTile($id: ID!, $input: UpdateBingoTileInput!) {
        editBingoTile(id: $id, input: $input) {
          id
          name
          value
          icon
          isComplete
        }
      }
    `);
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// EDITOR INVITATION MUTATIONS
// ============================================================

describe('EditorInvitation Mutations', () => {
  test('SEND_EDITOR_INVITATION', () => {
    const result = validateOperation(`
      mutation SendEditorInvitation($boardId: ID!, $invitedUserId: ID!) {
        sendEditorInvitation(boardId: $boardId, invitedUserId: $invitedUserId) {
          id
          boardId
          invitedUser {
            id
            displayName
          }
          status
        }
      }
    `);
    if (!result.valid) {
      console.log(
        'SEND_EDITOR_INVITATION errors:',
        result.errors.map((e) => e.message)
      );
    }
    expect(result.valid).toBe(true);
  });

  test('SEND_EDITOR_INVITATIONS', () => {
    const result = validateOperation(`
      mutation SendEditorInvitations($boardId: ID!, $invitedUserIds: [ID!]!) {
        sendEditorInvitations(boardId: $boardId, invitedUserIds: $invitedUserIds) {
          success
          message
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('RESPOND_TO_INVITATION', () => {
    const result = validateOperation(`
      mutation RespondToInvitation($invitationId: ID!, $response: String!) {
        respondToInvitation(invitationId: $invitationId, response: $response) {
          id
          status
        }
      }
    `);
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// TREASURE HUNT MUTATIONS
// ============================================================

describe('TreasureHunt Mutations', () => {
  test('CREATE_TREASURE_EVENT', () => {
    const result = validateOperation(`
      mutation CreateTreasureEvent($input: CreateTreasureEventInput!) {
        createTreasureEvent(input: $input) {
          eventId
          eventName
          status
          eventConfig
          derivedValues
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('UPDATE_TREASURE_EVENT', () => {
    const result = validateOperation(`
      mutation UpdateTreasureEvent($eventId: ID!, $input: UpdateTreasureEventInput!) {
        updateTreasureEvent(eventId: $eventId, input: $input) {
          eventId
          eventName
          status
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('DELETE_TREASURE_EVENT', () => {
    const result = validateOperation(`
      mutation DeleteTreasureEvent($eventId: ID!) {
        deleteTreasureEvent(eventId: $eventId) {
          success
          message
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('GENERATE_TREASURE_MAP', () => {
    const result = validateOperation(`
      mutation GenerateTreasureMap($eventId: ID!) {
        generateTreasureMap(eventId: $eventId) {
          eventId
          mapStructure
          nodes {
            nodeId
            nodeType
            title
          }
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('CREATE_TREASURE_TEAM', () => {
    const result = validateOperation(`
      mutation CreateTreasureTeam($eventId: ID!, $input: CreateTreasureTeamInput!) {
        createTreasureTeam(eventId: $eventId, input: $input) {
          teamId
          teamName
          members
          currentPot
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('UPDATE_TREASURE_TEAM', () => {
    const result = validateOperation(`
      mutation UpdateTreasureTeam($eventId: ID!, $teamId: ID!, $input: JSON!) {
        updateTreasureTeam(eventId: $eventId, teamId: $teamId, input: $input) {
          teamId
          teamName
          currentPot
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('DELETE_TREASURE_TEAM', () => {
    const result = validateOperation(`
      mutation DeleteTreasureTeam($eventId: ID!, $teamId: ID!) {
        deleteTreasureTeam(eventId: $eventId, teamId: $teamId) {
          success
          message
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('ADD_EVENT_ADMIN', () => {
    const result = validateOperation(`
      mutation AddEventAdmin($eventId: ID!, $userId: ID!) {
        addEventAdmin(eventId: $eventId, userId: $userId) {
          eventId
          adminIds
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('REMOVE_EVENT_ADMIN', () => {
    const result = validateOperation(`
      mutation RemoveEventAdmin($eventId: ID!, $userId: ID!) {
        removeEventAdmin(eventId: $eventId, userId: $userId) {
          eventId
          adminIds
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('UPDATE_EVENT_ADMINS', () => {
    const result = validateOperation(`
      mutation UpdateEventAdmins($eventId: ID!, $adminIds: [ID!]!) {
        updateEventAdmins(eventId: $eventId, adminIds: $adminIds) {
          eventId
          adminIds
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('ADMIN_COMPLETE_NODE', () => {
    const result = validateOperation(`
      mutation AdminCompleteNode($eventId: ID!, $teamId: ID!, $nodeId: ID!, $congratsMessage: String) {
        adminCompleteNode(eventId: $eventId, teamId: $teamId, nodeId: $nodeId, congratsMessage: $congratsMessage) {
          teamId
          completedNodes
          availableNodes
          currentPot
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('ADMIN_UNCOMPLETE_NODE', () => {
    const result = validateOperation(`
      mutation AdminUncompleteNode($eventId: ID!, $teamId: ID!, $nodeId: ID!) {
        adminUncompleteNode(eventId: $eventId, teamId: $teamId, nodeId: $nodeId) {
          teamId
          completedNodes
          currentPot
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('SUBMIT_NODE_COMPLETION', () => {
    const result = validateOperation(`
      mutation SubmitNodeCompletion($eventId: ID!, $teamId: ID!, $nodeId: ID!, $proofUrl: String!, $submittedBy: String!, $submittedByUsername: String, $channelId: String) {
        submitNodeCompletion(eventId: $eventId, teamId: $teamId, nodeId: $nodeId, proofUrl: $proofUrl, submittedBy: $submittedBy, submittedByUsername: $submittedByUsername, channelId: $channelId) {
          submissionId
          status
          submittedAt
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('REVIEW_SUBMISSION', () => {
    const result = validateOperation(`
      mutation ReviewSubmission($submissionId: ID!, $approved: Boolean!, $reviewerId: String!, $denialReason: String) {
        reviewSubmission(submissionId: $submissionId, approved: $approved, reviewerId: $reviewerId, denialReason: $denialReason) {
          submissionId
          status
          reviewedBy
          reviewedAt
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('PURCHASE_INN_REWARD', () => {
    const result = validateOperation(`
      mutation PurchaseInnReward($eventId: ID!, $teamId: ID!, $rewardId: ID!) {
        purchaseInnReward(eventId: $eventId, teamId: $teamId, rewardId: $rewardId) {
          teamId
          currentPot
          keysHeld
          innTransactions
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('APPLY_BUFF_TO_NODE', () => {
    const result = validateOperation(`
      mutation ApplyBuffToNode($eventId: ID!, $teamId: ID!, $nodeId: ID!, $buffId: ID!) {
        applyBuffToNode(eventId: $eventId, teamId: $teamId, nodeId: $nodeId, buffId: $buffId) {
          teamId
          activeBuffs
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('ADMIN_GIVE_BUFF', () => {
    const result = validateOperation(`
      mutation AdminGiveBuff($eventId: ID!, $teamId: ID!, $buffType: String!) {
        adminGiveBuff(eventId: $eventId, teamId: $teamId, buffType: $buffType) {
          teamId
          activeBuffs
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('ADMIN_REMOVE_BUFF', () => {
    const result = validateOperation(`
      mutation AdminRemoveBuff($eventId: ID!, $teamId: ID!, $buffId: ID!) {
        adminRemoveBuff(eventId: $eventId, teamId: $teamId, buffId: $buffId) {
          teamId
          activeBuffs
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('ADMIN_REMOVE_BUFF_FROM_NODE', () => {
    const result = validateOperation(`
      mutation AdminRemoveBuffFromNode($eventId: ID!, $teamId: ID!, $nodeId: ID!) {
        adminRemoveBuffFromNode(eventId: $eventId, teamId: $teamId, nodeId: $nodeId) {
          nodeId
          objective
        }
      }
    `);
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// SITE STATS MUTATIONS
// ============================================================

describe('SiteStats Mutations', () => {
  test('INCREMENT_VISIT', () => {
    const result = validateOperation(`
      mutation IncrementVisit {
        incrementVisit
      }
    `);
    expect(result.valid).toBe(true);
  });
});

// ============================================================
// SUBSCRIPTIONS
// ============================================================

describe('Subscriptions', () => {
  test('SUBMISSION_ADDED', () => {
    const result = validateOperation(`
      subscription SubmissionAdded($eventId: ID!) {
        submissionAdded(eventId: $eventId) {
          submissionId
          teamId
          nodeId
          status
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('SUBMISSION_REVIEWED', () => {
    const result = validateOperation(`
      subscription SubmissionReviewed($eventId: ID!) {
        submissionReviewed(eventId: $eventId) {
          submissionId
          status
          reviewedBy
        }
      }
    `);
    expect(result.valid).toBe(true);
  });

  test('NODE_COMPLETED', () => {
    const result = validateOperation(`
      subscription NodeCompleted($eventId: ID!) {
        nodeCompleted(eventId: $eventId) {
          eventId
          teamId
          nodeId
          teamName
          nodeName
        }
      }
    `);
    expect(result.valid).toBe(true);
  });
});

console.log('✅ GraphQL Schema Validation Tests Loaded');
