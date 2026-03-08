'use strict';

/**
 * Champion Forge — Handcrafted Item Set (~50 items)
 * General fantasy RPG naming. No third-party IP.
 *
 * Rarity colours (for UI): common=grey, uncommon=green, rare=blue, epic=purple
 * Stats: attack, defense, speed, crit (%), hp (flat)
 * Specials (rare/epic only): cleave, ambush, barrage, chain_lightning, fortress, lifesteal
 * Consumable types: food, potion, elixir, utility
 */

const ITEMS = [
  // ============================================================
  // WEAPONS (pvmer)
  // ============================================================

  // --- common ---
  { name: 'Rusted Shortsword',      slot: 'weapon', rarity: 'common',   stats: { attack: 10, defense: 0, speed: 7,  crit: 3,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Ironwood Shortbow',      slot: 'weapon', rarity: 'common',   stats: { attack: 12, defense: 0, speed: 9,  crit: 4,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Battered Mace',          slot: 'weapon', rarity: 'common',   stats: { attack: 14, defense: 0, speed: 5,  crit: 2,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Apprentice\'s Staff',    slot: 'weapon', rarity: 'common',   stats: { attack: 11, defense: 0, speed: 6,  crit: 3,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Thornwood Spear',        slot: 'weapon', rarity: 'uncommon', stats: { attack: 22, defense: 0, speed: 10, crit: 6,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Grimfang Dagger',        slot: 'weapon', rarity: 'uncommon', stats: { attack: 18, defense: 0, speed: 15, crit: 10, hp: 0  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Emberstrike Wand',       slot: 'weapon', rarity: 'uncommon', stats: { attack: 25, defense: 0, speed: 9,  crit: 7,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Stonehide Axe',          slot: 'weapon', rarity: 'uncommon', stats: { attack: 28, defense: 0, speed: 7,  crit: 5,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Axe of the Fallen King', slot: 'weapon', rarity: 'rare',    stats: { attack: 38, defense: 0, speed: 12, crit: 12, hp: 0  }, special: { id: 'cleave',     label: 'Cleave',     description: '80% damage + bleed (5/turn, 3 turns)' }, consumableType: null, consumableEffect: null },
  { name: 'Void-touched Wand',      slot: 'weapon', rarity: 'rare',    stats: { attack: 35, defense: 0, speed: 16, crit: 15, hp: 0  }, special: { id: 'ambush',    label: 'Ambush',     description: 'Ignore defense, guaranteed crit' }, consumableType: null, consumableEffect: null },
  { name: 'Shadowstep Dagger',      slot: 'weapon', rarity: 'rare',    stats: { attack: 30, defense: 0, speed: 22, crit: 18, hp: 0  }, special: { id: 'barrage',   label: 'Barrage',    description: 'Attack twice at 65% power' }, consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Dreadmarrow Staff',      slot: 'weapon', rarity: 'epic',    stats: { attack: 58, defense: 0, speed: 20, crit: 20, hp: 0  }, special: { id: 'chain_lightning', label: 'Chain Lightning', description: '120% magic damage, bypasses defense' }, consumableType: null, consumableEffect: null },
  { name: 'Soulrender Blade',       slot: 'weapon', rarity: 'epic',    stats: { attack: 65, defense: 0, speed: 18, crit: 22, hp: 0  }, special: { id: 'lifesteal', label: 'Lifesteal',  description: 'Heal 30% of damage dealt this turn' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // HELMS (pvmer)
  // ============================================================

  // --- common ---
  { name: 'Copper Skullcap',        slot: 'helm', rarity: 'common',   stats: { attack: 0, defense: 10, speed: 5,  crit: 0, hp: 10 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Leather Coif',           slot: 'helm', rarity: 'common',   stats: { attack: 0, defense: 8,  speed: 7,  crit: 2, hp: 8  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Dented Iron Helm',       slot: 'helm', rarity: 'common',   stats: { attack: 0, defense: 14, speed: 4,  crit: 0, hp: 12 }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Bonecrest Visor',        slot: 'helm', rarity: 'uncommon', stats: { attack: 0, defense: 22, speed: 8,  crit: 4, hp: 20 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Serpentscale Faceguard', slot: 'helm', rarity: 'uncommon', stats: { attack: 0, defense: 26, speed: 10, crit: 5, hp: 18 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Iron War Mask',          slot: 'helm', rarity: 'uncommon', stats: { attack: 0, defense: 28, speed: 7,  crit: 3, hp: 22 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Helm of the Forsaken',   slot: 'helm', rarity: 'rare',    stats: { attack: 5, defense: 38, speed: 12, crit: 8, hp: 35 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' }, consumableType: null, consumableEffect: null },
  { name: 'Hexplate War Crown',     slot: 'helm', rarity: 'rare',    stats: { attack: 8, defense: 35, speed: 14, crit: 10, hp: 30 }, special: { id: 'ambush',  label: 'Ambush',  description: 'Ignore defense, guaranteed crit' }, consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Dreadhelm of the Abyss', slot: 'helm', rarity: 'epic',   stats: { attack: 10, defense: 55, speed: 18, crit: 15, hp: 60 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // CHEST (pvmer)
  // ============================================================

  // --- common ---
  { name: 'Tattered Ringmail',      slot: 'chest', rarity: 'common',   stats: { attack: 0, defense: 12, speed: 4, crit: 0, hp: 15 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Padded Gambeson',        slot: 'chest', rarity: 'common',   stats: { attack: 0, defense: 10, speed: 6, crit: 0, hp: 12 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Cracked Plate Vest',     slot: 'chest', rarity: 'common',   stats: { attack: 0, defense: 15, speed: 3, crit: 0, hp: 18 }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Serpentscale Hauberk',   slot: 'chest', rarity: 'uncommon', stats: { attack: 0, defense: 26, speed: 8, crit: 3, hp: 28 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Hexplate Brigandine',    slot: 'chest', rarity: 'uncommon', stats: { attack: 0, defense: 28, speed: 7, crit: 4, hp: 30 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Gloomweave Tunic',       slot: 'chest', rarity: 'uncommon', stats: { attack: 0, defense: 24, speed: 10, crit: 5, hp: 25 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Void Warplate',          slot: 'chest', rarity: 'rare',    stats: { attack: 5, defense: 40, speed: 12, crit: 8, hp: 45 }, special: { id: 'lifesteal', label: 'Lifesteal', description: 'Heal 30% of damage dealt this turn' }, consumableType: null, consumableEffect: null },
  { name: 'Stormforged Chestplate', slot: 'chest', rarity: 'rare',    stats: { attack: 8, defense: 38, speed: 14, crit: 10, hp: 40 }, special: { id: 'barrage',   label: 'Barrage',   description: 'Attack twice at 65% power' }, consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Abyssal Warplate',       slot: 'chest', rarity: 'epic',    stats: { attack: 12, defense: 58, speed: 16, crit: 14, hp: 75 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // LEGS (pvmer)
  // ============================================================

  // --- common ---
  { name: 'Worn Leather Leggings',  slot: 'legs', rarity: 'common',   stats: { attack: 0, defense: 8,  speed: 6, crit: 0, hp: 10 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Chain Chausses',         slot: 'legs', rarity: 'common',   stats: { attack: 0, defense: 12, speed: 4, crit: 0, hp: 14 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Patched Battle Skirt',   slot: 'legs', rarity: 'common',   stats: { attack: 0, defense: 10, speed: 5, crit: 1, hp: 12 }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Ironhide Greaves',       slot: 'legs', rarity: 'uncommon', stats: { attack: 0, defense: 24, speed: 8, crit: 3, hp: 25 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Bonescale Tassets',      slot: 'legs', rarity: 'uncommon', stats: { attack: 0, defense: 26, speed: 7, crit: 4, hp: 28 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Ashwalker Trousers',     slot: 'legs', rarity: 'uncommon', stats: { attack: 0, defense: 22, speed: 10, crit: 5, hp: 22 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Gravewarden Tassets',    slot: 'legs', rarity: 'rare',    stats: { attack: 5, defense: 36, speed: 12, crit: 8, hp: 40 }, special: { id: 'cleave',   label: 'Cleave',   description: '80% damage + bleed (5/turn, 3 turns)' }, consumableType: null, consumableEffect: null },
  { name: 'Voidstep Legguards',     slot: 'legs', rarity: 'rare',    stats: { attack: 6, defense: 34, speed: 16, crit: 10, hp: 35 }, special: { id: 'ambush',  label: 'Ambush',  description: 'Ignore defense, guaranteed crit' }, consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Dreadknight Legplates',  slot: 'legs', rarity: 'epic',    stats: { attack: 10, defense: 52, speed: 18, crit: 14, hp: 65 }, special: { id: 'chain_lightning', label: 'Chain Lightning', description: '120% magic damage, bypasses defense' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // GLOVES (pvmer)
  // ============================================================

  // --- common ---
  { name: 'Cloth Wraps',            slot: 'gloves', rarity: 'common',   stats: { attack: 4, defense: 5, speed: 5, crit: 2, hp: 5  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Worn Leather Bracers',   slot: 'gloves', rarity: 'common',   stats: { attack: 5, defense: 6, speed: 4, crit: 3, hp: 6  }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Steelstitch Gauntlets',  slot: 'gloves', rarity: 'uncommon', stats: { attack: 10, defense: 14, speed: 8, crit: 6, hp: 15 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Grizzly Paw Gloves',     slot: 'gloves', rarity: 'uncommon', stats: { attack: 12, defense: 12, speed: 9, crit: 8, hp: 12 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Riftweave Handguards',   slot: 'gloves', rarity: 'rare',    stats: { attack: 20, defense: 22, speed: 14, crit: 14, hp: 25 }, special: { id: 'barrage', label: 'Barrage', description: 'Attack twice at 65% power' }, consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Gauntlets of the Undying', slot: 'gloves', rarity: 'epic', stats: { attack: 30, defense: 35, speed: 20, crit: 20, hp: 40 }, special: { id: 'lifesteal', label: 'Lifesteal', description: 'Heal 30% of damage dealt this turn' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // BOOTS (pvmer)
  // ============================================================

  // --- common ---
  { name: 'Tattered Sandals',       slot: 'boots', rarity: 'common',   stats: { attack: 0, defense: 4, speed: 8,  crit: 1, hp: 5  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Worn Iron Greaves',      slot: 'boots', rarity: 'common',   stats: { attack: 0, defense: 8, speed: 5,  crit: 0, hp: 8  }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Quickfoot Wraps',        slot: 'boots', rarity: 'uncommon', stats: { attack: 0, defense: 12, speed: 16, crit: 5, hp: 12 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Ironhide Sabatons',      slot: 'boots', rarity: 'uncommon', stats: { attack: 0, defense: 18, speed: 10, crit: 3, hp: 18 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Shadowstriders',         slot: 'boots', rarity: 'rare',    stats: { attack: 5, defense: 20, speed: 22, crit: 12, hp: 25 }, special: { id: 'ambush', label: 'Ambush', description: 'Ignore defense, guaranteed crit' }, consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Boots of the Rift',      slot: 'boots', rarity: 'epic',    stats: { attack: 8, defense: 30, speed: 30, crit: 18, hp: 40 }, special: { id: 'barrage', label: 'Barrage', description: 'Attack twice at 65% power' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // SHIELDS (skiller)
  // ============================================================

  // --- common ---
  { name: 'Rotwood Buckler',        slot: 'shield', rarity: 'common',   stats: { attack: 0, defense: 14, speed: 4, crit: 0, hp: 15 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Copper Heater Shield',   slot: 'shield', rarity: 'common',   stats: { attack: 0, defense: 12, speed: 5, crit: 0, hp: 18 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Driftwood Targe',        slot: 'shield', rarity: 'common',   stats: { attack: 0, defense: 10, speed: 6, crit: 1, hp: 12 }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Stoneward Kite Shield',  slot: 'shield', rarity: 'uncommon', stats: { attack: 0, defense: 26, speed: 7, crit: 2, hp: 30 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Boneguard Defender',     slot: 'shield', rarity: 'uncommon', stats: { attack: 0, defense: 28, speed: 6, crit: 3, hp: 32 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Ironbark Pavise',        slot: 'shield', rarity: 'uncommon', stats: { attack: 0, defense: 24, speed: 8, crit: 4, hp: 28 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Runewall Aegis',         slot: 'shield', rarity: 'rare',    stats: { attack: 0, defense: 42, speed: 10, crit: 6, hp: 50 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' }, consumableType: null, consumableEffect: null },
  { name: 'Thornback Barrier',      slot: 'shield', rarity: 'rare',    stats: { attack: 8, defense: 38, speed: 12, crit: 8, hp: 45 }, special: { id: 'cleave',   label: 'Cleave',   description: '80% damage + bleed (5/turn, 3 turns)' }, consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Bulwark of the Last Age', slot: 'shield', rarity: 'epic',  stats: { attack: 0, defense: 62, speed: 14, crit: 10, hp: 75 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // RINGS (skiller)
  // ============================================================

  // --- common ---
  { name: 'Amber Band',             slot: 'ring', rarity: 'common',   stats: { attack: 3, defense: 3, speed: 4, crit: 2, hp: 5  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Pauper\'s Signet',       slot: 'ring', rarity: 'common',   stats: { attack: 2, defense: 4, speed: 3, crit: 3, hp: 8  }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Stoneward Ring',         slot: 'ring', rarity: 'uncommon', stats: { attack: 5, defense: 12, speed: 6, crit: 5, hp: 18 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Ring of the Houndmaster', slot: 'ring', rarity: 'uncommon', stats: { attack: 10, defense: 8, speed: 10, crit: 8, hp: 15 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Loop of the Undying',    slot: 'ring', rarity: 'rare',    stats: { attack: 12, defense: 18, speed: 14, crit: 14, hp: 30 }, special: { id: 'lifesteal', label: 'Lifesteal', description: 'Heal 30% of damage dealt this turn' }, consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Rift-Eye Band',          slot: 'ring', rarity: 'epic',    stats: { attack: 20, defense: 28, speed: 22, crit: 22, hp: 50 }, special: { id: 'chain_lightning', label: 'Chain Lightning', description: '120% magic damage, bypasses defense' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // AMULETS (skiller)
  // ============================================================

  // --- common ---
  { name: 'Bone Charm',             slot: 'amulet', rarity: 'common',   stats: { attack: 2, defense: 4, speed: 3, crit: 3, hp: 8  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Trinket of the Mire',    slot: 'amulet', rarity: 'common',   stats: { attack: 4, defense: 2, speed: 5, crit: 2, hp: 6  }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Pendant of the Deep',    slot: 'amulet', rarity: 'uncommon', stats: { attack: 8, defense: 10, speed: 8, crit: 6, hp: 20 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Embershard Torc',        slot: 'amulet', rarity: 'uncommon', stats: { attack: 12, defense: 8, speed: 10, crit: 8, hp: 18 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Amulet of the Thornveil', slot: 'amulet', rarity: 'rare',   stats: { attack: 15, defense: 20, speed: 14, crit: 12, hp: 35 }, special: { id: 'ambush', label: 'Ambush', description: 'Ignore defense, guaranteed crit' }, consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Collar of the Riftborn', slot: 'amulet', rarity: 'epic',    stats: { attack: 25, defense: 30, speed: 22, crit: 20, hp: 55 }, special: { id: 'cleave', label: 'Cleave', description: '80% damage + bleed (5/turn, 3 turns)' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // CAPES (skiller)
  // ============================================================

  // --- common ---
  { name: 'Tattered Wool Cloak',    slot: 'cape', rarity: 'common',   stats: { attack: 2, defense: 5, speed: 5, crit: 2, hp: 8  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Dustwalker Mantle',      slot: 'cape', rarity: 'common',   stats: { attack: 3, defense: 4, speed: 6, crit: 1, hp: 6  }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Shadowweave Cape',       slot: 'cape', rarity: 'uncommon', stats: { attack: 6, defense: 10, speed: 12, crit: 6, hp: 16 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Ironback Shroud',        slot: 'cape', rarity: 'uncommon', stats: { attack: 5, defense: 14, speed: 9,  crit: 5, hp: 20 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Voidweave Cloak',        slot: 'cape', rarity: 'rare',    stats: { attack: 12, defense: 22, speed: 18, crit: 10, hp: 32 }, special: { id: 'barrage', label: 'Barrage', description: 'Attack twice at 65% power' }, consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Cape of the Undying Veil', slot: 'cape', rarity: 'epic',  stats: { attack: 20, defense: 35, speed: 26, crit: 18, hp: 52 }, special: { id: 'lifesteal', label: 'Lifesteal', description: 'Heal 30% of damage dealt this turn' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // CONSUMABLES (skiller)
  // ============================================================

  // --- food (heal) ---
  { name: 'Boar Rib',               slot: 'consumable', rarity: 'common',   stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'food', consumableEffect: { type: 'heal', value: 40,  duration: 0, description: 'Restore 40 HP.' } },
  { name: 'Hunter\'s Stew',         slot: 'consumable', rarity: 'uncommon', stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'food', consumableEffect: { type: 'heal', value: 65,  duration: 0, description: 'Restore 65 HP.' } },
  { name: 'Hero\'s Feast',          slot: 'consumable', rarity: 'rare',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'food', consumableEffect: { type: 'heal', value: 90,  duration: 0, description: 'Restore 90 HP.' } },
  { name: 'Warlord\'s Banquet',     slot: 'consumable', rarity: 'epic',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'food', consumableEffect: { type: 'heal', value: 120, duration: 0, description: 'Restore 120 HP.' } },

  // --- potions (temp stat buffs) ---
  { name: 'Berserker Draught',      slot: 'consumable', rarity: 'common',   stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'potion', consumableEffect: { type: 'buff_attack',  value: 12, duration: 2, description: '+12 attack for 2 turns.' } },
  { name: 'Ironhide Salve',         slot: 'consumable', rarity: 'uncommon', stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'potion', consumableEffect: { type: 'buff_defense', value: 18, duration: 2, description: '+18 defense for 2 turns.' } },
  { name: 'Quickfoot Elixir',       slot: 'consumable', rarity: 'rare',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'potion', consumableEffect: { type: 'buff_speed',   value: 14, duration: 2, description: '+14 speed for 2 turns.' } },
  { name: 'Sharpeye Tincture',      slot: 'consumable', rarity: 'epic',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'potion', consumableEffect: { type: 'buff_crit',    value: 15, duration: 3, description: '+15% crit for 3 turns.' } },

  // --- elixirs (stronger / permanent) ---
  { name: 'Bloodmoss Paste',        slot: 'consumable', rarity: 'rare',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'elixir', consumableEffect: { type: 'buff_attack',  value: 8, duration: 0, description: '+8 attack permanently this battle.' } },
  { name: 'Champion\'s Blessing',   slot: 'consumable', rarity: 'rare',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'elixir', consumableEffect: { type: 'buff_all',     value: 15, duration: 1, description: '+15 to all stats for 1 turn.' } },
  { name: 'Voidheart Elixir',       slot: 'consumable', rarity: 'epic',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'elixir', consumableEffect: { type: 'heal',         value: 50, duration: 0, description: 'Restore 50 HP and remove one debuff.' } },

  // --- utility (debuffs / damage) ---
  { name: 'Blinding Powder',        slot: 'consumable', rarity: 'common',   stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'utility', consumableEffect: { type: 'debuff', debuffType: 'blind',  value: 0,  duration: 1, description: 'Enemy misses next attack.' } },
  { name: 'Voidfire Flask',         slot: 'consumable', rarity: 'uncommon', stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'utility', consumableEffect: { type: 'damage', value: 35, duration: 0, description: '35 magic damage, bypasses defense.' } },
  { name: 'Ashroot Dust',           slot: 'consumable', rarity: 'rare',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'utility', consumableEffect: { type: 'debuff', debuffType: 'weaken', value: 10, duration: 2, description: 'Enemy loses 10 attack for 2 turns.' } },
  { name: 'Hexbolt Vial',           slot: 'consumable', rarity: 'epic',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'utility', consumableEffect: { type: 'damage', value: 60, duration: 0, description: '60 magic damage, bypasses defense.' } },
];

module.exports = { ITEMS };
