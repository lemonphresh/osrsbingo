import { MOCK_BUFFS } from './buffs';

const BASE_TEAM = {
  teamId: 'team_001',
  eventId: 'event_001',
  teamName: 'Team Red',
  discordRoleId: '333333333333333333',
  members: ['111111111111111111'], // matches MOCK_USERS.member
  currentPot: '15000000',
  completedNodes: ['node_001', 'node_002'],
  availableNodes: ['node_003', 'node_inn_001', 'node_easy_001'],
  buffHistory: [],
  innTransactions: [],
};

export const MOCK_TEAMS = {
  with_keys: {
    ...BASE_TEAM,
    keysHeld: [
      { color: 'red', quantity: 3 },
      { color: 'blue', quantity: 2 },
      { color: 'green', quantity: 1 },
    ],
    activeBuffs: MOCK_BUFFS.none,
  },

  no_keys: {
    ...BASE_TEAM,
    keysHeld: [],
    activeBuffs: MOCK_BUFFS.none,
  },

  partial_keys: {
    ...BASE_TEAM,
    keysHeld: [{ color: 'red', quantity: 1 }],
    activeBuffs: MOCK_BUFFS.none,
  },

  already_purchased: {
    ...BASE_TEAM,
    keysHeld: [{ color: 'red', quantity: 1 }],
    activeBuffs: MOCK_BUFFS.none,
    innTransactions: [
      {
        nodeId: 'node_inn_001',
        rewardId: 'inn1_gp_small',
        keysSpent: [{ color: 'red', quantity: 2 }],
        payout: 8000000,
        buffsGranted: [],
        purchasedAt: new Date().toISOString(),
      },
    ],
  },

  with_buffs: {
    ...BASE_TEAM,
    keysHeld: [
      { color: 'red', quantity: 3 },
      { color: 'blue', quantity: 2 },
    ],
    activeBuffs: MOCK_BUFFS.multiple,
  },

  with_single_buff: {
    ...BASE_TEAM,
    keysHeld: [{ color: 'red', quantity: 3 }],
    activeBuffs: MOCK_BUFFS.minor_kill,
  },

  with_xp_buffs_only: {
    ...BASE_TEAM,
    keysHeld: [{ color: 'red', quantity: 3 }],
    activeBuffs: MOCK_BUFFS.moderate_xp,
  },

  rich: {
    ...BASE_TEAM,
    teamName: 'Team Blue',
    currentPot: '85000000',
    keysHeld: [
      { color: 'red', quantity: 8 },
      { color: 'blue', quantity: 6 },
      { color: 'green', quantity: 4 },
    ],
    activeBuffs: MOCK_BUFFS.multiple,
  },

  empty: {
    ...BASE_TEAM,
    teamName: 'Empty Team',
    currentPot: '0',
    keysHeld: [],
    completedNodes: [],
    availableNodes: ['node_start'],
    activeBuffs: MOCK_BUFFS.none,
    innTransactions: [],
  },
};
