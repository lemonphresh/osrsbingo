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
export const SOLO_BOSSES = {
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
export const RAIDS = {
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
export const SKILLS = {
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
export const MINIGAMES = {
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
export const COLLECTIBLE_ITEMS = {
  // Basic items (no dependencies)
  feathers: {
    id: 'feathers',
    name: 'Feathers',
    category: 'basic',
    sources: [], // Shop item - always available
  },

  // Skill-based items
  oakLogs: {
    id: 'oakLogs',
    name: 'Oak Logs',
    category: 'logs',
    sources: ['skills:woodcutting'], // Requires woodcutting skill
  },

  dragonBones: {
    id: 'dragonBones',
    name: 'Dragon Bones',
    category: 'bones',
    sources: [],
  },

  // Boss-specific drops
  vorkathHead: {
    id: 'vorkathHead',
    name: "Vorkath's Head",
    category: 'boss-drops',
    sources: ['bosses:vorkath'], // ONLY from Vorkath
  },

  abyssalWhip: {
    id: 'abyssalWhip',
    name: 'Abyssal Whip',
    category: 'boss-drops',
    sources: [],
  },

  // Minigame rewards
  goldenTench: {
    id: 'goldenTench',
    name: 'Golden Tench',
    category: 'minigame-rewards',
    sources: ['minigames:tempoross'], // ONLY from Tempoross
  },

  pyromancerOutfit: {
    id: 'pyromancerOutfit',
    name: 'Pyromancer Outfit',
    category: 'minigame-rewards',
    sources: ['minigames:wintertodt'], // ONLY from Wintertodt
  },

  // Multiple sources (OR logic)
  deathRunes: {
    id: 'deathRunes',
    name: 'Death Runes',
    category: 'runes',
    sources: ['skills:runecrafting', 'bosses:barrows'], // RC OR Barrows
  },
};

/**
 * Clue scroll tiers
 */
export const CLUE_TIERS = {
  easy: {
    id: 'easy',
    name: 'Easy',
    color: 'green',
    steps: { min: 2, max: 4 },
  },
  medium: {
    id: 'medium',
    name: 'Medium',
    color: 'blue',
    steps: { min: 3, max: 5 },
  },
  hard: {
    id: 'hard',
    name: 'Hard',
    color: 'purple',
    steps: { min: 4, max: 6 },
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    color: 'orange',
    steps: { min: 5, max: 7 },
  },
  master: {
    id: 'master',
    name: 'Master',
    color: 'red',
    steps: { min: 6, max: 8 },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all enabled bosses from a specific category
 */
export const getEnabledBosses = (category = null) => {
  const bosses = Object.values(SOLO_BOSSES).filter((boss) => boss.enabled);
  return category ? bosses.filter((boss) => boss.category === category) : bosses;
};

/**
 * Get all enabled raids
 */
export const getEnabledRaids = () => {
  return Object.values(RAIDS).filter((raid) => raid.enabled);
};

/**
 * Get all enabled minigames
 */
export const getEnabledMinigames = () => {
  return Object.values(MINIGAMES).filter((minigame) => minigame.enabled);
};

/**
 * Get content by tags
 */
export const getContentByTags = (collection, tags) => {
  return Object.values(collection).filter((item) => tags.some((tag) => item.tags?.includes(tag)));
};

/**
 * Combine bosses and raids for boss_kc objectives
 */
export const getAllBossContent = () => {
  return {
    ...SOLO_BOSSES,
    ...RAIDS,
  };
};

export function parseItemSources(item, contentSelections) {
  if (!item.sources || item.sources.length === 0) {
    return true; // No dependencies = always available
  }

  // Check if ANY source is enabled (OR logic)
  return item.sources.some((source) => {
    const [type, id] = source.split(':');

    switch (type) {
      case 'skills':
        return contentSelections.skills?.[id] !== false;
      case 'bosses':
        return contentSelections.bosses?.[id] !== false;
      case 'minigames':
        return contentSelections.minigames?.[id] !== false;
      case 'raids':
        return contentSelections.raids?.[id] !== false;
      default:
        return true;
    }
  });
}
