'use strict';

// ── BOSSES ─────────────────────────────────────────────────────────────────────
// Keyed by WOM Boss enum value. The `id` field holds the camelCase internal key
// that matches existing SOLO_BOSSES references throughout the codebase.
//
// Special case: dagannoth_kings has womKey: null because WOM tracks the three
// kings individually (dagannoth_prime/rex/supreme). This entry is used for bingo
// objectives only; group dashboard dropdown uses the individual WOM keys.
//
// killsPerHour: null everywhere — stubbed for future use, not read by any current logic.

const BOSSES = {
  // ── short-category bosses ──────────────────────────────────────────────────
  giant_mole: {
    womKey: 'giant_mole',
    id: 'giantMole',
    displayName: 'Giant Mole',
    category: 'short',
    tags: ['safe', 'beginner', 'falador'],
    enabled: true,
    quantities: {
      short: { min: 100, max: 150 },
      medium: { min: 175, max: 200 },
      long: { min: 200, max: 250 },
    },
    drops: ['Baby Mole', 'Immaculate Mole Skin'],
    dropQuantities: {
      casual: { min: 4, max: 6 },
      standard: { min: 6, max: 10 },
      hardcore: { min: 10, max: 14 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_giantMole',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Underground Menace',
        descriptionTemplate: 'Obtain {quantity} drops from the Giant Mole.',
        quantities: {
          casual: { min: 4, max: 6 },
          standard: { min: 6, max: 10 },
          hardcore: { min: 10, max: 14 },
        },
      },
    ],
  },
  sarachnis: {
    womKey: 'sarachnis',
    id: 'sarachnis',
    displayName: 'Sarachnis',
    category: 'short',
    tags: ['spider', 'f2p-accessible'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: ['Sraracha', 'Sarachnis Cudgel', 'Jar of Eyes', 'Pristine Spider Silk'],
    dropQuantities: {
      medium: { min: 1, max: 1 },
      long: { min: 2, max: 2 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_sarachnis',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'initiate',
        label: 'Eight-Legged Nightmare',
        descriptionTemplate: 'Obtain {quantity} drops from Sarachnis.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 1 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  obor: {
    womKey: 'obor',
    id: 'obor',
    displayName: 'Obor',
    category: 'short',
    tags: ['f2p', 'key', 'giant'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: ['Hill Giant Club', 'Giant Key'],
    dropQuantities: {
      long: { min: 1, max: 1 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_obor',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'initiate',
        label: 'Fee-Fi-Fo-Fum',
        descriptionTemplate: 'Obtain {quantity} drops from Obor.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  kraken: {
    womKey: 'kraken',
    id: 'krakenBoss',
    displayName: 'Kraken',
    category: 'short',
    tags: ['slayer', '87-slayer', 'afk'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: ['Kraken Tentacle', 'Trident of the Seas', 'Jar of Dirt', 'Pet Kraken'],
    dropQuantities: {
      short: { min: 1, max: 2 },
      medium: { min: 2, max: 3 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_krakenBoss',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'initiate',
        label: 'Release the Kraken',
        descriptionTemplate: 'Obtain {quantity} drops from Kraken.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 3 },
          hardcore: { min: 3, max: 4 },
        },
      },
    ],
  },
  amoxliatl: {
    womKey: 'amoxliatl',
    id: 'amoxliatl',
    displayName: 'Amoxliatl',
    category: 'short',
    tags: [],
    enabled: true,
    quantities: {
      short: { min: 75, max: 100 },
      medium: { min: 100, max: 150 },
      long: { min: 150, max: 200 },
    },
    drops: ['Moxi', 'Glacial Temotli'],
    dropQuantities: {
      short: { min: 1, max: 2 },
      medium: { min: 2, max: 3 },
      long: { min: 3, max: 4 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_amoxliatl',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'initiate',
        label: 'Hot Pursuit',
        descriptionTemplate: 'Obtain {quantity} drops from Amoxliatl.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 3 },
          hardcore: { min: 3, max: 4 },
        },
      },
    ],
  },
  the_royal_titans: {
    womKey: 'the_royal_titans',
    id: 'royalTitans',
    displayName: 'Royal Titans',
    category: 'short',
    tags: ['duo', 'group-friendly'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: ['Ice Element Staff Crown', 'Fire Element Staff Crown', 'Giantsoul Amulet', 'Bran'],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_royalTitans',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'initiate',
        label: 'Clash of Giants',
        descriptionTemplate: 'Obtain {quantity} drops from Royal Titans.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  bryophyta: {
    womKey: 'bryophyta',
    id: 'bryophyta',
    displayName: 'Bryophyta',
    category: 'short',
    tags: ['f2p', 'key', 'giant'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: ["Bryophyta's Essence", "Bryophyta's Staff", 'Mossy Key'],
    dropQuantities: {
      long: { min: 1, max: 1 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_bryophyta',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'initiate',
        label: "Moss Giant's Bane",
        descriptionTemplate: 'Obtain {quantity} drops from Bryophyta.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },

  // ── medium-category bosses ─────────────────────────────────────────────────
  vorkath: {
    womKey: 'vorkath',
    id: 'vorkath',
    displayName: 'Vorkath',
    category: 'medium',
    tags: ['dragon', 'quest', 'profitable'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 125, max: 175 },
      long: { min: 200, max: 300 },
    },
    drops: [
      'Dragonbone Necklace',
      'Jar of Decay',
      "Vorkath's Head (not 50kc one)",
      'Vorki',
      'Skeletal Visage',
      'Draconic Visage',
    ],
    dropQuantities: {
      short: { min: 1, max: 2 },
      medium: { min: 3, max: 4 },
      long: { min: 5, max: 7 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_vorkath',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'To Slay a Dragon',
        descriptionTemplate: 'Obtain {quantity} drops from Vorkath.',
        quantities: {
          casual: { min: 2, max: 3 },
          standard: { min: 3, max: 4 },
          hardcore: { min: 4, max: 5 },
        },
      },
    ],
  },
  zulrah: {
    womKey: 'zulrah',
    id: 'zulrah',
    displayName: 'Zulrah',
    category: 'medium',
    tags: ['snake', 'quest', 'profitable', 'rotation'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 80 },
      medium: { min: 80, max: 160 },
      long: { min: 150, max: 250 },
    },
    drops: [
      'Tanzanite Fang',
      'Magic Fang',
      'Serpentine Visage',
      'Uncut Onyx',
      'Snakeling',
      'Jar of Swamp',
      'Tanzanite Mutagen',
      'Magma Mutagen',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 4 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_zulrah',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Snake Pit',
        descriptionTemplate: 'Obtain {quantity} drops from Zulrah.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  barrows_chests: {
    womKey: 'barrows_chests',
    id: 'barrows',
    displayName: 'Barrows',
    category: 'medium',
    tags: ['minigame', 'multiple', 'prayer'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: [
      "Ahrim's Hood",
      "Ahrim's Robetop",
      "Ahrim's Robeskirt",
      "Ahrim's Staff",
      "Dharok's Helm",
      "Dharok's Platebody",
      "Dharok's Platelegs",
      "Dharok's Greataxe",
      "Guthan's Helm",
      "Guthan's Platebody",
      "Guthan's Chainskirt",
      "Guthan's Warspear",
      "Karil's Coif",
      "Karil's Leathertop",
      "Karil's Leatherskirt",
      "Karil's Crossbow",
      "Torag's Helm",
      "Torag's Platebody",
      "Torag's Platelegs",
      "Torag's Hammers",
      "Verac's Helm",
      "Verac's Brassard",
      "Verac's Plateskirt",
      "Verac's Flail",
    ],
    dropQuantities: {
      short: { min: 4, max: 5 },
      medium: { min: 5, max: 7 },
      long: { min: 7, max: 9 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_barrows',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Rest in Pieces',
        descriptionTemplate: 'Obtain {quantity} drops from Barrows.',
        quantities: {
          casual: { min: 3, max: 5 },
          standard: { min: 5, max: 7 },
          hardcore: { min: 7, max: 10 },
        },
      },
    ],
  },
  grotesque_guardians: {
    womKey: 'grotesque_guardians',
    id: 'grotesqueGuardians',
    displayName: 'Grotesque Guardians',
    category: 'medium',
    tags: ['slayer', 'duo'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: [
      'Noon',
      'Granite Maul',
      'Granite Gloves',
      'Granite Ring',
      'Granite Hammer',
      'Black Tourmaline Core',
      'Jar of Stone',
    ],
    dropQuantities: {
      short: { min: 2, max: 2 },
      medium: { min: 3, max: 4 },
      long: { min: 4, max: 5 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_grotesqueGuardians',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Gargoyle Smasher',
        descriptionTemplate: 'Obtain {quantity} drops from Grotesque Guardians.',
        quantities: {
          casual: { min: 2, max: 2 },
          standard: { min: 3, max: 3 },
          hardcore: { min: 3, max: 4 },
        },
      },
    ],
  },
  araxxor: {
    womKey: 'araxxor',
    id: 'araxxor',
    displayName: 'Araxxor',
    category: 'medium',
    tags: ['spider', 'slayer'],
    enabled: true,
    quantities: {
      short: { min: 75, max: 100 },
      medium: { min: 100, max: 150 },
      long: { min: 150, max: 200 },
    },
    drops: ['Nid', 'Araxyte Fang', 'Noxious Point', 'Noxious Blade', 'Noxious Pommel'],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 4 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_araxxor',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Web of Doom',
        descriptionTemplate: 'Obtain {quantity} drops from Araxxor.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  thermonuclear_smoke_devil: {
    womKey: 'thermonuclear_smoke_devil',
    id: 'thermonuclearSmokeDevil',
    displayName: 'Thermonuclear Smoke Devil',
    category: 'medium',
    tags: ['slayer', '93-slayer'],
    enabled: true,
    quantities: {
      short: { min: 100, max: 150 },
      medium: { min: 150, max: 200 },
      long: { min: 200, max: 250 },
    },
    drops: ['Pet Smoke Devil', 'Occult Necklace', 'Smoke Battlestaff', 'Dragon Chainbody'],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_thermonuclearSmokeDevil',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: "Where There's Smoke",
        descriptionTemplate: 'Obtain {quantity} drops from Thermonuclear Smoke Devil.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  commander_zilyana: {
    womKey: 'commander_zilyana',
    id: 'commanderZilyana',
    displayName: 'Commander Zilyana',
    category: 'medium',
    tags: ['gwd', 'saradomin', 'group-friendly'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: [
      'Saradomin Sword',
      'Armadyl Crossbow',
      "Saradomin's Light",
      'Saradomin Hilt',
      'Zilyana Jr.',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_commanderZilyana',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'For Saradomin!',
        descriptionTemplate: 'Obtain {quantity} drops from Commander Zilyana.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  general_graardor: {
    womKey: 'general_graardor',
    id: 'generalGraardor',
    displayName: 'General Graardor',
    category: 'medium',
    tags: ['gwd', 'bandos', 'group-friendly'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: [
      'Bandos Chestplate',
      'Bandos Tassets',
      'Bandos Boots',
      'Bandos Hilt',
      'General Graardor Jr.',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_generalGraardor',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Bandos Brawl',
        descriptionTemplate: 'Obtain {quantity} drops from General Graardor.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  kreearra: {
    womKey: 'kreearra',
    id: 'kreeArra',
    displayName: "Kree'Arra",
    category: 'medium',
    tags: ['gwd', 'armadyl', 'ranged', 'group-friendly'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: [
      'Armadyl Chestplate',
      'Armadyl Chainskirt',
      'Armadyl Helmet',
      'Armadyl Hilt',
      "Kree'arra Jr.",
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_kreeArra',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Eyes of the Sky',
        descriptionTemplate: "Obtain {quantity} drops from Kree'Arra.",
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  kril_tsutsaroth: {
    womKey: 'kril_tsutsaroth',
    id: 'krilTsutsaroth',
    displayName: "K'ril Tsutsaroth",
    category: 'medium',
    tags: ['gwd', 'zamorak', 'group-friendly'],
    enabled: true,
    quantities: {
      short: { min: 75, max: 100 },
      medium: { min: 100, max: 125 },
      long: { min: 125, max: 175 },
    },
    drops: [
      'Staff of the Dead',
      'Zamorakian Spear',
      'Steam Battlestaff',
      'Zamorak Hilt',
      "K'ril Tsutsaroth Jr.",
    ],
    dropQuantities: {
      short: { min: 1, max: 2 },
      medium: { min: 2, max: 3 },
      long: { min: 3, max: 4 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_krilTsutsaroth',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: "Zamorak's Champion",
        descriptionTemplate: "Obtain {quantity} drops from K'ril Tsutsaroth.",
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 3 },
          hardcore: { min: 3, max: 4 },
        },
      },
    ],
  },
  the_hueycoatl: {
    womKey: 'the_hueycoatl',
    id: 'hueycoatl',
    displayName: 'The Hueycoatl',
    category: 'medium',
    tags: ['group-friendly', 'duo', 'trio'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: ['Huberte', 'Hueycoatl Hide', 'Tome of Earth', 'Dragon Hunter Wand'],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_hueycoatl',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Feathered Fury',
        descriptionTemplate: 'Obtain {quantity} drops from Hueycoatl.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  shellbane_gryphon: {
    womKey: 'shellbane_gryphon',
    id: 'shellbaneGryphon',
    displayName: 'Shellbane Gryphon',
    category: 'medium',
    tags: ['slayer'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: ['Gull', "Belle's Folly", 'Jar of Feathers'],
    dropQuantities: {
      medium: { min: 2, max: 2 },
      long: { min: 2, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_shellbaneGryphon',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Shell Shocked',
        descriptionTemplate: 'Obtain {quantity} drops from Shellbane Gryphon.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  // WOM tracks dagannoth kings individually; no single WOM key for the trio.
  // getSoloBossMap() includes this for bingo objectives.
  // getBossMetricOptions() excludes it (use dagannoth_prime/rex/supreme instead).
  dagannoth_kings: {
    womKey: null,
    id: 'dagannothKings',
    displayName: 'Dagannoth Kings',
    category: 'medium',
    tags: ['duo', 'trio', 'group-friendly', 'multiple'],
    enabled: true,
    quantities: {
      short: { min: 100, max: 150 },
      medium: { min: 150, max: 250 },
      long: { min: 250, max: 350 },
    },
    drops: [
      'Pet Dagannoth Prime',
      'Pet Dagannoth Supreme',
      'Pet Dagannoth Rex',
      'Berserker Ring',
      'Archers Ring',
      'Seers Ring',
      'Warrior Ring',
      'Dragon Axe',
      'Seercull',
      'Mud Battlestaff',
    ],
    dropQuantities: {
      short: { min: 2, max: 3 },
      medium: { min: 3, max: 4 },
      long: { min: 4, max: 5 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_dagannothKings',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'King of the Cave',
        descriptionTemplate: 'Obtain {quantity} drops from Dagannoth Kings.',
        quantities: {
          casual: { min: 2, max: 3 },
          standard: { min: 3, max: 4 },
          hardcore: { min: 4, max: 5 },
        },
      },
    ],
  },
  abyssal_sire: {
    womKey: 'abyssal_sire',
    id: 'abyssalSire',
    displayName: 'Abyssal Sire',
    category: 'medium',
    tags: ['slayer', '85-slayer'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: [
      'Abyssal Whip',
      'Abyssal Dagger',
      'Abyssal Bludgeon Piece',
      'Abyssal Orphan',
      'Jar of Miasma',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_abyssalSire',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Abyssal Affairs',
        descriptionTemplate: 'Obtain {quantity} drops from Abyssal Sire.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  phantom_muspah: {
    womKey: 'phantom_muspah',
    id: 'phantomMuspah',
    displayName: 'Phantom Muspah',
    category: 'medium',
    tags: ['slayer'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: ['Muphin', 'Ancient Icon', 'Venator Shard'],
    dropQuantities: {
      short: { min: 1, max: 2 },
      medium: { min: 2, max: 3 },
      long: { min: 3, max: 4 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_phantomMuspah',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'What Dreams May Come',
        descriptionTemplate: 'Obtain {quantity} drops from Phantom Muspah.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 3 },
          hardcore: { min: 3, max: 4 },
        },
      },
    ],
  },
  lunar_chests: {
    womKey: 'lunar_chests',
    id: 'moons',
    displayName: 'Moons of Peril',
    category: 'medium',
    tags: ['group-friendly'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: [
      'Blood Moon Helm',
      'Blood Moon Chestplate',
      'Blood Moon Tassets',
      'Blue Moon Helm',
      'Blue Moon Chestplate',
      'Blue Moon Tassets',
      'Eclipse Moon Helm',
      'Eclipse Moon Chestplate',
      'Eclipse Moon Tassets',
      'Dual Macuahuitl',
      'Blue Moon Spear',
      'Eclipse Atlatl',
    ],
    dropQuantities: {
      short: { min: 1, max: 2 },
      medium: { min: 2, max: 3 },
      long: { min: 3, max: 4 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_moons',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Lunar Carnage',
        descriptionTemplate: 'Obtain {quantity} drops from Moons of Peril.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 3 },
          hardcore: { min: 3, max: 4 },
        },
      },
    ],
  },
  kalphite_queen: {
    womKey: 'kalphite_queen',
    id: 'kalphiteQueen',
    displayName: 'Kalphite Queen',
    category: 'medium',
    tags: [],
    enabled: true,
    quantities: {
      short: { min: 20, max: 30 },
      medium: { min: 35, max: 50 },
      long: { min: 50, max: 100 },
    },
    drops: [
      'Kalphite Princess',
      'Dragon Chainbody',
      'Dragon 2h Sword',
      'Jar of Sand',
      'Kq Head (not 256kc one)',
    ],
    dropQuantities: {
      short: { min: 1, max: 2 },
      medium: { min: 2, max: 3 },
      long: { min: 3, max: 4 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_kalphiteQueen',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: "Queen's Gambit",
        descriptionTemplate: 'Obtain {quantity} drops from Kalphite Queen.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 3 },
          hardcore: { min: 3, max: 4 },
        },
      },
    ],
  },
  mad_angel: {
    womKey: 'mad_angel',
    id: 'madAngel',
    displayName: 'Mad Angel',
    category: 'medium',
    tags: ['slayer'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: ['Aggy', 'Hallowfell'],
    dropQuantities: {
      medium: {
        min: 1,
        max: 1,
      },
      long: {
        min: 2,
        max: 2,
      },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_madAngel',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Fallen Angel',
        descriptionTemplate: 'Obtain {quantity} drops from Mad Angel.',
        quantities: {
          casual: { min: 2, max: 2 },
          standard: { min: 3, max: 3 },
          hardcore: { min: 3, max: 4 },
        },
      },
    ],
  },

  // ── wilderness bosses ──────────────────────────────────────────────────────
  chaos_fanatic: {
    womKey: 'chaos_fanatic',
    id: 'chaosFanatic',
    displayName: 'Chaos Fanatic',
    category: 'wilderness',
    tags: ['wilderness', 'dangerous'],
    enabled: true,
    quantities: {
      short: { min: 75, max: 100 },
      medium: { min: 100, max: 150 },
      long: { min: 150, max: 200 },
    },
    drops: ['Pet Chaos Fanatic', 'Odium Shard', 'Malediction Shard'],
    dropQuantities: {
      short: { min: 1, max: 2 },
      medium: { min: 2, max: 3 },
      long: { min: 3, max: 4 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_chaosFanatic',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Wilderness Weirdo',
        descriptionTemplate: 'Obtain {quantity} drops from Chaos Fanatic.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 3 },
          hardcore: { min: 3, max: 4 },
        },
      },
    ],
  },
  crazy_archaeologist: {
    womKey: 'crazy_archaeologist',
    id: 'crazyArchaeologist',
    displayName: 'Crazy Archaeologist',
    category: 'wilderness',
    tags: ['wilderness', 'dangerous'],
    enabled: true,
    quantities: {
      short: { min: 75, max: 100 },
      medium: { min: 100, max: 150 },
      long: { min: 150, max: 200 },
    },
    drops: ['Pet Chaos Elemental', 'Odium Shard', 'Malediction Shard'],
    dropQuantities: {
      short: { min: 1, max: 2 },
      medium: { min: 2, max: 3 },
      long: { min: 3, max: 4 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_crazyArchaeologist',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Digging Too Deep',
        descriptionTemplate: 'Obtain {quantity} drops from Crazy Archaeologist.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 3 },
          hardcore: { min: 3, max: 4 },
        },
      },
    ],
  },
  scorpia: {
    womKey: 'scorpia',
    id: 'scorpia',
    displayName: 'Scorpia',
    category: 'wilderness',
    tags: ['wilderness', 'dangerous'],
    enabled: true,
    quantities: {
      short: { min: 75, max: 100 },
      medium: { min: 100, max: 150 },
      long: { min: 150, max: 200 },
    },
    drops: ["Scorpia's Offspring", 'Odium Shard', 'Malediction Shard'],
    dropQuantities: {
      short: { min: 1, max: 2 },
      medium: { min: 2, max: 3 },
      long: { min: 3, max: 4 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_scorpia',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Stings So Good',
        descriptionTemplate: 'Obtain {quantity} drops from Scorpia.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 3 },
          hardcore: { min: 3, max: 4 },
        },
      },
    ],
  },
  chaos_elemental: {
    womKey: 'chaos_elemental',
    id: 'chaosElemental',
    displayName: 'Chaos Elemental',
    category: 'wilderness',
    tags: ['wilderness', 'dangerous'],
    enabled: true,
    quantities: {
      short: { min: 75, max: 100 },
      medium: { min: 100, max: 150 },
      long: { min: 150, max: 200 },
    },
    drops: ['Pet Chaos Elemental', 'Dragon 2h Sword', 'Dragon Pickaxe'],
    dropQuantities: {
      short: { min: 1, max: 2 },
      medium: { min: 2, max: 3 },
      long: { min: 3, max: 4 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_chaosElemental',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Wild Magic',
        descriptionTemplate: 'Obtain {quantity} drops from Chaos Elemental.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 3 },
          hardcore: { min: 3, max: 4 },
        },
      },
    ],
  },
  spindel: {
    womKey: 'spindel',
    id: 'spindel',
    displayName: 'Spindel',
    category: 'wilderness',
    tags: ['wilderness', 'spider', 'dangerous'],
    enabled: true,
    quantities: {
      short: { min: 75, max: 100 },
      medium: { min: 100, max: 150 },
      long: { min: 150, max: 200 },
    },
    drops: [
      'Venenatis Spiderling',
      'Voidwaker Gem',
      'Treasonous Ring',
      'Dragon 2h Sword',
      'Dragon Pickaxe',
      'Fangs of Venenatis',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_spindel',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Itsy Bitsy Spider',
        descriptionTemplate: 'Obtain {quantity} drops from Spindel.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  artio: {
    womKey: 'artio',
    id: 'artio',
    displayName: 'Artio',
    category: 'wilderness',
    tags: ['wilderness', 'bear', 'dangerous'],
    enabled: true,
    quantities: {
      short: { min: 75, max: 100 },
      medium: { min: 100, max: 150 },
      long: { min: 150, max: 200 },
    },
    drops: [
      'Callisto Cub',
      'Voidwaker Hilt',
      'Tyrannical Ring',
      'Dragon 2h Sword',
      'Dragon Pickaxe',
      'Claws of Callisto',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_artio',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Bear Necessities',
        descriptionTemplate: 'Obtain {quantity} drops from Artio.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  calvarion: {
    womKey: 'calvarion',
    id: 'calvarion',
    displayName: "Calvar'ion",
    category: 'wilderness',
    tags: ['wilderness', 'skeleton', 'dangerous'],
    enabled: true,
    quantities: {
      short: { min: 75, max: 100 },
      medium: { min: 100, max: 150 },
      long: { min: 150, max: 200 },
    },
    drops: [
      "Vet'ion Jr.",
      'Voidwaker Blade',
      'Ring of the Gods',
      'Dragon 2h Sword',
      'Dragon Pickaxe',
      "Skull of Vet'ion",
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_calvarion',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Skeletal Stand-Off',
        descriptionTemplate: "Obtain {quantity} drops from Calvar'ion.",
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  venenatis: {
    womKey: 'venenatis',
    id: 'venenatis',
    displayName: 'Venenatis',
    category: 'wilderness',
    tags: ['wilderness', 'spider', 'dangerous'],
    enabled: true,
    quantities: {
      short: { min: 75, max: 100 },
      medium: { min: 100, max: 150 },
      long: { min: 150, max: 200 },
    },
    drops: [
      'Venenatis Spiderling',
      'Voidwaker Gem',
      'Treasonous Ring',
      'Dragon 2h Sword',
      'Dragon Pickaxe',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_venenatis',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Web of Venom',
        descriptionTemplate: 'Obtain {quantity} drops from Venenatis.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  vetion: {
    womKey: 'vetion',
    id: 'vetion',
    displayName: "Vet'ion",
    category: 'wilderness',
    tags: ['wilderness', 'skeleton', 'dangerous'],
    enabled: true,
    quantities: {
      short: { min: 75, max: 100 },
      medium: { min: 100, max: 150 },
      long: { min: 150, max: 200 },
    },
    drops: [
      "Vet'ion Jr.",
      'Voidwaker Blade',
      'Ring of the Gods',
      'Dragon 2h Sword',
      'Dragon Pickaxe',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_vetion',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: "Death's Hound",
        descriptionTemplate: "Obtain {quantity} drops from Vet'ion.",
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  callisto: {
    womKey: 'callisto',
    id: 'callisto',
    displayName: 'Callisto',
    category: 'wilderness',
    tags: ['wilderness', 'bear', 'dangerous'],
    enabled: true,
    quantities: {
      short: { min: 75, max: 100 },
      medium: { min: 100, max: 150 },
      long: { min: 150, max: 200 },
    },
    drops: [
      'Callisto Cub',
      'Voidwaker Hilt',
      'Tyrannical Ring',
      'Dragon 2h Sword',
      'Dragon Pickaxe',
      'Claws of Callisto',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_callisto',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: "Honey, I'm Home",
        descriptionTemplate: 'Obtain {quantity} drops from Callisto.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },

  // ── long-category bosses ───────────────────────────────────────────────────
  corporeal_beast: {
    womKey: 'corporeal_beast',
    id: 'corporealBeast',
    displayName: 'Corporeal Beast',
    category: 'long',
    tags: ['group', 'difficult', 'spirit-shields'],
    enabled: true,
    quantities: {
      short: { min: 20, max: 30 },
      medium: { min: 25, max: 35 },
      long: { min: 40, max: 60 },
    },
    drops: [
      'Pet Dark Core',
      'Spectral Sigil',
      'Arcane Sigil',
      'Elysian Sigil',
      'Holy Elixir',
      'Spirit Shield',
      'Jar of Spirits',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 1, max: 2 },
      long: { min: 2, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_corporealBeast',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'Corp Crush',
        descriptionTemplate: 'Obtain {quantity} drops from Corporeal Beast.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  cerberus: {
    womKey: 'cerberus',
    id: 'cerberus',
    displayName: 'Cerberus',
    category: 'long',
    tags: ['slayer', 'hellhound', '91-slayer'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: [
      'Primordial Crystal',
      'Pegasian Crystal',
      'Eternal Crystal',
      'Smouldering Stone',
      'Hellpuppy',
      'Jar of Souls',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 3 },
      long: { min: 3, max: 4 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_cerberus',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'Three Heads Are Better',
        descriptionTemplate: 'Obtain {quantity} drops from Cerberus.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 3 },
          hardcore: { min: 3, max: 4 },
        },
      },
    ],
  },
  nex: {
    womKey: 'nex',
    id: 'nex',
    displayName: 'Nex',
    category: 'long',
    tags: ['gwd', 'group-friendly', 'duo', 'trio'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: [
      'Zaryte Vambraces',
      'Torva Full Helm',
      'Torva Platebody',
      'Torva Platelegs',
      'Ancient Hilt',
      'Nihil Horn',
      'Nexling',
    ],
    dropQuantities: {
      medium: { min: 1, max: 1 },
      long: { min: 2, max: 2 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_nex',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'Ancient Reckoning',
        descriptionTemplate: 'Obtain {quantity} drops from Nex.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 1 },
          hardcore: { min: 1, max: 2 },
        },
      },
    ],
  },
  alchemical_hydra: {
    womKey: 'alchemical_hydra',
    id: 'alchemicalHydra',
    displayName: 'Alchemical Hydra',
    category: 'long',
    tags: ['slayer', '95-slayer'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: [
      "Hydra's Tail",
      'Hydra Leather',
      "Hydra's Claw",
      "Hydra's Eye",
      "Hydra's Fang",
      "Hydra's Heart",
      'Ikkle Hydra',
      'Jar of Chemicals',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 1, max: 2 },
      long: { min: 2, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_alchemicalHydra',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'Hydra Problem',
        descriptionTemplate: 'Obtain {quantity} drops from Alchemical Hydra.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  the_gauntlet: {
    womKey: 'the_gauntlet',
    id: 'crystallineHunllef',
    displayName: 'Crystalline Hunllef',
    category: 'long',
    tags: ['slayer', 'minigame'],
    enabled: true,
    quantities: {
      short: { min: 20, max: 30 },
    },
    drops: [
      'Crystal Weapon Seed',
      'Enhanced Crystal Weapon Seed',
      'Crystal Armour Seed',
      'Youngllef',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_crystallineHunllef',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'Crystal Clear',
        descriptionTemplate: 'Obtain {quantity} drops from Crystalline Hunllef.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  the_corrupted_gauntlet: {
    womKey: 'the_corrupted_gauntlet',
    id: 'corruptedHunllef',
    displayName: 'Corrupted Hunllef',
    category: 'long',
    tags: ['slayer', 'minigame'],
    enabled: true,
    quantities: {
      short: { min: 20, max: 30 },
      medium: { min: 25, max: 50 },
      long: { min: 50, max: 75 },
    },
    drops: [
      'Enhanced Crystal Weapon Seed',
      'Crystal Weapon Seed',
      'Crystal Armour Seed',
      'Youngllef',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_corruptedHunllef',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'Corruption Within',
        descriptionTemplate: 'Obtain {quantity} drops from Corrupted Hunllef.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  vardorvis: {
    womKey: 'vardorvis',
    id: 'vardorvis',
    displayName: 'Vardorvis',
    category: 'long',
    tags: ['slayer', 'dt2'],
    enabled: true,
    quantities: {
      short: { min: 75, max: 100 },
      medium: { min: 100, max: 150 },
      long: { min: 175, max: 250 },
    },
    drops: [
      'Chromium Ingot',
      'Ultor Ring',
      "Executioner's Axe Head",
      'Butch',
      'Virtus Robe Top',
      'Virtus Mask',
      'Virtus Robe Bottom',
      'Gold Ring',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_vardorvis',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'Viking Burial',
        descriptionTemplate: 'Obtain {quantity} drops from Vardorvis.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  the_whisperer: {
    womKey: 'the_whisperer',
    id: 'whisperer',
    displayName: 'The Whisperer',
    category: 'long',
    tags: ['slayer', 'dt2'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: [
      'Bellator Ring',
      'Chromium Ingot',
      'Wisp',
      'Virtus Robe Top',
      "Siren's Staff",
      'Virtus Mask',
      'Virtus Robe Bottom',
      'Gold Ring',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_whisperer',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'Whispers in the Dark',
        descriptionTemplate: 'Obtain {quantity} drops from The Whisperer.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  duke_sucellus: {
    womKey: 'duke_sucellus',
    id: 'dukeSucellus',
    displayName: 'Duke Sucellus',
    category: 'long',
    tags: ['slayer', 'dt2'],
    enabled: true,
    quantities: {
      short: { min: 75, max: 100 },
      medium: { min: 100, max: 150 },
      long: { min: 175, max: 250 },
    },
    drops: [
      'Chromium Ingot',
      'Eye of the Duke',
      'Virtus Robe Top',
      'Virtus Mask',
      'Virtus Robe Bottom',
      'Magus Ring',
      'Baron',
      'Gold Ring',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_dukeSucellus',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'Noblesse Oblige',
        descriptionTemplate: 'Obtain {quantity} drops from Duke Sucellus.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  the_leviathan: {
    womKey: 'the_leviathan',
    id: 'leviathan',
    displayName: 'The Leviathan',
    category: 'long',
    tags: ['slayer', 'dt2'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: [
      'Chromium Ingot',
      'Venator Ring',
      "Lil'viathan",
      "Leviathan's Lure",
      'Virtus Robe Top',
      'Virtus Mask',
      'Virtus Robe Bottom',
      'Gold Ring',
    ],
    dropQuantities: {
      short: { min: 1, max: 1 },
      medium: { min: 2, max: 2 },
      long: { min: 3, max: 3 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_leviathan',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'Sea Serpent Slayer',
        descriptionTemplate: 'Obtain {quantity} drops from The Leviathan.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 2, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  yama: {
    womKey: 'yama',
    id: 'yama',
    displayName: 'Yama',
    category: 'long',
    tags: ['duo', 'difficult'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: [
      'Oathplate Helm',
      'Oathplate Body',
      'Oathplate Legs',
      'Soulflame Horn',
      'Forgotten Lockbox',
      'Dossier',
      'Yami',
    ],
    dropQuantities: {
      long: { min: 1, max: 1 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_yama',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'Gates of Hell',
        descriptionTemplate: 'Obtain {quantity} drops from Yama.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  nightmare: {
    womKey: 'nightmare',
    id: 'nightmare',
    displayName: 'Nightmare',
    category: 'long',
    tags: ['difficult', 'group-friendly', 'duo', 'trio'],
    enabled: true,
    quantities: {
      short: { min: 20, max: 30 },
      medium: { min: 25, max: 35 },
      long: { min: 40, max: 50 },
    },
    drops: [
      "Inquisitor's Mace",
      "Inquisitor's Great Helm",
      "Inquisitor's Hauberk",
      "Inquisitor's Plateskirt",
      'Nightmare Staff',
      'Eldritch Orb',
      'Harmonised Orb',
      'Volatile Orb',
      'Little Nightmare',
      'Jar of Dreams',
    ],
    dropQuantities: {
      long: { min: 1, max: 1 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_nightmare',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'Sweet Dreams Not',
        descriptionTemplate: 'Obtain {quantity} drops from Nightmare.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  phosanis_nightmare: {
    womKey: 'phosanis_nightmare',
    id: 'phosanisNightmare',
    displayName: "Phosani's Nightmare",
    category: 'long',
    tags: ['difficult'],
    enabled: true,
    quantities: {
      short: { min: 20, max: 30 },
      medium: { min: 25, max: 35 },
      long: { min: 40, max: 50 },
    },
    drops: [
      'Parasitic Egg',
      "Inquisitor's Mace",
      "Inquisitor's Great Helm",
      "Inquisitor's Hauberk",
      "Inquisitor's Plateskirt",
      'Nightmare Staff',
      'Eldritch Orb',
      'Harmonised Orb',
      'Volatile Orb',
      'Little Nightmare',
      'Jar of Dreams',
    ],
    dropQuantities: {
      long: { min: 1, max: 1 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_phosanisNightmare',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'No Rest for the Wicked',
        descriptionTemplate: "Obtain {quantity} drops from Phosani's Nightmare.",
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  doom_of_mokhaiotl: {
    womKey: 'doom_of_mokhaiotl',
    id: 'doom',
    displayName: 'Doom of Mokhaiotl',
    category: 'long',
    tags: ['difficult'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: ['Dom', 'Avernic Treads', 'Eye of Ayak', 'Mokhaiotl Cloth'],
    dropQuantities: {
      medium: { min: 1, max: 1 },
      long: { min: 2, max: 2 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_doom',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'Doom Runner',
        descriptionTemplate: 'Obtain {quantity} drops from Doom of Mokhaioitl.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
  maggot_king: {
    womKey: 'maggot_king',
    id: 'maggotKing',
    displayName: 'Maggot King',
    category: 'long',
    tags: ['difficult'],
    enabled: true,
    quantities: {
      short: { min: 50, max: 75 },
      medium: { min: 75, max: 100 },
      long: { min: 100, max: 150 },
    },
    drops: ['Crimson Kisten', 'Elder Venator Fang'],
    dropQuantities: {
      medium: {
        min: 1,
        max: 1,
      },
      long: {
        min: 2,
        max: 2,
      },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_maggotKing',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'The Rot Below',
        descriptionTemplate: 'Obtain {quantity} drops from the Maggot King.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },

  // ── WOM bosses not yet used in objectives (enabled: false stubs) ───────────
  brutus: {
    womKey: 'brutus',
    id: 'brutus',
    displayName: 'Brutus',
    category: 'medium',
    tags: [],
    enabled: false,
    quantities: null,
    drops: null,
    dropQuantities: null,
    killsPerHour: null,
    cw: null,
  },
  deranged_archaeologist: {
    womKey: 'deranged_archaeologist',
    id: 'derangedArchaeologist',
    displayName: 'Deranged Archaeologist',
    category: 'wilderness',
    tags: ['wilderness', 'dangerous'],
    enabled: false,
    quantities: null,
    drops: null,
    dropQuantities: null,
    killsPerHour: null,
    cw: null,
  },
  hespori: {
    womKey: 'hespori',
    id: 'hespori',
    displayName: 'Hespori',
    category: 'short',
    tags: ['farming'],
    enabled: false,
    quantities: null,
    drops: null,
    dropQuantities: null,
    killsPerHour: null,
    cw: null,
  },
  king_black_dragon: {
    womKey: 'king_black_dragon',
    id: 'kingBlackDragon',
    displayName: 'King Black Dragon',
    category: 'short',
    tags: ['dragon', 'f2p-accessible'],
    enabled: false,
    quantities: null,
    drops: null,
    dropQuantities: null,
    killsPerHour: null,
    cw: null,
  },
  mimic: {
    womKey: 'mimic',
    id: 'mimic',
    displayName: 'Mimic',
    category: 'short',
    tags: ['clue', 'rare'],
    enabled: false,
    quantities: null,
    drops: null,
    dropQuantities: null,
    killsPerHour: null,
    cw: null,
  },
  scurrius: {
    womKey: 'scurrius',
    id: 'scurrius',
    displayName: 'Scurrius',
    category: 'short',
    tags: [],
    enabled: false,
    quantities: null,
    drops: null,
    dropQuantities: null,
    killsPerHour: null,
    cw: null,
  },
  skotizo: {
    womKey: 'skotizo',
    id: 'skotizo',
    displayName: 'Skotizo',
    category: 'short',
    tags: ['totem', 'catacombs'],
    enabled: false,
    quantities: null,
    drops: null,
    dropQuantities: null,
    killsPerHour: null,
    cw: null,
  },
};

// ── RAIDS ──────────────────────────────────────────────────────────────────────
// Raids are part of WOM's Boss enum. Keyed by WOM key.
// cw block present for raids that appear in champion forge objectives.

const RAIDS = {
  chambers_of_xeric: {
    womKey: 'chambers_of_xeric',
    id: 'chambersOfXeric',
    displayName: 'Chambers of Xeric',
    shortName: 'CoX',
    tags: ['raid', 'group', 'scaling'],
    enabled: true,
    quantities: {
      short: { min: 5, max: 15 },
      medium: { min: 10, max: 20 },
      long: { min: 10, max: 25 },
    },
    drops: [
      'Olmlet',
      'Twisted Bow',
      'Elder Maul',
      'Kodai Insignia',
      'Dragon Claws',
      'Ancestral Hat',
      'Ancestral Robe Top',
      'Ancestral Robe Bottom',
      'Dexterous Prayer Scroll',
      'Arcane Prayer Scroll',
      "Dinh's Bulwark",
      'Dragon Hunter Crossbow',
      'Twisted Buckler',
    ],
    dropQuantities: {
      medium: { min: 1, max: 1 },
      long: { min: 2, max: 2 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_chambersOfXeric',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Raid Ready',
        descriptionTemplate: 'Obtain {quantity} drops from Chambers of Xeric.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 1 },
          hardcore: { min: 1, max: 2 },
        },
      },
    ],
  },
  chambers_of_xeric_challenge_mode: {
    womKey: 'chambers_of_xeric_challenge_mode',
    id: 'chambersOfXericChallengeMode',
    displayName: 'Challenge Mode Chambers of Xeric',
    shortName: 'CM',
    tags: ['raid', 'group', 'scaling'],
    enabled: true,
    quantities: {
      short: { min: 5, max: 15 },
      medium: { min: 10, max: 20 },
      long: { min: 10, max: 25 },
    },
    drops: [
      'Olmlet',
      'Twisted Bow',
      'Elder Maul',
      'Kodai Insignia',
      'Dragon Claws',
      'Ancestral Hat',
      'Ancestral Robe Top',
      'Ancestral Robe Bottom',
      'Dexterous Prayer Scroll',
      'Arcane Prayer Scroll',
      "Dinh's Bulwark",
      'Dragon Hunter Crossbow',
      'Twisted Buckler',
      'Twisted Ancestral Colour Kit',
      'Metamorphic Dust',
    ],
    dropQuantities: {
      medium: { min: 1, max: 1 },
      long: { min: 2, max: 2 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_chambersOfXericChallengeMode',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Expert Raider',
        descriptionTemplate: 'Obtain {quantity} drops from Challenge Mode Chambers of Xeric.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 1 },
          hardcore: { min: 1, max: 2 },
        },
      },
    ],
  },
  theatre_of_blood: {
    womKey: 'theatre_of_blood',
    id: 'theatreOfBlood',
    displayName: 'Theatre of Blood',
    shortName: 'ToB',
    tags: ['raid', 'group', 'difficult'],
    enabled: true,
    quantities: {
      short: { min: 5, max: 15 },
      medium: { min: 10, max: 20 },
      long: { min: 10, max: 25 },
    },
    drops: [
      "Lil' Zik",
      'Scythe of Vitur',
      'Ghrazi Rapier',
      'Sanguinesti Staff',
      'Avernic Defender Hilt',
      'Justiciar Faceguard',
      'Justiciar Chestguard',
      'Justiciar Legguards',
    ],
    dropQuantities: {
      medium: { min: 1, max: 1 },
      long: { min: 2, max: 2 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_theatreOfBlood',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Blood Sport',
        descriptionTemplate: 'Obtain {quantity} drops from Theatre of Blood.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 1 },
          hardcore: { min: 1, max: 2 },
        },
      },
    ],
  },
  theatre_of_blood_hard_mode: {
    womKey: 'theatre_of_blood_hard_mode',
    id: 'theatreOfBloodHardMode',
    displayName: 'Hard Mode Theatre of Blood',
    shortName: 'HMT',
    tags: ['raid', 'group', 'difficult'],
    enabled: true,
    quantities: {
      short: { min: 5, max: 15 },
      medium: { min: 10, max: 20 },
      long: { min: 10, max: 25 },
    },
    drops: [
      "Lil' Zik",
      'Scythe of Vitur',
      'Ghrazi Rapier',
      'Sanguinesti Staff',
      'Avernic Defender Hilt',
      'Justiciar Faceguard',
      'Justiciar Chestguard',
      'Justiciar Legguards',
      'Holy Ornament Kit',
      'Sanguine Ornament Kit',
      'Sanguine Dust',
    ],
    dropQuantities: {
      medium: { min: 1, max: 1 },
      long: { min: 2, max: 2 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_theatreOfBloodHardMode',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Theatre of Pain',
        descriptionTemplate: 'Obtain {quantity} drops from Hard Mode Theatre of Blood.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 1 },
          hardcore: { min: 1, max: 2 },
        },
      },
    ],
  },
  tombs_of_amascut: {
    womKey: 'tombs_of_amascut',
    id: 'tombsOfAmascut',
    displayName: 'Tombs of Amascut',
    shortName: 'ToA',
    tags: ['raid', 'group', 'scaling', 'invocation'],
    enabled: true,
    quantities: {
      short: { min: 5, max: 15 },
      medium: { min: 10, max: 20 },
      long: { min: 10, max: 25 },
    },
    drops: [
      "Tumeken's Guardian",
      "Tumeken's Shadow",
      "Osmumten's Fang",
      'Masori Mask',
      'Masori Body',
      'Masori Chaps',
      'Lightbearer',
      "Elidinis' Ward",
    ],
    dropQuantities: {
      medium: { min: 1, max: 1 },
      long: { min: 2, max: 2 },
    },
    killsPerHour: null,
    cfTasks: [
      {
        id: 'pvm_tombsOfAmascut',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'adept',
        label: 'Desert Delve',
        descriptionTemplate: 'Obtain {quantity} drops from Tombs of Amascut.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 1 },
          hardcore: { min: 1, max: 2 },
        },
      },
    ],
  },
  tombs_of_amascut_expert: {
    womKey: 'tombs_of_amascut_expert',
    id: 'tombsOfAmascutExpert',
    displayName: 'Tombs of Amascut (Expert)',
    shortName: 'ToA Expert',
    tags: ['raid', 'group', 'scaling', 'invocation', 'difficult'],
    enabled: false,
    quantities: {
      short: { min: 5, max: 10 },
      medium: { min: 10, max: 15 },
      long: { min: 10, max: 20 },
    },
    drops: null,
    dropQuantities: null,
    killsPerHour: null,
    cw: null,
  },
};

// ── SKILLS ─────────────────────────────────────────────────────────────────────
// Keyed by WOM Skill enum value. All lowercase single words — no underscore mapping
// needed. WOM uses british spelling: 'defence' not 'defense'.
// Skills have no cw or gr blocks; they appear in those systems via xp_gain
// objectives which reference the womKey directly.

const SKILLS = {
  fishing: {
    womKey: 'fishing',
    id: 'fishing',
    displayName: 'Fishing',
    category: 'gathering',
    tags: ['afk', 'relaxing', 'profitable'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
    cfTasks: [
      {
        id: 'skl_fishing_xp',
        role: 'SKILLER',
        type: 'xp_gain',
        difficulty: 'adept',
        label: "Gone Fishin'",
        descriptionTemplate: 'Earn {quantity} Fishing XP.',
        quantities: {
          casual: { min: 250000, max: 500000 },
          standard: { min: 500000, max: 1000000 },
          hardcore: { min: 1000000, max: 2000000 },
        },
      },
    ],
  },
  woodcutting: {
    womKey: 'woodcutting',
    id: 'woodcutting',
    displayName: 'Woodcutting',
    category: 'gathering',
    tags: ['afk', 'relaxing'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
    cfTasks: [
      {
        id: 'skl_woodcutting_xp',
        role: 'SKILLER',
        type: 'xp_gain',
        difficulty: 'adept',
        label: 'Timber!',
        descriptionTemplate: 'Earn {quantity} Woodcutting XP.',
        quantities: {
          casual: { min: 250000, max: 500000 },
          standard: { min: 500000, max: 1000000 },
          hardcore: { min: 1000000, max: 2000000 },
        },
      },
    ],
  },
  mining: {
    womKey: 'mining',
    id: 'mining',
    displayName: 'Mining',
    category: 'gathering',
    tags: ['afk', 'relaxing', 'profitable'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
    cfTasks: [
      {
        id: 'skl_mining_xp',
        role: 'SKILLER',
        type: 'xp_gain',
        difficulty: 'adept',
        label: 'Rock Solid',
        descriptionTemplate: 'Earn {quantity} Mining XP.',
        quantities: {
          casual: { min: 250000, max: 500000 },
          standard: { min: 500000, max: 1000000 },
          hardcore: { min: 1000000, max: 2000000 },
        },
      },
    ],
  },
  farming: {
    womKey: 'farming',
    id: 'farming',
    displayName: 'Farming',
    category: 'gathering',
    tags: ['passive', 'profitable'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
  },
  hunter: {
    womKey: 'hunter',
    id: 'hunter',
    displayName: 'Hunter',
    category: 'gathering',
    tags: ['varied', 'click-intensive'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
    cfTasks: [
      {
        id: 'skl_hunter_xp',
        role: 'SKILLER',
        type: 'xp_gain',
        difficulty: 'adept',
        label: 'Hunt or Be Hunted',
        descriptionTemplate: 'Earn {quantity} Hunter XP.',
        quantities: {
          casual: { min: 250000, max: 500000 },
          standard: { min: 500000, max: 1000000 },
          hardcore: { min: 1000000, max: 2000000 },
        },
      },
    ],
  },
  sailing: {
    womKey: 'sailing',
    id: 'sailing',
    displayName: 'Sailing',
    category: 'gathering',
    tags: ['varied', 'profitable', 'click-intensive'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
    cfTasks: [
      {
        id: 'skl_sailing_xp',
        role: 'SKILLER',
        type: 'xp_gain',
        difficulty: 'adept',
        label: 'Set Sail',
        descriptionTemplate: 'Earn {quantity} Sailing XP.',
        quantities: {
          casual: { min: 250000, max: 500000 },
          standard: { min: 500000, max: 1000000 },
          hardcore: { min: 1000000, max: 2000000 },
        },
      },
    ],
  },
  agility: {
    womKey: 'agility',
    id: 'agility',
    displayName: 'Agility',
    category: 'support',
    tags: ['click-intensive', 'useful'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
    cfTasks: [
      {
        id: 'skl_agility_xp',
        role: 'SKILLER',
        type: 'xp_gain',
        difficulty: 'adept',
        label: 'Parkour Pro',
        descriptionTemplate: 'Earn {quantity} Agility XP.',
        quantities: {
          casual: { min: 250000, max: 500000 },
          standard: { min: 500000, max: 1000000 },
          hardcore: { min: 1000000, max: 2000000 },
        },
      },
    ],
  },
  thieving: {
    womKey: 'thieving',
    id: 'thieving',
    displayName: 'Thieving',
    category: 'support',
    tags: ['click-intensive', 'profitable'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
    cfTasks: [
      {
        id: 'skl_thieving_xp',
        role: 'SKILLER',
        type: 'xp_gain',
        difficulty: 'adept',
        label: 'Five-Finger Discount',
        descriptionTemplate: 'Earn {quantity} Thieving XP.',
        quantities: {
          casual: { min: 250000, max: 500000 },
          standard: { min: 500000, max: 1000000 },
          hardcore: { min: 1000000, max: 2000000 },
        },
      },
    ],
  },
  firemaking: {
    womKey: 'firemaking',
    id: 'firemaking',
    displayName: 'Firemaking',
    category: 'support',
    tags: ['fast', 'easy', 'wintertodt'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
    cfTasks: [
      {
        id: 'skl_firemaking_xp',
        role: 'SKILLER',
        type: 'xp_gain',
        difficulty: 'adept',
        label: 'Trial by Fire',
        descriptionTemplate: 'Earn {quantity} Firemaking XP.',
        quantities: {
          casual: { min: 250000, max: 500000 },
          standard: { min: 500000, max: 1000000 },
          hardcore: { min: 1000000, max: 2000000 },
        },
      },
    ],
  },
  slayer: {
    womKey: 'slayer',
    id: 'slayer',
    displayName: 'Slayer',
    category: 'combat',
    tags: ['combat', 'varied', 'profitable'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
    cfTasks: [
      {
        id: 'skl_slayer_xp',
        role: 'SKILLER',
        type: 'xp_gain',
        difficulty: 'adept',
        label: 'Monster Mash',
        descriptionTemplate: 'Earn {quantity} Slayer XP.',
        quantities: {
          casual: { min: 250000, max: 500000 },
          standard: { min: 500000, max: 1000000 },
          hardcore: { min: 1000000, max: 2000000 },
        },
      },
    ],
  },
  herblore: {
    womKey: 'herblore',
    id: 'herblore',
    displayName: 'Herblore',
    category: 'artisan',
    tags: ['expensive', 'useful'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
    cfTasks: [
      {
        id: 'skl_herblore_xp',
        role: 'SKILLER',
        type: 'xp_gain',
        difficulty: 'adept',
        label: 'Brewing Trouble',
        descriptionTemplate: 'Earn {quantity} Herblore XP.',
        quantities: {
          casual: { min: 250000, max: 500000 },
          standard: { min: 500000, max: 1000000 },
          hardcore: { min: 1000000, max: 2000000 },
        },
      },
    ],
  },
  construction: {
    womKey: 'construction',
    id: 'construction',
    displayName: 'Construction',
    category: 'artisan',
    tags: ['expensive', 'useful', 'fast'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
  },
  cooking: {
    womKey: 'cooking',
    id: 'cooking',
    displayName: 'Cooking',
    category: 'artisan',
    tags: ['fast', 'easy'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
    cfTasks: [
      {
        id: 'skl_cooking_xp',
        role: 'SKILLER',
        type: 'xp_gain',
        difficulty: 'adept',
        label: 'Master Chef',
        descriptionTemplate: 'Earn {quantity} Cooking XP.',
        quantities: {
          casual: { min: 500000, max: 1000000 },
          standard: { min: 1000000, max: 1500000 },
          hardcore: { min: 1500000, max: 2500000 },
        },
      },
    ],
  },
  smithing: {
    womKey: 'smithing',
    id: 'smithing',
    displayName: 'Smithing',
    category: 'artisan',
    tags: ['slow', 'expensive'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
    cfTasks: [
      {
        id: 'skl_smithing_xp',
        role: 'SKILLER',
        type: 'xp_gain',
        difficulty: 'adept',
        label: 'Iron Will',
        descriptionTemplate: 'Earn {quantity} Smithing XP.',
        quantities: {
          casual: { min: 250000, max: 500000 },
          standard: { min: 500000, max: 1000000 },
          hardcore: { min: 1000000, max: 2000000 },
        },
      },
    ],
  },
  crafting: {
    womKey: 'crafting',
    id: 'crafting',
    displayName: 'Crafting',
    category: 'artisan',
    tags: ['varied', 'profitable'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
    cfTasks: [
      {
        id: 'skl_crafting_xp',
        role: 'SKILLER',
        type: 'xp_gain',
        difficulty: 'adept',
        label: 'Hands of Gold',
        descriptionTemplate: 'Earn {quantity} Crafting XP.',
        quantities: {
          casual: { min: 500000, max: 1000000 },
          standard: { min: 500000, max: 1000000 },
          hardcore: { min: 1000000, max: 2000000 },
        },
      },
    ],
  },
  fletching: {
    womKey: 'fletching',
    id: 'fletching',
    displayName: 'Fletching',
    category: 'artisan',
    tags: ['fast', 'afk'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
    cfTasks: [
      {
        id: 'skl_fletching_xp',
        role: 'SKILLER',
        type: 'xp_gain',
        difficulty: 'adept',
        label: 'Arrowheads and Feathers',
        descriptionTemplate: 'Earn {quantity} Fletching XP.',
        quantities: {
          casual: { min: 250000, max: 500000 },
          standard: { min: 500000, max: 1000000 },
          hardcore: { min: 1000000, max: 2000000 },
        },
      },
    ],
  },
  runecrafting: {
    womKey: 'runecrafting',
    id: 'runecrafting',
    displayName: 'Runecrafting',
    category: 'artisan',
    tags: ['slow', 'profitable'],
    enabled: true,
    quantities: {
      short: { min: 300000, max: 500000 },
      medium: { min: 500000, max: 1000000 },
      long: { min: 800000, max: 1500000 },
    },
    cfTasks: [
      {
        id: 'skl_runecrafting_xp',
        role: 'SKILLER',
        type: 'xp_gain',
        difficulty: 'adept',
        label: 'Rune Factory',
        descriptionTemplate: 'Earn {quantity} Runecrafting XP.',
        quantities: {
          casual: { min: 250000, max: 500000 },
          standard: { min: 500000, max: 1000000 },
          hardcore: { min: 1000000, max: 2000000 },
        },
      },
    ],
  },
};

// ── MINIGAMES ──────────────────────────────────────────────────────────────────
// Keyed by internal camelCase id. womKey maps to WOM Activity or Boss enum where
// a direct 1:1 exists. womKey: null means WOM doesn't track this minigame.
// cw block present for minigames that appear in champion forge objectives.

const MINIGAMES = {
  tempoross: {
    womKey: 'tempoross',
    id: 'tempoross',
    displayName: 'Tempoross',
    category: 'skilling',
    tags: ['fishing', 'group', 'safe'],
    enabled: true,
    quantities: {
      short: { min: 5, max: 15 },
      medium: { min: 10, max: 20 },
      long: { min: 12, max: 25 },
    },
    drops: [
      'Tiny Tempor',
      'Tackle Box',
      'Fishing Barrel',
      'Tome of Water',
      'Big Harpoonfish',
      'Dragon Harpoon',
    ],
    cfTasks: [
      {
        id: 'skl_tempoross',
        role: 'SKILLER',
        type: 'minigame_completions',
        difficulty: 'adept',
        label: 'Taming the Tide',
        descriptionTemplate: 'Complete {quantity} Tempoross.',
        quantities: {
          casual: { min: 7, max: 12 },
          standard: { min: 10, max: 20 },
          hardcore: { min: 15, max: 30 },
        },
      },
    ],
  },
  guardiansOfTheRift: {
    womKey: 'guardians_of_the_rift',
    id: 'guardiansOfTheRift',
    displayName: 'Guardians of the Rift',
    category: 'skilling',
    tags: ['runecrafting', 'group', 'safe'],
    enabled: true,
    quantities: {
      short: { min: 5, max: 15 },
      medium: { min: 10, max: 20 },
      long: { min: 12, max: 25 },
    },
    drops: ['Abyssal Green Dye', 'Abyssal Blue Dye', 'Abyssal Red Dye'],
    cfTasks: [
      {
        id: 'skl_guardiansOfTheRift',
        role: 'SKILLER',
        type: 'minigame_completions',
        difficulty: 'adept',
        label: 'Rift Runner',
        descriptionTemplate: 'Complete {quantity} Guardians of the Rift.',
        quantities: {
          casual: { min: 7, max: 12 },
          standard: { min: 10, max: 20 },
          hardcore: { min: 15, max: 30 },
        },
      },
    ],
  },
  wintertodt: {
    womKey: 'wintertodt',
    id: 'wintertodt',
    displayName: 'Wintertodt',
    category: 'skilling',
    tags: ['firemaking', 'group', 'safe'],
    enabled: true,
    quantities: {
      short: { min: 5, max: 15 },
      medium: { min: 10, max: 20 },
      long: { min: 12, max: 25 },
    },
    drops: [
      'Phoenix',
      'Tome of Fire',
      'Bruma Torch',
      'Warm Gloves',
      'Pyromancer Outfit',
      'Dragon Axe',
      'Magic Seed',
      'Torstol Seed',
    ],
    cfTasks: [
      {
        id: 'skl_wintertodt',
        role: 'SKILLER',
        type: 'minigame_completions',
        difficulty: 'adept',
        label: 'Into the Cold',
        descriptionTemplate: 'Complete {quantity} Wintertodt.',
        quantities: {
          casual: { min: 7, max: 12 },
          standard: { min: 10, max: 20 },
          hardcore: { min: 15, max: 30 },
        },
      },
    ],
  },
  zalcano: {
    womKey: 'zalcano',
    id: 'zalcano',
    displayName: 'Zalcano',
    category: 'skilling',
    tags: ['mining', 'group', 'fun'],
    enabled: true,
    quantities: {
      short: { min: 5, max: 15 },
      medium: { min: 10, max: 20 },
      long: { min: 12, max: 25 },
    },
    drops: ['Smolcano', 'Crystal Tool Seed', 'Zalcano Shard', 'Uncut Onyx'],
    cfTasks: [
      {
        id: 'skl_zalcano',
        role: 'SKILLER',
        type: 'minigame_completions',
        difficulty: 'adept',
        label: 'Rock the Boat',
        descriptionTemplate: 'Complete {quantity} Zalcano.',
        quantities: {
          casual: { min: 7, max: 12 },
          standard: { min: 10, max: 20 },
          hardcore: { min: 15, max: 30 },
        },
      },
    ],
  },
  barbarianAssault: {
    womKey: null,
    id: 'barbarianAssault',
    displayName: 'Barbarian Assault',
    category: 'combat',
    tags: ['group', 'teamwork', 'rewards'],
    enabled: true,
    quantities: {
      short: { min: 5, max: 8 },
      medium: { min: 7, max: 12 },
      long: { min: 8, max: 15 },
    },
    drops: null,
    cfTasks: [
      {
        id: 'skl_barbarianAssault',
        role: 'SKILLER',
        type: 'minigame_completions',
        difficulty: 'adept',
        label: 'Hold the Line',
        descriptionTemplate: 'Complete {quantity} Barbarian Assault.',
        quantities: {
          casual: { min: 5, max: 7 },
          standard: { min: 7, max: 12 },
          hardcore: { min: 10, max: 20 },
        },
      },
    ],
  },
  pestControl: {
    womKey: null,
    id: 'pestControl',
    displayName: 'Pest Control',
    category: 'combat',
    tags: ['group', 'combat-xp', 'void'],
    enabled: true,
    quantities: {
      short: { min: 5, max: 15 },
      medium: { min: 10, max: 20 },
      long: { min: 12, max: 25 },
    },
    drops: null,
    cfTasks: [
      {
        id: 'pvm_pestControl',
        role: 'PVMER',
        type: 'minigame_completions',
        difficulty: 'adept',
        label: 'Bug Hunt',
        descriptionTemplate: 'Complete {quantity} Pest Control.',
        quantities: {
          casual: { min: 7, max: 12 },
          standard: { min: 10, max: 20 },
          hardcore: { min: 15, max: 30 },
        },
      },
    ],
  },
  castleWars: {
    womKey: null,
    id: 'castleWars',
    displayName: 'Castle Wars',
    category: 'pvp',
    tags: ['group', 'pvp', 'fun'],
    enabled: true,
    quantities: {
      short: { min: 5, max: 15 },
      medium: { min: 10, max: 20 },
      long: { min: 12, max: 25 },
    },
    drops: null,
    cw: null,
  },
  fightCaves: {
    womKey: 'tztok_jad',
    id: 'fightCaves',
    displayName: 'Fight Caves',
    category: 'combat',
    tags: ['solo', 'jad', 'fire-cape'],
    enabled: true,
    quantities: {
      short: { min: 1, max: 3 },
      medium: { min: 1, max: 5 },
      long: { min: 5, max: 8 },
    },
    drops: null,
    cfTasks: [
      {
        id: 'pvm_fightCaves',
        role: 'PVMER',
        type: 'minigame_completions',
        difficulty: 'adept',
        label: 'Fire Hazard',
        descriptionTemplate: 'Complete {quantity} Fight Caves.',
        quantities: {
          casual: { min: 1, max: 3 },
          standard: { min: 1, max: 5 },
          hardcore: { min: 2, max: 7 },
        },
      },
    ],
  },
  inferno: {
    womKey: 'tzkal_zuk',
    id: 'inferno',
    displayName: 'Inferno',
    category: 'combat',
    tags: ['solo', 'zuk', 'difficult', 'infernal-cape'],
    enabled: true,
    quantities: {
      short: { min: 1, max: 1 },
      medium: { min: 1, max: 3 },
      long: { min: 3, max: 5 },
    },
    drops: null,
    cfTasks: [
      {
        id: 'pvm_inferno',
        role: 'PVMER',
        type: 'minigame_completions',
        difficulty: 'adept',
        label: 'Through the Inferno',
        descriptionTemplate: 'Complete {quantity} Inferno.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 1, max: 3 },
          hardcore: { min: 2, max: 4 },
        },
      },
    ],
  },
  colosseum: {
    womKey: 'sol_heredit',
    id: 'colosseum',
    displayName: 'Colosseum',
    category: 'combat',
    tags: ['solo', 'quiver', 'difficult'],
    enabled: true,
    quantities: {
      short: { min: 1, max: 1 },
      medium: { min: 1, max: 3 },
      long: { min: 4, max: 7 },
    },
    drops: [
      'Sunfire Fanatic Helm',
      'Sunfire Fanatic Cuirass',
      'Sunfire Fanatic Chausses',
      'Tonalztics of Ralos',
      'Echo Crystal',
      'Smol Heredit',
    ],
    cfTasks: [
      {
        id: 'pvm_colosseum',
        role: 'PVMER',
        type: 'minigame_completions',
        difficulty: 'adept',
        label: 'Glory in the Sand',
        descriptionTemplate: 'Complete {quantity} Colosseum.',
        quantities: {
          casual: { min: 1, max: 2 },
          standard: { min: 1, max: 3 },
          hardcore: { min: 2, max: 4 },
        },
      },
      {
        id: 'pvm_fortisColosseum',
        role: 'PVMER',
        type: 'item_collection',
        difficulty: 'master',
        label: 'Sand and Blood',
        descriptionTemplate: 'Obtain {quantity} drops from the Fortis Colosseum.',
        quantities: {
          casual: { min: 1, max: 1 },
          standard: { min: 1, max: 2 },
          hardcore: { min: 2, max: 3 },
        },
      },
    ],
  },
};

// ── CLUES ──────────────────────────────────────────────────────────────────────
// Keyed by WOM Activity enum value. The short tier id is stored in `id` for
// backward compatibility with ContentSelectionModal grouping logic.

const CLUES = {
  clue_scrolls_beginner: {
    womKey: 'clue_scrolls_beginner',
    id: 'beginner',
    displayName: 'Beginner Clues',
    color: 'pink',
    enabled: true,
    quantities: {
      short: { min: 10, max: 20 },
      medium: { min: 15, max: 20 },
      long: { min: 20, max: 25 },
    },
  },
  clue_scrolls_easy: {
    womKey: 'clue_scrolls_easy',
    id: 'easy',
    displayName: 'Easy Clues',
    color: 'green',
    enabled: true,
    quantities: {
      short: { min: 10, max: 20 },
      medium: { min: 15, max: 20 },
      long: { min: 20, max: 25 },
    },
  },
  clue_scrolls_medium: {
    womKey: 'clue_scrolls_medium',
    id: 'medium',
    displayName: 'Medium Clues',
    color: 'blue',
    enabled: true,
    quantities: {
      short: { min: 8, max: 12 },
      medium: { min: 10, max: 15 },
      long: { min: 15, max: 25 },
    },
  },
  clue_scrolls_hard: {
    womKey: 'clue_scrolls_hard',
    id: 'hard',
    displayName: 'Hard Clues',
    color: 'purple',
    enabled: true,
    quantities: {
      short: { min: 5, max: 10 },
      medium: { min: 7, max: 12 },
      long: { min: 10, max: 15 },
    },
  },
  clue_scrolls_elite: {
    womKey: 'clue_scrolls_elite',
    id: 'elite',
    displayName: 'Elite Clues',
    color: 'orange',
    enabled: true,
    quantities: {
      short: { min: 3, max: 5 },
      medium: { min: 5, max: 7 },
      long: { min: 8, max: 10 },
    },
  },
  clue_scrolls_master: {
    womKey: 'clue_scrolls_master',
    id: 'master',
    displayName: 'Master Clues',
    color: 'red',
    enabled: true,
    quantities: {
      short: { min: 2, max: 4 },
      medium: { min: 3, max: 6 },
      long: { min: 5, max: 10 },
    },
  },
};

// ── champion forge task pool ───────────────────────────────────────────────────

function getCfTaskPool() {
  const groups = {
    PVMER: { initiate: [], adept: [], master: [] },
    SKILLER: { initiate: [], adept: [], master: [] },
  };

  const collect = (entries, parentDrops) => {
    for (const entry of Object.values(entries)) {
      for (const task of entry.cfTasks ?? []) {
        const drops = parentDrops ? entry.drops ?? [] : [];
        groups[task.role][task.difficulty].push({ ...task, drops });
      }
    }
  };

  collect(BOSSES, true);
  collect(RAIDS, true);
  collect(MINIGAMES, true);
  collect(SKILLS, false);

  return groups;
}

// ── resolvers ──────────────────────────────────────────────────────────────────

function getBossKcBosses() {
  return Object.values(BOSSES).filter((b) => b.enabled && b.quantities != null);
}

function getDropBosses() {
  return Object.values(BOSSES).filter(
    (b) => b.enabled && b.drops != null && b.dropQuantities != null
  );
}

function getBossesWithMetric(metric) {
  if (metric === 'boss_kc') return getBossKcBosses();
  if (metric === 'item_collection') return getDropBosses();
  if (metric === 'both') {
    return Object.values(BOSSES).filter(
      (b) => b.enabled && b.quantities != null && b.drops != null && b.dropQuantities != null
    );
  }
  return [];
}

function getAcceptableDrops(id) {
  const boss = Object.values(BOSSES).find((b) => b.id === id);
  return boss?.drops ?? null;
}

// Returns sorted [{value: womKey, label: displayName}] for bosses + raids.
// Excludes entries with womKey: null (i.e. dagannoth_kings composite entry).
// Intended for group dashboard dropdown.
function getBossMetricOptions() {
  const bossOpts = Object.values(BOSSES)
    .filter((b) => b.womKey != null)
    .map((b) => ({ value: b.womKey, label: b.displayName }));
  const raidOpts = Object.values(RAIDS)
    .filter((r) => r.womKey != null)
    .map((r) => ({ value: r.womKey, label: r.displayName }));
  return [...bossOpts, ...raidOpts].sort((a, b) => a.label.localeCompare(b.label));
}

// Returns skill metric options for group dashboard dropdown.
function getSkillMetricOptions() {
  return Object.values(SKILLS)
    .map((s) => ({ value: s.womKey, label: s.displayName }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

// Returns clue metric options for group dashboard dropdown.
function getClueMetricOptions() {
  return Object.values(CLUES).map((c) => ({ value: c.womKey, label: c.displayName }));
}

// Keyed by camelCase id — matches the shape objectiveBuilder.js expects from SOLO_BOSSES.
function getSoloBossMap() {
  const map = {};
  for (const boss of Object.values(BOSSES)) {
    if (boss.enabled && boss.quantities != null) {
      map[boss.id] = {
        id: boss.id,
        name: boss.displayName,
        category: boss.category,
        tags: boss.tags,
        enabled: boss.enabled,
        quantities: boss.quantities,
        dropQuantities: boss.dropQuantities,
        drops: boss.drops,
      };
    }
  }
  return map;
}

// Keyed by camelCase id — matches the shape objectiveBuilder.js expects from RAIDS.
function getRaidMap() {
  const map = {};
  for (const raid of Object.values(RAIDS)) {
    if (raid.enabled) {
      map[raid.id] = {
        id: raid.id,
        name: raid.displayName,
        shortName: raid.shortName,
        tags: raid.tags,
        enabled: raid.enabled,
        quantities: raid.quantities,
        dropQuantities: raid.dropQuantities,
        drops: raid.drops,
      };
    }
  }
  return map;
}

// Keyed by camelCase id — matches the shape objectiveBuilder.js expects from SKILLS.
function getSkillMap() {
  const map = {};
  for (const skill of Object.values(SKILLS)) {
    map[skill.id] = {
      id: skill.id,
      name: skill.displayName,
      category: skill.category,
      tags: skill.tags,
      enabled: skill.enabled,
      quantities: skill.quantities,
    };
  }
  return map;
}

// Keyed by camelCase id — matches the shape objectiveBuilder.js expects from MINIGAMES.
function getMinigameMap() {
  const map = {};
  for (const mg of Object.values(MINIGAMES)) {
    map[mg.id] = {
      id: mg.id,
      name: mg.displayName,
      category: mg.category,
      tags: mg.tags,
      enabled: mg.enabled,
      quantities: mg.quantities,
      drops: mg.drops,
    };
  }
  return map;
}

// Keyed by short tier id — matches the shape objectiveBuilder.js expects from CLUE_TIERS.
function getClueMap() {
  const map = {};
  for (const clue of Object.values(CLUES)) {
    map[clue.id] = {
      id: clue.id,
      name: clue.displayName,
      color: clue.color,
      enabled: clue.enabled,
      quantities: clue.quantities,
    };
  }
  return map;
}

// Bosses with cw metadata — used by champion forge objective builder.
// Supports both legacy `cw` field and new `cfTasks` array.
// When `cfTasks` is present, synthesises a `cw` shim from the first task for backward compat.
function getCwBosses() {
  return Object.values(BOSSES)
    .filter((b) => b.cw != null || (b.cfTasks != null && b.cfTasks.length > 0))
    .map((b) => {
      if (b.cw != null) return b;
      const first = b.cfTasks[0];
      return { ...b, cw: { difficulty: first.difficulty, label: first.label } };
    });
}

// Raids with cw metadata — used by champion forge objective builder.
// Supports both legacy `cw` field and new `cfTasks` array.
function getCwRaids() {
  return Object.values(RAIDS)
    .filter((r) => r.cw != null || (r.cfTasks != null && r.cfTasks.length > 0))
    .map((r) => {
      if (r.cw != null) return r;
      const first = r.cfTasks[0];
      return { ...r, cw: { difficulty: first.difficulty, label: first.label } };
    });
}

// Full sets of valid WOM metric keys — used for validation.
function getValidWomBossKeys() {
  const bossKeys = Object.values(BOSSES)
    .filter((b) => b.womKey != null)
    .map((b) => b.womKey);
  const raidKeys = Object.values(RAIDS)
    .filter((r) => r.womKey != null)
    .map((r) => r.womKey);
  return new Set([...bossKeys, ...raidKeys]);
}

function getValidWomSkillKeys() {
  return new Set(Object.values(SKILLS).map((s) => s.womKey));
}

function getValidWomActivityKeys() {
  const minigameKeys = Object.values(MINIGAMES)
    .filter((m) => m.womKey != null)
    .map((m) => m.womKey);
  const clueKeys = Object.values(CLUES).map((c) => c.womKey);
  return new Set([...minigameKeys, ...clueKeys]);
}

// ── group dashboard metric options ────────────────────────────────────────────
// The group dashboard needs the complete WOM metric space, not just event-eligible
// content. These resolvers extend the event-focused ones to cover metrics like
// combat skills and PvP activities that have no place in event objectives.

// MINIGAME entries whose womKey falls under WOM's Boss enum (not Activity).
// They appear in the group dashboard "Boss KC" goal type.
const MINIGAME_BOSS_KEYS = new Set([
  'tempoross',
  'wintertodt',
  'zalcano',
  'tztok_jad',
  'tzkal_zuk',
  'sol_heredit',
]);

// Skills that are valid WOM Skill metrics but excluded from event objectives.
const COMBAT_SKILL_OPTIONS = [
  { value: 'overall', label: 'Overall' },
  { value: 'attack', label: 'Attack' },
  { value: 'defence', label: 'Defence' },
  { value: 'strength', label: 'Strength' },
  { value: 'hitpoints', label: 'Hitpoints' },
  { value: 'ranged', label: 'Ranged' },
  { value: 'prayer', label: 'Prayer' },
  { value: 'magic', label: 'Magic' },
];

// WOM Activity metrics excluded from event objectives but valid for group goals.
const EXTRA_ACTIVITY_OPTIONS = [
  { value: 'bounty_hunter_hunter', label: 'Bounty Hunter (Hunter)' },
  { value: 'bounty_hunter_rogue', label: 'Bounty Hunter (Rogue)' },
  { value: 'colosseum_glory', label: 'Colosseum Glory' },
  { value: 'last_man_standing', label: 'Last Man Standing' },
  { value: 'pvp_arena', label: 'PvP Arena' },
  { value: 'soul_wars_zeal', label: 'Soul Wars (Zeal)' },
];

// The registry uses a composite dagannoth_kings entry (womKey: null) for event
// objectives, but WOM tracks the three kings individually. Expose them for group goals.
const DAGANNOTH_KINGS_OPTIONS = [
  { value: 'dagannoth_prime', label: 'Dagannoth Prime' },
  { value: 'dagannoth_rex', label: 'Dagannoth Rex' },
  { value: 'dagannoth_supreme', label: 'Dagannoth Supreme' },
];

// All WOM Boss-enum metrics, including MINIGAME entries tracked as bosses by WOM.
function getGroupDashboardBossOptions() {
  const bossRaidOptions = getBossMetricOptions();
  const minigameBossOptions = Object.values(MINIGAMES)
    .filter((m) => m.womKey && MINIGAME_BOSS_KEYS.has(m.womKey))
    .map((m) => ({ value: m.womKey, label: m.displayName }));
  return [...bossRaidOptions, ...minigameBossOptions, ...DAGANNOTH_KINGS_OPTIONS].sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}

// All WOM Skill-enum metrics, including combat stats excluded from event objectives.
function getGroupDashboardSkillOptions() {
  return [...getSkillMetricOptions(), ...COMBAT_SKILL_OPTIONS].sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}

// All clue tiers plus the WOM aggregate key, with All Clues first.
function getGroupDashboardClueOptions() {
  return [{ value: 'clue_scrolls_all', label: 'All Clues' }, ...getClueMetricOptions()];
}

// All WOM Activity-enum metrics that aren't clues — registry entries plus
// PvP/misc activities excluded from event objectives.
function getGroupDashboardActivityOptions() {
  const registryActivityOptions = Object.values(MINIGAMES)
    .filter((m) => m.womKey && !MINIGAME_BOSS_KEYS.has(m.womKey))
    .map((m) => ({ value: m.womKey, label: m.displayName }));
  return [...registryActivityOptions, ...EXTRA_ACTIVITY_OPTIONS].sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}

// ── exports ────────────────────────────────────────────────────────────────────

module.exports = {
  registry: { BOSSES, RAIDS, SKILLS, MINIGAMES, CLUES },
  getBossKcBosses,
  getDropBosses,
  getBossesWithMetric,
  getAcceptableDrops,
  getBossMetricOptions,
  getSkillMetricOptions,
  getClueMetricOptions,
  getSoloBossMap,
  getRaidMap,
  getSkillMap,
  getMinigameMap,
  getClueMap,
  getCwBosses,
  getCwRaids,
  getCfTaskPool,
  getValidWomBossKeys,
  getValidWomSkillKeys,
  getValidWomActivityKeys,
  getGroupDashboardBossOptions,
  getGroupDashboardSkillOptions,
  getGroupDashboardClueOptions,
  getGroupDashboardActivityOptions,
};
