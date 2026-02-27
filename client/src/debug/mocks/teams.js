import { MOCK_BUFFS } from './buffs';

const now = new Date();
const hoursAgo = (h) => new Date(now - h * 3600000).toISOString();

export const MOCK_BUFF_HISTORY = {
  empty: [],

  single: [
    {
      buffId: 'buff_001',
      buffName: "Slayer's Edge",
      usedOn: 'node_003',
      usedAt: hoursAgo(2),
      originalRequirement: 100,
      reducedRequirement: 75,
      benefit: 'Saved 25 boss_kc',
    },
  ],

  multiple: [
    {
      buffId: 'buff_001',
      buffName: "Slayer's Edge",
      usedOn: 'node_003',
      usedAt: hoursAgo(1),
      originalRequirement: 100,
      reducedRequirement: 75,
      benefit: 'Saved 25 boss_kc',
    },
    {
      buffId: 'buff_002',
      buffName: 'Training Momentum',
      usedOn: 'node_med_001',
      usedAt: hoursAgo(6),
      originalRequirement: 50000,
      reducedRequirement: 25000,
      benefit: 'Saved 25000 xp_gain',
    },
    {
      buffId: 'buff_003',
      buffName: 'Legendary Gatherer',
      usedOn: 'node_easy_001',
      usedAt: hoursAgo(24),
      originalRequirement: 500,
      reducedRequirement: 125,
      benefit: 'Saved 375 item_collection',
    },
    {
      buffId: 'buff_004',
      buffName: 'Versatile Training',
      usedOn: 'node_buff_applied',
      usedAt: hoursAgo(48),
      originalRequirement: 200,
      reducedRequirement: 100,
      benefit: 'Saved 100 boss_kc',
    },
  ],
};

const BASE_TEAM = {
  teamId: 'team_001',
  eventId: 'event_001',
  teamName: 'Team Red',
  discordRoleId: '333333333333333333',
  members: [
    {
      discordUserId: '111111111111111111',
      discordUsername: 'TestPlayer',
      discordAvatar: null,
      username: 'testplayer',
    },
  ],
  currentPot: '15000000',
  completedNodes: ['node_001', 'node_002'],
  availableNodes: ['node_003', 'node_inn_001', 'node_easy_001'],
  buffHistory: MOCK_BUFF_HISTORY.empty,
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
