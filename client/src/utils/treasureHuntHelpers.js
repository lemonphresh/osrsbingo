const OBJECTIVE_TYPES = {
  boss_kc: 'Boss Kill Count',
  xp_gain: 'XP Gain',
  minigame: 'Mini Game',
  item_collection: 'Item Collection',
  clue_scrolls: 'Clue Scrolls',
};

// ============================================
// OSRS CONTENT COLLECTIONS
// ============================================
// These collections define all available content that can be used in objectives.
// Each item includes metadata for filtering, categorization, and UI display.

/**
 * Regular monster/slayer task definitions
 * objectiveCollections.js
      ├── SOLO_BOSSES       (Vorkath, Zulrah, GWD, etc.)
      ├── RAIDS             (CoX, ToB, ToA)
      ├── SKILLS            (All 23 skills)
      ├── MINIGAMES         (Tempoross, Wintertodt, etc.)
      ├── COLLECTIBLE_ITEMS (Feathers, Logs, Ore, etc.)
      └── CLUE_TIERS        (Easy, Medium, Hard, Elite, Master)
 */

/**
 * Solo boss definitions
 */
const SOLO_BOSSES = {
  // Easy Bosses
  giantMole: {
    id: 'giantMole',
    name: 'Giant Mole',
    category: 'easy',
    combatLevel: 230,
    tags: ['safe', 'beginner', 'falador'],
    enabled: true,
  },
  sarachnis: {
    id: 'sarachnis',
    name: 'Sarachnis',
    category: 'easy',
    combatLevel: 318,
    tags: ['spider', 'f2p-accessible'],
    enabled: true,
  },
  obor: {
    id: 'obor',
    name: 'Obor',
    category: 'easy',
    combatLevel: 106,
    tags: ['f2p', 'key', 'giant'],
    enabled: true,
  },

  // Medium Bosses
  vorkath: {
    id: 'vorkath',
    name: 'Vorkath',
    category: 'medium',
    combatLevel: 732,
    tags: ['dragon', 'quest', 'profitable'],
    enabled: true,
  },
  zulrah: {
    id: 'zulrah',
    name: 'Zulrah',
    category: 'medium',
    combatLevel: 725,
    tags: ['snake', 'quest', 'profitable', 'rotation'],
    enabled: true,
  },
  barrows: {
    id: 'barrows',
    name: 'Barrows',
    category: 'medium',
    combatLevel: 115, // Dharok max
    tags: ['minigame', 'multiple', 'prayer'],
    enabled: true,
  },
  grotesqueGuardians: {
    id: 'grotesqueGuardians',
    name: 'Grotesque Guardians',
    category: 'medium',
    combatLevel: 394,
    tags: ['slayer', 'rooftop', 'duo'],
    enabled: true,
  },
  araxxor: {
    id: 'araxxor',
    name: 'Araxxor',
    category: 'medium',
    combatLevel: 695,
    tags: ['spider', 'new', 'path-based'],
    enabled: true,
  },

  // Hard/Wildy Bosses
  venenatis: {
    id: 'venenatis',
    name: 'Venenatis',
    category: 'wilderness',
    combatLevel: 464,
    tags: ['wilderness', 'spider', 'dangerous'],
    enabled: true,
  },
  callisto: {
    id: 'callisto',
    name: 'Callisto',
    category: 'wilderness',
    combatLevel: 470,
    tags: ['wilderness', 'bear', 'dangerous'],
    enabled: true,
  },
  corporealBeast: {
    id: 'corporealBeast',
    name: 'Corporeal Beast',
    category: 'hard',
    combatLevel: 785,
    tags: ['group', 'difficult', 'spirit-shields'],
    enabled: true,
  },

  // God Wars Dungeon
  commanderZilyana: {
    id: 'commanderZilyana',
    name: 'Commander Zilyana',
    category: 'medium',
    combatLevel: 596,
    tags: ['gwd', 'saradomin', 'group-friendly'],
    enabled: true,
  },
  generalGraardor: {
    id: 'generalGraardor',
    name: 'General Graardor',
    category: 'medium',
    combatLevel: 624,
    tags: ['gwd', 'bandos', 'group-friendly'],
    enabled: true,
  },
  kreeArra: {
    id: 'kreeArra',
    name: "Kree'Arra",
    category: 'medium',
    combatLevel: 580,
    tags: ['gwd', 'armadyl', 'ranged', 'group-friendly'],
    enabled: true,
  },
  krilTsutsaroth: {
    id: 'krilTsutsaroth',
    name: "K'ril Tsutsaroth",
    category: 'medium',
    combatLevel: 650,
    tags: ['gwd', 'zamorak', 'group-friendly'],
    enabled: true,
  },

  // More Bosses
  cerberus: {
    id: 'cerberus',
    name: 'Cerberus',
    category: 'hard',
    combatLevel: 318,
    tags: ['slayer', 'hellhound', '91-slayer'],
    enabled: true,
  },
  thermonuclearSmokeDevil: {
    id: 'thermonuclearSmokeDevil',
    name: 'Thermonuclear Smoke Devil',
    category: 'medium',
    combatLevel: 301,
    tags: ['slayer', '93-slayer'],
    enabled: true,
  },
  krakenBoss: {
    id: 'krakenBoss',
    name: 'Kraken',
    category: 'easy',
    combatLevel: 291,
    tags: ['slayer', '87-slayer', 'afk'],
    enabled: true,
  },
};

/**
 * Raid definitions
 */
const RAIDS = {
  chambersOfXeric: {
    id: 'chambersOfXeric',
    name: 'Chambers of Xeric',
    shortName: 'CoX',
    category: 'raid',
    groupSize: { min: 1, max: 100, recommended: '3-5' },
    tags: ['raid', 'group', 'scaling'],
    enabled: true,
  },
  theatreOfBlood: {
    id: 'theatreOfBlood',
    name: 'Theatre of Blood',
    shortName: 'ToB',
    category: 'raid',
    groupSize: { min: 1, max: 5, recommended: '4-5' },
    tags: ['raid', 'group', 'difficult'],
    enabled: true,
  },
  tombsOfAmascut: {
    id: 'tombsOfAmascut',
    name: 'Tombs of Amascut',
    shortName: 'ToA',
    category: 'raid',
    groupSize: { min: 1, max: 8, recommended: '2-4' },
    tags: ['raid', 'group', 'scaling', 'invocation'],
    enabled: true,
  },
};

/**
 * Skilling activities
 */
const SKILLS = {
  // Production Skills
  fishing: {
    id: 'fishing',
    name: 'Fishing',
    category: 'gathering',
    tags: ['afk', 'relaxing', 'profitable'],
    icon: '🎣',
  },
  woodcutting: {
    id: 'woodcutting',
    name: 'Woodcutting',
    category: 'gathering',
    tags: ['afk', 'relaxing'],
    icon: '🪓',
  },
  mining: {
    id: 'mining',
    name: 'Mining',
    category: 'gathering',
    tags: ['afk', 'relaxing', 'profitable'],
    icon: '⛏️',
  },

  // Artisan Skills
  runecrafting: {
    id: 'runecrafting',
    name: 'Runecrafting',
    category: 'artisan',
    tags: ['slow', 'profitable'],
    icon: '✨',
  },
  agility: {
    id: 'agility',
    name: 'Agility',
    category: 'support',
    tags: ['click-intensive', 'useful'],
    icon: '🏃',
  },
  thieving: {
    id: 'thieving',
    name: 'Thieving',
    category: 'support',
    tags: ['click-intensive', 'profitable'],
    icon: '🕵️',
  },
  slayer: {
    id: 'slayer',
    name: 'Slayer',
    category: 'combat',
    tags: ['combat', 'varied', 'profitable'],
    icon: '⚔️',
  },
  herblore: {
    id: 'herblore',
    name: 'Herblore',
    category: 'artisan',
    tags: ['expensive', 'useful'],
    icon: '🧪',
  },
  construction: {
    id: 'construction',
    name: 'Construction',
    category: 'artisan',
    tags: ['expensive', 'useful', 'fast'],
    icon: '🏠',
  },
  cooking: {
    id: 'cooking',
    name: 'Cooking',
    category: 'artisan',
    tags: ['fast', 'easy'],
    icon: '🍳',
  },
  smithing: {
    id: 'smithing',
    name: 'Smithing',
    category: 'artisan',
    tags: ['slow', 'expensive'],
    icon: '🔨',
  },
  crafting: {
    id: 'crafting',
    name: 'Crafting',
    category: 'artisan',
    tags: ['varied', 'profitable'],
    icon: '✂️',
  },
  firemaking: {
    id: 'firemaking',
    name: 'Firemaking',
    category: 'support',
    tags: ['fast', 'easy', 'wintertodt'],
    icon: '🔥',
  },
  fletching: {
    id: 'fletching',
    name: 'Fletching',
    category: 'artisan',
    tags: ['fast', 'afk'],
    icon: '🏹',
  },
  farming: {
    id: 'farming',
    name: 'Farming',
    category: 'gathering',
    tags: ['passive', 'profitable'],
    icon: '🌱',
  },
  hunter: {
    id: 'hunter',
    name: 'Hunter',
    category: 'gathering',
    tags: ['varied', 'click-intensive'],
    icon: '🦌',
  },
};

/**
 * Minigame definitions
 */
const MINIGAMES = {
  // Easy Minigames
  tempoross: {
    id: 'tempoross',
    name: 'Tempoross',
    category: 'skilling',
    tags: ['fishing', 'group', 'safe'],
    enabled: true,
  },
  guardiansOfTheRift: {
    id: 'guardiansOfTheRift',
    name: 'Guardians of the Rift',
    category: 'skilling',
    tags: ['runecrafting', 'group', 'safe'],
    enabled: true,
  },
  wintertodt: {
    id: 'wintertodt',
    name: 'Wintertodt',
    category: 'skilling',
    tags: ['firemaking', 'group', 'safe'],
    enabled: true,
  },

  // Medium Minigames
  barbarianAssault: {
    id: 'barbarianAssault',
    name: 'Barbarian Assault',
    category: 'combat',
    tags: ['group', 'teamwork', 'rewards'],
    enabled: true,
  },
  pestControl: {
    id: 'pestControl',
    name: 'Pest Control',
    category: 'combat',
    tags: ['group', 'combat-xp', 'void'],
    enabled: true,
  },
  castleWars: {
    id: 'castleWars',
    name: 'Castle Wars',
    category: 'pvp',
    tags: ['group', 'pvp', 'fun'],
    enabled: true,
  },
  fightCaves: {
    id: 'fightCaves',
    name: 'Fight Caves',
    category: 'combat',
    tags: ['solo', 'jad', 'fire-cape'],
    enabled: true,
  },
  inferno: {
    id: 'inferno',
    name: 'Inferno',
    category: 'combat',
    tags: ['solo', 'zuk', 'difficult', 'infernal-cape'],
    enabled: true,
  },
};

/**
 * Item collection categories
 */
const COLLECTIBLE_ITEMS = {
  // Easy Items
  feathers: {
    id: 'feathers',
    name: 'Feathers',
    category: 'basic',
    tags: ['cheap', 'shop'],
  },
  oakLogs: {
    id: 'oakLogs',
    name: 'Oak Logs',
    category: 'logs',
    tags: ['woodcutting', 'common'],
  },
  ironOre: {
    id: 'ironOre',
    name: 'Iron Ore',
    category: 'ores',
    tags: ['mining', 'common'],
  },

  // Medium Items
  runiteOre: {
    id: 'runiteOre',
    name: 'Runite Ore',
    category: 'ores',
    tags: ['mining', 'rare', 'expensive'],
  },
  magicLogs: {
    id: 'magicLogs',
    name: 'Magic Logs',
    category: 'logs',
    tags: ['woodcutting', 'high-level'],
  },
  dragonBones: {
    id: 'dragonBones',
    name: 'Dragon Bones',
    category: 'bones',
    tags: ['combat', 'prayer'],
  },

  // Hard Items
  ranarrSeeds: {
    id: 'ranarrSeeds',
    name: 'Ranarr Seeds',
    category: 'seeds',
    tags: ['farming', 'expensive', 'profitable'],
  },
  deathRunes: {
    id: 'deathRunes',
    name: 'Death Runes',
    category: 'runes',
    tags: ['runecrafting', 'expensive'],
  },
  bloodRunes: {
    id: 'bloodRunes',
    name: 'Blood Runes',
    category: 'runes',
    tags: ['runecrafting', 'expensive', 'high-level'],
  },
};

/**
 * Clue scroll tiers
 */
const CLUE_TIERS = {
  beginner: {
    id: 'beginner',
    name: 'Beginner Clue',
    color: 'yellow',
    enabled: true,
    quantities: {
      easy: { min: 10, max: 20 },
      medium: { min: 15, max: 20 },
      hard: { min: 20, max: 25 },
    },
  },
  easy: {
    id: 'easy',
    name: 'Easy Clue',
    color: 'green',
    enabled: true,
    quantities: {
      easy: { min: 10, max: 20 },
      medium: { min: 15, max: 20 },
      hard: { min: 20, max: 25 },
    },
  },
  medium: {
    id: 'medium',
    name: 'Medium Clue',
    color: 'blue',
    enabled: true,
    quantities: {
      easy: { min: 8, max: 12 },
      medium: { min: 10, max: 15 },
      hard: { min: 15, max: 25 },
    },
  },
  hard: {
    id: 'hard',
    name: 'Hard Clue',
    color: 'purple',
    enabled: true,
    quantities: {
      easy: { min: 5, max: 10 },
      medium: { min: 7, max: 12 },
      hard: { min: 10, max: 15 },
    },
  },
  elite: {
    id: 'elite',
    name: 'Elite Clue',
    color: 'orange',
    enabled: true,
    quantities: {
      easy: { min: 3, max: 5 },
      medium: { min: 5, max: 7 },
      hard: { min: 8, max: 10 },
    },
  },
  master: {
    id: 'master',
    name: 'Master Clue',
    color: 'red',
    enabled: true,
    quantities: {
      easy: { min: 2, max: 4 },
      medium: { min: 3, max: 6 },
      hard: { min: 5, max: 10 },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all enabled bosses from a specific category
 */
const getEnabledBosses = (category = null) => {
  const bosses = Object.values(SOLO_BOSSES).filter((boss) => boss.enabled);
  return category ? bosses.filter((boss) => boss.category === category) : bosses;
};

/**
 * Get all enabled raids
 */
const getEnabledRaids = () => {
  return Object.values(RAIDS).filter((raid) => raid.enabled);
};

/**
 * Get all enabled minigames
 */
const getEnabledMinigames = () => {
  return Object.values(MINIGAMES).filter((minigame) => minigame.enabled);
};

/**
 * Get content by tags
 */
const getContentByTags = (collection, tags) => {
  return Object.values(collection).filter((item) => tags.some((tag) => item.tags?.includes(tag)));
};

/**
 * Combine bosses and raids for boss_kc objectives
 */
const getAllBossContent = () => {
  return {
    ...SOLO_BOSSES,
    ...RAIDS,
  };
};

const formatGP = (gp) => {
  if (!gp) return '0';
  return (gp / 1000000).toFixed(1) + 'M';
};

const formatObjectiveAmount = (node) => {
  if (!node?.objective) return '—';
  const q = node.objective.quantity ?? 0;
  switch (node.objective.type) {
    case 'xp_gain':
      return `${q.toLocaleString()} XP`;
    case 'boss_kc':
      return `${q} KC`;
    case 'minigame':
      return `${q} runs`;
    case 'item_collection':
      return `${q} collected`;
    case 'clue_scrolls':
      return `${q} clues`;
    default:
      return `${q}`;
  }
};

function userHasNeverSubmitted(team, currentUser) {
  if (!currentUser?.discordUserId || !team?.submissions?.length) return true;
  return !team.submissions.some(
    (s) => s.submittedBy?.toString() === currentUser.discordUserId?.toString()
  );
}

module.exports = {
  OBJECTIVE_TYPES,
  SOLO_BOSSES,
  RAIDS,
  SKILLS,
  MINIGAMES,
  COLLECTIBLE_ITEMS,
  CLUE_TIERS,
  getEnabledBosses,
  getEnabledRaids,
  getEnabledMinigames,
  getContentByTags,
  getAllBossContent,
  userHasNeverSubmitted,
  formatGP,
  formatObjectiveAmount,
};
