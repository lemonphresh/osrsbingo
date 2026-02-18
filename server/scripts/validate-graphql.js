// Standalone script to validate all GraphQL operations against your schema
// Run with: node scripts/validate-graphql.js

const { parse, validate } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { typeDefs, resolvers } = require('../schema');

// Build schema
const schema = makeExecutableSchema({ typeDefs, resolvers });

// ============================================================
// ALL OPERATIONS TO VALIDATE
// ============================================================

const operations = {
  // QUERIES
  GET_USERS: `
    query GetUsers {
      getUsers { id admin displayName username rsn }
    }
  `,

  GET_USER: `
    query GetUser($id: ID!) {
      getUser(id: $id) {
        id displayName username rsn admin discordUserId
        editorBoards { id name }
      }
    }
  `,

  SEARCH_USERS: `
    query SearchUsers($search: String!) {
      searchUsers(search: $search) { id displayName username rsn }
    }
  `,

  SEARCH_USERS_BY_IDS: `
    query SearchUsersByIds($ids: [ID!]!) {
      searchUsersByIds(ids: $ids) { id displayName username }
    }
  `,

  GET_BOARD: `
    query GetBingoBoard($id: ID!) {
      getBingoBoard(id: $id) {
        id name description type category layout isPublic theme userId team
        totalValue totalValueCompleted
        bonusSettings { allowDiagonals horizontalBonus verticalBonus diagonalBonus blackoutBonus }
        editors { id displayName username rsn }
        tiles { id name value icon isComplete completedBy dateCompleted }
      }
    }
  `,

  GET_PUBLIC_BOARDS: `
    query GetPublicBoards($limit: Int, $offset: Int, $category: String, $searchQuery: String) {
      getPublicBoards(limit: $limit, offset: $offset, category: $category, searchQuery: $searchQuery) {
        totalCount
        boards { id name category layout theme }
      }
    }
  `,

  GET_ALL_BOARDS: `
    query GetAllBoards($limit: Int, $offset: Int) {
      getAllBoards(limit: $limit, offset: $offset) {
        totalCount
        boards { id name category isPublic }
      }
    }
  `,

  GET_FEATURED_BOARDS: `
    query GetFeaturedBoards($limit: Int, $offset: Int) {
      getFeaturedBoards(limit: $limit, offset: $offset) {
        totalCount
        boards { id name }
      }
    }
  `,

  GET_PENDING_INVITATIONS: `
    query GetPendingInvitations {
      pendingInvitations {
        id boardId status
        boardDetails { id name }
        inviterUser { displayName username }
      }
    }
  `,

  GET_TREASURE_EVENT: `
    query GetTreasureEvent($eventId: ID!) {
      getTreasureEvent(eventId: $eventId) {
        eventId eventName eventPassword status clanId
        startDate endDate createdAt updatedAt
        eventConfig derivedValues contentSelections mapStructure discordConfig
        creatorId adminIds
        admins { id displayName username }
        teams {
          teamId teamName discordRoleId members currentPot
          keysHeld completedNodes availableNodes activeBuffs buffHistory
          submissions { submissionId status }
        }
        nodes {
          nodeId nodeType title description coordinates mapLocation
          locationGroupId difficultyTier prerequisites unlocks paths
          objective rewards innTier availableRewards
        }
      }
    }
  `,

  GET_ALL_TREASURE_EVENTS: `
    query GetAllTreasureEvents($userId: ID) {
      getAllTreasureEvents(userId: $userId) {
        eventId eventName status startDate endDate creatorId adminIds
        teams { teamId teamName currentPot completedNodes }
      }
    }
  `,

  GET_MY_TREASURE_EVENTS: `
    query GetMyTreasureEvents {
      getMyTreasureEvents {
        eventId eventName status startDate endDate
        teams { teamId teamName }
      }
    }
  `,

  GET_TREASURE_TEAM: `
    query GetTreasureTeam($eventId: ID!, $teamId: ID!) {
      getTreasureTeam(eventId: $eventId, teamId: $teamId) {
        teamId teamName members currentPot keysHeld
        completedNodes availableNodes innTransactions activeBuffs buffHistory
      }
    }
  `,

  GET_TREASURE_LEADERBOARD: `
    query GetTreasureEventLeaderboard($eventId: ID!) {
      getTreasureEventLeaderboard(eventId: $eventId) {
        teamId teamName currentPot completedNodes keysHeld
      }
    }
  `,

  GET_PENDING_SUBMISSIONS: `
    query GetPendingSubmissions($eventId: ID!) {
      getPendingSubmissions(eventId: $eventId) {
        submissionId teamId nodeId submittedBy status
        team { teamId teamName }
      }
    }
  `,

  GET_ALL_SUBMISSIONS: `
    query GetAllSubmissions($eventId: ID!) {
      getAllSubmissions(eventId: $eventId) {
        submissionId teamId nodeId submittedBy submittedByUsername
        channelId proofUrl status reviewedBy reviewedAt submittedAt
        team { teamId teamName }
      }
    }
  `,

  GET_TREASURE_ACTIVITIES: `
    query GetTreasureActivities($eventId: ID!, $limit: Int) {
      getTreasureActivities(eventId: $eventId, limit: $limit) {
        id eventId teamId type data timestamp
      }
    }
  `,

  GET_VISIT_COUNT: `
    query GetVisitCount { getVisitCount }
  `,

  GET_CALENDAR_EVENTS: `
    query GetCalendarEvents($offset: Int, $limit: Int) {
      calendarEvents(offset: $offset, limit: $limit) {
        totalCount
        items { id title description start end allDay eventType }
      }
    }
  `,

  // MUTATIONS
  CREATE_USER: `
    mutation CreateUser($username: String!, $displayName: String!, $password: String!, $rsn: String, $permissions: String!) {
      createUser(username: $username, displayName: $displayName, password: $password, rsn: $rsn, permissions: $permissions) {
        id displayName username token
      }
    }
  `,

  LOGIN_USER: `
    mutation LoginUser($username: String!, $password: String!) {
      loginUser(username: $username, password: $password) {
        user { id displayName username }
        token
      }
    }
  `,

  UPDATE_USER: `
    mutation UpdateUser($id: ID!, $input: UserUpdateInput!) {
      updateUser(id: $id, input: $input) { id displayName rsn }
    }
  `,

  DELETE_USER: `
    mutation DeleteUser($id: ID!) {
      deleteUser(id: $id) { success message }
    }
  `,

  LINK_DISCORD: `
    mutation LinkDiscordAccount($userId: ID!, $discordUserId: String!) {
      linkDiscordAccount(userId: $userId, discordUserId: $discordUserId) { id discordUserId }
    }
  `,

  UNLINK_DISCORD: `
    mutation UnlinkDiscordAccount($userId: ID!) {
      unlinkDiscordAccount(userId: $userId) { id discordUserId }
    }
  `,

  CREATE_BINGO_BOARD: `
    mutation CreateBingoBoard($input: CreateBingoBoardInput!) {
      createBingoBoard(input: $input) {
        id name type category isPublic theme layout
        tiles { id name }
        editors { id displayName }
      }
    }
  `,

  UPDATE_BINGO_BOARD: `
    mutation UpdateBingoBoard($id: ID!, $input: UpdateBingoBoardInput!) {
      updateBingoBoard(id: $id, input: $input) { id name description isPublic }
    }
  `,

  DELETE_BINGO_BOARD: `
    mutation DeleteBingoBoard($id: ID!) {
      deleteBingoBoard(id: $id) { success message }
    }
  `,

  DUPLICATE_BINGO_BOARD: `
    mutation DuplicateBingoBoard($boardId: ID!) {
      duplicateBingoBoard(boardId: $boardId) { id name tiles { id } }
    }
  `,

  SHUFFLE_LAYOUT: `
    mutation ShuffleBingoBoardLayout($boardId: ID!) {
      shuffleBingoBoardLayout(boardId: $boardId) { id layout }
    }
  `,

  REPLACE_LAYOUT: `
    mutation ReplaceLayout($boardId: ID!, $newType: String!) {
      replaceLayout(boardId: $boardId, newType: $newType) { id type layout }
    }
  `,

  UPDATE_BOARD_EDITORS: `
    mutation UpdateBoardEditors($boardId: ID!, $editorIds: [ID!]!) {
      updateBoardEditors(boardId: $boardId, editorIds: $editorIds) {
        id editors { id displayName }
      }
    }
  `,

  EDIT_BINGO_TILE: `
    mutation EditBingoTile($id: ID!, $input: UpdateBingoTileInput!) {
      editBingoTile(id: $id, input: $input) { id name value icon isComplete }
    }
  `,

  SEND_EDITOR_INVITATION: `
    mutation SendEditorInvitation($boardId: ID!, $invitedUserId: ID!) {
      sendEditorInvitation(boardId: $boardId, invitedUserId: $invitedUserId) {
        id boardId invitedUser { id displayName } status
      }
    }
  `,

  SEND_EDITOR_INVITATIONS: `
    mutation SendEditorInvitations($boardId: ID!, $invitedUserIds: [ID!]!) {
      sendEditorInvitations(boardId: $boardId, invitedUserIds: $invitedUserIds) {
        success message
      }
    }
  `,

  RESPOND_TO_INVITATION: `
    mutation RespondToInvitation($invitationId: ID!, $response: String!) {
      respondToInvitation(invitationId: $invitationId, response: $response) { id status }
    }
  `,

  CREATE_TREASURE_EVENT: `
    mutation CreateTreasureEvent($input: CreateTreasureEventInput!) {
      createTreasureEvent(input: $input) {
        eventId eventName status eventConfig derivedValues
      }
    }
  `,

  UPDATE_TREASURE_EVENT: `
    mutation UpdateTreasureEvent($eventId: ID!, $input: UpdateTreasureEventInput!) {
      updateTreasureEvent(eventId: $eventId, input: $input) { eventId eventName status }
    }
  `,

  DELETE_TREASURE_EVENT: `
    mutation DeleteTreasureEvent($eventId: ID!) {
      deleteTreasureEvent(eventId: $eventId) { success message }
    }
  `,

  GENERATE_TREASURE_MAP: `
    mutation GenerateTreasureMap($eventId: ID!) {
      generateTreasureMap(eventId: $eventId) {
        eventId mapStructure
        nodes { nodeId nodeType title }
      }
    }
  `,

  CREATE_TREASURE_TEAM: `
    mutation CreateTreasureTeam($eventId: ID!, $input: CreateTreasureTeamInput!) {
      createTreasureTeam(eventId: $eventId, input: $input) {
        teamId teamName members currentPot
      }
    }
  `,

  UPDATE_TREASURE_TEAM: `
    mutation UpdateTreasureTeam($eventId: ID!, $teamId: ID!, $input: JSON!) {
      updateTreasureTeam(eventId: $eventId, teamId: $teamId, input: $input) {
        teamId teamName currentPot
      }
    }
  `,

  DELETE_TREASURE_TEAM: `
    mutation DeleteTreasureTeam($eventId: ID!, $teamId: ID!) {
      deleteTreasureTeam(eventId: $eventId, teamId: $teamId) { success message }
    }
  `,

  ADD_EVENT_ADMIN: `
    mutation AddEventAdmin($eventId: ID!, $userId: ID!) {
      addEventAdmin(eventId: $eventId, userId: $userId) { eventId adminIds }
    }
  `,

  REMOVE_EVENT_ADMIN: `
    mutation RemoveEventAdmin($eventId: ID!, $userId: ID!) {
      removeEventAdmin(eventId: $eventId, userId: $userId) { eventId adminIds }
    }
  `,

  UPDATE_EVENT_ADMINS: `
    mutation UpdateEventAdmins($eventId: ID!, $adminIds: [ID!]!) {
      updateEventAdmins(eventId: $eventId, adminIds: $adminIds) { eventId adminIds }
    }
  `,

  ADMIN_COMPLETE_NODE: `
    mutation AdminCompleteNode($eventId: ID!, $teamId: ID!, $nodeId: ID!, $congratsMessage: String) {
      adminCompleteNode(eventId: $eventId, teamId: $teamId, nodeId: $nodeId, congratsMessage: $congratsMessage) {
        teamId completedNodes availableNodes currentPot keysHeld activeBuffs
      }
    }
  `,

  ADMIN_UNCOMPLETE_NODE: `
    mutation AdminUncompleteNode($eventId: ID!, $teamId: ID!, $nodeId: ID!) {
      adminUncompleteNode(eventId: $eventId, teamId: $teamId, nodeId: $nodeId) {
        teamId completedNodes currentPot
      }
    }
  `,

  SUBMIT_NODE_COMPLETION: `
    mutation SubmitNodeCompletion($eventId: ID!, $teamId: ID!, $nodeId: ID!, $proofUrl: String!, $submittedBy: String!, $submittedByUsername: String, $channelId: String) {
      submitNodeCompletion(eventId: $eventId, teamId: $teamId, nodeId: $nodeId, proofUrl: $proofUrl, submittedBy: $submittedBy, submittedByUsername: $submittedByUsername, channelId: $channelId) {
        submissionId status submittedAt
      }
    }
  `,

  REVIEW_SUBMISSION: `
    mutation ReviewSubmission($submissionId: ID!, $approved: Boolean!, $reviewerId: String!, $denialReason: String) {
      reviewSubmission(submissionId: $submissionId, approved: $approved, reviewerId: $reviewerId, denialReason: $denialReason) {
        submissionId status reviewedBy reviewedAt
      }
    }
  `,

  PURCHASE_INN_REWARD: `
    mutation PurchaseInnReward($eventId: ID!, $teamId: ID!, $rewardId: ID!) {
      purchaseInnReward(eventId: $eventId, teamId: $teamId, rewardId: $rewardId) {
        teamId currentPot keysHeld innTransactions activeBuffs
      }
    }
  `,

  APPLY_BUFF_TO_NODE: `
    mutation ApplyBuffToNode($eventId: ID!, $teamId: ID!, $nodeId: ID!, $buffId: ID!) {
      applyBuffToNode(eventId: $eventId, teamId: $teamId, nodeId: $nodeId, buffId: $buffId) {
        teamId activeBuffs
      }
    }
  `,

  ADMIN_GIVE_BUFF: `
    mutation AdminGiveBuff($eventId: ID!, $teamId: ID!, $buffType: String!) {
      adminGiveBuff(eventId: $eventId, teamId: $teamId, buffType: $buffType) {
        teamId activeBuffs
      }
    }
  `,

  ADMIN_REMOVE_BUFF: `
    mutation AdminRemoveBuff($eventId: ID!, $teamId: ID!, $buffId: ID!) {
      adminRemoveBuff(eventId: $eventId, teamId: $teamId, buffId: $buffId) {
        teamId activeBuffs
      }
    }
  `,

  ADMIN_REMOVE_BUFF_FROM_NODE: `
    mutation AdminRemoveBuffFromNode($eventId: ID!, $teamId: ID!, $nodeId: ID!) {
      adminRemoveBuffFromNode(eventId: $eventId, teamId: $teamId, nodeId: $nodeId) {
        nodeId objective
      }
    }
  `,

  INCREMENT_VISIT: `
    mutation IncrementVisit { incrementVisit }
  `,
};

// ============================================================
// VALIDATION
// ============================================================

console.log('\n🔍 Validating GraphQL Operations...\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;
const failures = [];

for (const [name, operation] of Object.entries(operations)) {
  try {
    const document = parse(operation);
    const errors = validate(schema, document);

    if (errors.length > 0) {
      failed++;
      failures.push({ name, errors });
      console.log(`❌ ${name}`);
      errors.forEach((err) => console.log(`   └─ ${err.message}`));
    } else {
      passed++;
      console.log(`✅ ${name}`);
    }
  } catch (parseError) {
    failed++;
    failures.push({ name, errors: [parseError] });
    console.log(`❌ ${name}`);
    console.log(`   └─ Parse Error: ${parseError.message}`);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failures.length > 0) {
  console.log('🔴 FAILED OPERATIONS:');
  failures.forEach(({ name, errors }) => {
    console.log(`\n  ${name}:`);
    errors.forEach((err) => console.log(`    - ${err.message}`));
  });
  console.log('\n');
  process.exit(1);
} else {
  console.log('🎉 All operations are valid!\n');
  process.exit(0);
}
