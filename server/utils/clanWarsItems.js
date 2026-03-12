'use strict';

/**
 * Champion Forge — Handcrafted Item Set (~50 items)
 * General fantasy RPG naming. No third-party IP.
 *
 * Rarity colours (for UI): common=grey, uncommon=green, rare=blue, epic=purple
 * Stats: attack, defense, speed, crit (%), hp (flat)
 * Specials (rare/epic only): cleave, ambush, barrage, chain_lightning, fortress, lifesteal
 * Consumable types: food, potion, elixir, utility
 *
 * inventoryIcon: filename in client/src/assets/champion-forge/sprites/icons/<inventoryIcon>.png
 *   Small icon shown in equipment slots and inventory panels.
 *
 * spriteIcon: filename in client/src/assets/champion-forge/sprites/layers/<spriteIcon>.png
 *   48×64 body layer PNG (transparent except where item appears on character).
 *   null for rings, amulets, and consumables — these have no body layer.
 *   Layer draw order: boots → legs → chest → gloves → cape → shield → helm → weapon
 *
 * Naming convention: {slot}_{snake_case_name}
 */

const ITEMS = [
  // ============================================================
  // WEAPONS (pvmer)
  // ============================================================

  // --- common ---
  { name: 'Rusted Shortsword',      inventoryIcon: 'weapon_rusted_shortsword',      spriteIcon: 'weapon_rusted_shortsword',      slot: 'weapon', rarity: 'common',   stats: { attack: 10, defense: 0, speed: 7,  crit: 3,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Ironwood Shortbow',      inventoryIcon: 'weapon_ironwood_shortbow',      spriteIcon: 'weapon_ironwood_shortbow',      slot: 'weapon', rarity: 'common',   stats: { attack: 12, defense: 0, speed: 9,  crit: 4,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Battered Mace',          inventoryIcon: 'weapon_battered_mace',          spriteIcon: 'weapon_battered_mace',          slot: 'weapon', rarity: 'common',   stats: { attack: 14, defense: 0, speed: 5,  crit: 2,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Apprentice\'s Staff',    inventoryIcon: 'weapon_apprentices_staff',      spriteIcon: 'weapon_apprentices_staff',      slot: 'weapon', rarity: 'common',   stats: { attack: 11, defense: 0, speed: 6,  crit: 3,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Thornwood Spear',        inventoryIcon: 'weapon_thornwood_spear',        spriteIcon: 'weapon_thornwood_spear',        slot: 'weapon', rarity: 'uncommon', stats: { attack: 22, defense: 0, speed: 10, crit: 6,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Grimfang Dagger',        inventoryIcon: 'weapon_grimfang_dagger',        spriteIcon: 'weapon_grimfang_dagger',        slot: 'weapon', rarity: 'uncommon', stats: { attack: 18, defense: 0, speed: 15, crit: 10, hp: 0  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Emberstrike Wand',       inventoryIcon: 'weapon_emberstrike_wand',       spriteIcon: 'weapon_emberstrike_wand',       slot: 'weapon', rarity: 'uncommon', stats: { attack: 25, defense: 0, speed: 9,  crit: 7,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Stonehide Axe',          inventoryIcon: 'weapon_stonehide_axe',          spriteIcon: 'weapon_stonehide_axe',          slot: 'weapon', rarity: 'uncommon', stats: { attack: 28, defense: 0, speed: 7,  crit: 5,  hp: 0  }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Axe of the Fallen King', inventoryIcon: 'weapon_axe_fallen_king',        spriteIcon: 'weapon_axe_fallen_king',        slot: 'weapon', rarity: 'rare',    stats: { attack: 38, defense: 0, speed: 12, crit: 12, hp: 0  }, special: { id: 'cleave',          label: 'Cleave',          description: '80% damage + bleed (5/turn, 3 turns)' },       consumableType: null, consumableEffect: null },
  { name: 'Void-touched Wand',      inventoryIcon: 'weapon_void_touched_wand',      spriteIcon: 'weapon_void_touched_wand',      slot: 'weapon', rarity: 'rare',    stats: { attack: 35, defense: 0, speed: 16, crit: 15, hp: 0  }, special: { id: 'ambush',          label: 'Ambush',          description: 'Ignore defense, guaranteed crit' },              consumableType: null, consumableEffect: null },
  { name: 'Shadowstep Dagger',      inventoryIcon: 'weapon_shadowstep_dagger',      spriteIcon: 'weapon_shadowstep_dagger',      slot: 'weapon', rarity: 'rare',    stats: { attack: 30, defense: 0, speed: 22, crit: 18, hp: 0  }, special: { id: 'barrage',         label: 'Barrage',         description: 'Attack twice at 65% power' },                    consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Dreadmarrow Staff',      inventoryIcon: 'weapon_dreadmarrow_staff',      spriteIcon: 'weapon_dreadmarrow_staff',      slot: 'weapon', rarity: 'epic',    stats: { attack: 58, defense: 0, speed: 20, crit: 20, hp: 0  }, special: { id: 'chain_lightning', label: 'Chain Lightning', description: '120% magic damage, bypasses defense' },          consumableType: null, consumableEffect: null },
  { name: 'Soulrender Blade',       inventoryIcon: 'weapon_soulrender_blade',       spriteIcon: 'weapon_soulrender_blade',       slot: 'weapon', rarity: 'epic',    stats: { attack: 65, defense: 0, speed: 18, crit: 22, hp: 0  }, special: { id: 'lifesteal',       label: 'Lifesteal',       description: 'Heal 30% of damage dealt this turn' },           consumableType: null, consumableEffect: null },

  // ============================================================
  // HELMS (pvmer)
  // ============================================================

  // --- common ---
  { name: 'Copper Skullcap',        inventoryIcon: 'helm_copper_skullcap',          spriteIcon: 'helm_copper_skullcap',          slot: 'helm', rarity: 'common',   stats: { attack: 0, defense: 10, speed: 5,  crit: 0, hp: 10 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Leather Coif',           inventoryIcon: 'helm_leather_coif',             spriteIcon: 'helm_leather_coif',             slot: 'helm', rarity: 'common',   stats: { attack: 0, defense: 8,  speed: 7,  crit: 2, hp: 8  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Dented Iron Helm',       inventoryIcon: 'helm_dented_iron',              spriteIcon: 'helm_dented_iron',              slot: 'helm', rarity: 'common',   stats: { attack: 0, defense: 14, speed: 4,  crit: 0, hp: 12 }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Bonecrest Visor',        inventoryIcon: 'helm_bonecrest_visor',          spriteIcon: 'helm_bonecrest_visor',          slot: 'helm', rarity: 'uncommon', stats: { attack: 0, defense: 22, speed: 8,  crit: 4, hp: 20 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Serpentscale Faceguard', inventoryIcon: 'helm_serpentscale_faceguard',   spriteIcon: 'helm_serpentscale_faceguard',   slot: 'helm', rarity: 'uncommon', stats: { attack: 0, defense: 26, speed: 10, crit: 5, hp: 18 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Iron War Mask',          inventoryIcon: 'helm_iron_war_mask',            spriteIcon: 'helm_iron_war_mask',            slot: 'helm', rarity: 'uncommon', stats: { attack: 0, defense: 28, speed: 7,  crit: 3, hp: 22 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Helm of the Forsaken',   inventoryIcon: 'helm_forsaken',                 spriteIcon: 'helm_forsaken',                 slot: 'helm', rarity: 'rare',    stats: { attack: 5, defense: 38, speed: 12, crit: 8,  hp: 35 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' }, consumableType: null, consumableEffect: null },
  { name: 'Hexplate War Crown',     inventoryIcon: 'helm_hexplate_war_crown',       spriteIcon: 'helm_hexplate_war_crown',       slot: 'helm', rarity: 'rare',    stats: { attack: 8, defense: 35, speed: 14, crit: 10, hp: 30 }, special: { id: 'ambush',   label: 'Ambush',   description: 'Ignore defense, guaranteed crit' },        consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Dreadhelm of the Abyss', inventoryIcon: 'helm_dreadhelm_abyss',          spriteIcon: 'helm_dreadhelm_abyss',          slot: 'helm', rarity: 'epic',   stats: { attack: 10, defense: 55, speed: 18, crit: 15, hp: 60 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // CHEST (pvmer)
  // ============================================================

  // --- common ---
  { name: 'Tattered Ringmail',      inventoryIcon: 'chest_tattered_ringmail',       spriteIcon: 'chest_tattered_ringmail',       slot: 'chest', rarity: 'common',   stats: { attack: 0, defense: 12, speed: 4,  crit: 0, hp: 15 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Padded Gambeson',        inventoryIcon: 'chest_padded_gambeson',         spriteIcon: 'chest_padded_gambeson',         slot: 'chest', rarity: 'common',   stats: { attack: 0, defense: 10, speed: 6,  crit: 0, hp: 12 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Cracked Plate Vest',     inventoryIcon: 'chest_cracked_plate',           spriteIcon: 'chest_cracked_plate',           slot: 'chest', rarity: 'common',   stats: { attack: 0, defense: 15, speed: 3,  crit: 0, hp: 18 }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Serpentscale Hauberk',   inventoryIcon: 'chest_serpentscale_hauberk',    spriteIcon: 'chest_serpentscale_hauberk',    slot: 'chest', rarity: 'uncommon', stats: { attack: 0, defense: 26, speed: 8,  crit: 3, hp: 28 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Hexplate Brigandine',    inventoryIcon: 'chest_hexplate_brigandine',     spriteIcon: 'chest_hexplate_brigandine',     slot: 'chest', rarity: 'uncommon', stats: { attack: 0, defense: 28, speed: 7,  crit: 4, hp: 30 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Gloomweave Tunic',       inventoryIcon: 'chest_gloomweave_tunic',        spriteIcon: 'chest_gloomweave_tunic',        slot: 'chest', rarity: 'uncommon', stats: { attack: 0, defense: 24, speed: 10, crit: 5, hp: 25 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Void Warplate',          inventoryIcon: 'chest_void_warplate',           spriteIcon: 'chest_void_warplate',           slot: 'chest', rarity: 'rare',    stats: { attack: 5, defense: 40, speed: 12, crit: 8,  hp: 45 }, special: { id: 'lifesteal', label: 'Lifesteal', description: 'Heal 30% of damage dealt this turn' }, consumableType: null, consumableEffect: null },
  { name: 'Stormforged Chestplate', inventoryIcon: 'chest_stormforged',             spriteIcon: 'chest_stormforged',             slot: 'chest', rarity: 'rare',    stats: { attack: 8, defense: 38, speed: 14, crit: 10, hp: 40 }, special: { id: 'barrage',   label: 'Barrage',   description: 'Attack twice at 65% power' },          consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Abyssal Warplate',       inventoryIcon: 'chest_abyssal_warplate',        spriteIcon: 'chest_abyssal_warplate',        slot: 'chest', rarity: 'epic',    stats: { attack: 12, defense: 58, speed: 16, crit: 14, hp: 75 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // LEGS (pvmer)
  // ============================================================

  // --- common ---
  { name: 'Worn Leather Leggings',  inventoryIcon: 'legs_worn_leather',             spriteIcon: 'legs_worn_leather',             slot: 'legs', rarity: 'common',   stats: { attack: 0, defense: 8,  speed: 6,  crit: 0, hp: 10 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Chain Chausses',         inventoryIcon: 'legs_chain_chausses',           spriteIcon: 'legs_chain_chausses',           slot: 'legs', rarity: 'common',   stats: { attack: 0, defense: 12, speed: 4,  crit: 0, hp: 14 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Patched Battle Skirt',   inventoryIcon: 'legs_patched_battle_skirt',     spriteIcon: 'legs_patched_battle_skirt',     slot: 'legs', rarity: 'common',   stats: { attack: 0, defense: 10, speed: 5,  crit: 1, hp: 12 }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Ironhide Greaves',       inventoryIcon: 'legs_ironhide_greaves',         spriteIcon: 'legs_ironhide_greaves',         slot: 'legs', rarity: 'uncommon', stats: { attack: 0, defense: 24, speed: 8,  crit: 3, hp: 25 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Bonescale Tassets',      inventoryIcon: 'legs_bonescale_tassets',        spriteIcon: 'legs_bonescale_tassets',        slot: 'legs', rarity: 'uncommon', stats: { attack: 0, defense: 26, speed: 7,  crit: 4, hp: 28 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Ashwalker Trousers',     inventoryIcon: 'legs_ashwalker_trousers',       spriteIcon: 'legs_ashwalker_trousers',       slot: 'legs', rarity: 'uncommon', stats: { attack: 0, defense: 22, speed: 10, crit: 5, hp: 22 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Gravewarden Tassets',    inventoryIcon: 'legs_gravewarden_tassets',      spriteIcon: 'legs_gravewarden_tassets',      slot: 'legs', rarity: 'rare',    stats: { attack: 5, defense: 36, speed: 12, crit: 8,  hp: 40 }, special: { id: 'cleave',  label: 'Cleave',  description: '80% damage + bleed (5/turn, 3 turns)' }, consumableType: null, consumableEffect: null },
  { name: 'Voidstep Legguards',     inventoryIcon: 'legs_voidstep_legguards',       spriteIcon: 'legs_voidstep_legguards',       slot: 'legs', rarity: 'rare',    stats: { attack: 6, defense: 34, speed: 16, crit: 10, hp: 35 }, special: { id: 'ambush', label: 'Ambush',  description: 'Ignore defense, guaranteed crit' },        consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Dreadknight Legplates',  inventoryIcon: 'legs_dreadknight_legplates',    spriteIcon: 'legs_dreadknight_legplates',    slot: 'legs', rarity: 'epic',    stats: { attack: 10, defense: 52, speed: 18, crit: 14, hp: 65 }, special: { id: 'chain_lightning', label: 'Chain Lightning', description: '120% magic damage, bypasses defense' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // GLOVES (pvmer)
  // ============================================================

  // --- common ---
  { name: 'Cloth Wraps',            inventoryIcon: 'gloves_cloth_wraps',            spriteIcon: 'gloves_cloth_wraps',            slot: 'gloves', rarity: 'common',   stats: { attack: 4,  defense: 5,  speed: 5,  crit: 2,  hp: 5  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Worn Leather Bracers',   inventoryIcon: 'gloves_worn_leather_bracers',   spriteIcon: 'gloves_worn_leather_bracers',   slot: 'gloves', rarity: 'common',   stats: { attack: 5,  defense: 6,  speed: 4,  crit: 3,  hp: 6  }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Steelstitch Gauntlets',  inventoryIcon: 'gloves_steelstitch_gauntlets',  spriteIcon: 'gloves_steelstitch_gauntlets',  slot: 'gloves', rarity: 'uncommon', stats: { attack: 10, defense: 14, speed: 8,  crit: 6,  hp: 15 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Grizzly Paw Gloves',     inventoryIcon: 'gloves_grizzly_paw',            spriteIcon: 'gloves_grizzly_paw',            slot: 'gloves', rarity: 'uncommon', stats: { attack: 12, defense: 12, speed: 9,  crit: 8,  hp: 12 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Riftweave Handguards',   inventoryIcon: 'gloves_riftweave_handguards',   spriteIcon: 'gloves_riftweave_handguards',   slot: 'gloves', rarity: 'rare',    stats: { attack: 20, defense: 22, speed: 14, crit: 14, hp: 25 }, special: { id: 'barrage',   label: 'Barrage',   description: 'Attack twice at 65% power' },          consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Gauntlets of the Undying', inventoryIcon: 'gloves_gauntlets_undying',    spriteIcon: 'gloves_gauntlets_undying',      slot: 'gloves', rarity: 'epic',    stats: { attack: 30, defense: 35, speed: 20, crit: 20, hp: 40 }, special: { id: 'lifesteal', label: 'Lifesteal', description: 'Heal 30% of damage dealt this turn' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // BOOTS (pvmer)
  // ============================================================

  // --- common ---
  { name: 'Tattered Sandals',       inventoryIcon: 'boots_tattered_sandals',        spriteIcon: 'boots_tattered_sandals',        slot: 'boots', rarity: 'common',   stats: { attack: 0, defense: 4,  speed: 8,  crit: 1,  hp: 5  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Worn Iron Greaves',      inventoryIcon: 'boots_worn_iron_greaves',       spriteIcon: 'boots_worn_iron_greaves',       slot: 'boots', rarity: 'common',   stats: { attack: 0, defense: 8,  speed: 5,  crit: 0,  hp: 8  }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Quickfoot Wraps',        inventoryIcon: 'boots_quickfoot_wraps',         spriteIcon: 'boots_quickfoot_wraps',         slot: 'boots', rarity: 'uncommon', stats: { attack: 0, defense: 12, speed: 16, crit: 5,  hp: 12 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Ironhide Sabatons',      inventoryIcon: 'boots_ironhide_sabatons',       spriteIcon: 'boots_ironhide_sabatons',       slot: 'boots', rarity: 'uncommon', stats: { attack: 0, defense: 18, speed: 10, crit: 3,  hp: 18 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Shadowstriders',         inventoryIcon: 'boots_shadowstriders',          spriteIcon: 'boots_shadowstriders',          slot: 'boots', rarity: 'rare',    stats: { attack: 5, defense: 20, speed: 22, crit: 12, hp: 25 }, special: { id: 'ambush',  label: 'Ambush',  description: 'Ignore defense, guaranteed crit' }, consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Boots of the Rift',      inventoryIcon: 'boots_of_the_rift',             spriteIcon: 'boots_of_the_rift',             slot: 'boots', rarity: 'epic',    stats: { attack: 8, defense: 30, speed: 30, crit: 18, hp: 40 }, special: { id: 'barrage', label: 'Barrage', description: 'Attack twice at 65% power' },  consumableType: null, consumableEffect: null },

  // ============================================================
  // SHIELDS (skiller)
  // ============================================================

  // --- common ---
  { name: 'Rotwood Buckler',        inventoryIcon: 'shield_rotwood_buckler',        spriteIcon: 'shield_rotwood_buckler',        slot: 'shield', rarity: 'common',   stats: { attack: 0, defense: 14, speed: 4, crit: 0, hp: 15 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Copper Heater Shield',   inventoryIcon: 'shield_copper_heater',          spriteIcon: 'shield_copper_heater',          slot: 'shield', rarity: 'common',   stats: { attack: 0, defense: 12, speed: 5, crit: 0, hp: 18 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Driftwood Targe',        inventoryIcon: 'shield_driftwood_targe',        spriteIcon: 'shield_driftwood_targe',        slot: 'shield', rarity: 'common',   stats: { attack: 0, defense: 10, speed: 6, crit: 1, hp: 12 }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Stoneward Kite Shield',  inventoryIcon: 'shield_stoneward_kite',         spriteIcon: 'shield_stoneward_kite',         slot: 'shield', rarity: 'uncommon', stats: { attack: 0, defense: 26, speed: 7, crit: 2, hp: 30 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Boneguard Defender',     inventoryIcon: 'shield_boneguard_defender',     spriteIcon: 'shield_boneguard_defender',     slot: 'shield', rarity: 'uncommon', stats: { attack: 0, defense: 28, speed: 6, crit: 3, hp: 32 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Ironbark Pavise',        inventoryIcon: 'shield_ironbark_pavise',        spriteIcon: 'shield_ironbark_pavise',        slot: 'shield', rarity: 'uncommon', stats: { attack: 0, defense: 24, speed: 8, crit: 4, hp: 28 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Runewall Aegis',         inventoryIcon: 'shield_runewall_aegis',         spriteIcon: 'shield_runewall_aegis',         slot: 'shield', rarity: 'rare',    stats: { attack: 0, defense: 42, speed: 10, crit: 6,  hp: 50 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' }, consumableType: null, consumableEffect: null },
  { name: 'Thornback Barrier',      inventoryIcon: 'shield_thornback_barrier',      spriteIcon: 'shield_thornback_barrier',      slot: 'shield', rarity: 'rare',    stats: { attack: 8, defense: 38, speed: 12, crit: 8,  hp: 45 }, special: { id: 'cleave',   label: 'Cleave',   description: '80% damage + bleed (5/turn, 3 turns)' }, consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Bulwark of the Last Age', inventoryIcon: 'shield_bulwark_last_age',      spriteIcon: 'shield_bulwark_last_age',       slot: 'shield', rarity: 'epic',    stats: { attack: 0, defense: 62, speed: 14, crit: 10, hp: 75 }, special: { id: 'fortress', label: 'Fortress', description: 'Reduce all damage by 60% for 2 turns' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // RINGS (skiller) — no body layer
  // ============================================================

  // --- common ---
  { name: 'Amber Band',             inventoryIcon: 'ring_amber_band',               spriteIcon: null, slot: 'ring', rarity: 'common',   stats: { attack: 3,  defense: 3,  speed: 4,  crit: 2,  hp: 5  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Pauper\'s Signet',       inventoryIcon: 'ring_paupers_signet',           spriteIcon: null, slot: 'ring', rarity: 'common',   stats: { attack: 2,  defense: 4,  speed: 3,  crit: 3,  hp: 8  }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Stoneward Ring',         inventoryIcon: 'ring_stoneward',                spriteIcon: null, slot: 'ring', rarity: 'uncommon', stats: { attack: 5,  defense: 12, speed: 6,  crit: 5,  hp: 18 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Ring of the Houndmaster', inventoryIcon: 'ring_houndmaster',             spriteIcon: null, slot: 'ring', rarity: 'uncommon', stats: { attack: 10, defense: 8,  speed: 10, crit: 8,  hp: 15 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Loop of the Undying',    inventoryIcon: 'ring_loop_undying',             spriteIcon: null, slot: 'ring', rarity: 'rare',    stats: { attack: 12, defense: 18, speed: 14, crit: 14, hp: 30 }, special: { id: 'lifesteal',       label: 'Lifesteal',       description: 'Heal 30% of damage dealt this turn' },          consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Rift-Eye Band',          inventoryIcon: 'ring_rift_eye',                 spriteIcon: null, slot: 'ring', rarity: 'epic',    stats: { attack: 20, defense: 28, speed: 22, crit: 22, hp: 50 }, special: { id: 'chain_lightning', label: 'Chain Lightning', description: '120% magic damage, bypasses defense' },          consumableType: null, consumableEffect: null },

  // ============================================================
  // AMULETS (skiller) — no body layer
  // ============================================================

  // --- common ---
  { name: 'Bone Charm',             inventoryIcon: 'amulet_bone_charm',             spriteIcon: null, slot: 'amulet', rarity: 'common',   stats: { attack: 2,  defense: 4,  speed: 3,  crit: 3,  hp: 8  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Trinket of the Mire',    inventoryIcon: 'amulet_trinket_mire',           spriteIcon: null, slot: 'amulet', rarity: 'common',   stats: { attack: 4,  defense: 2,  speed: 5,  crit: 2,  hp: 6  }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Pendant of the Deep',    inventoryIcon: 'amulet_pendant_deep',           spriteIcon: null, slot: 'amulet', rarity: 'uncommon', stats: { attack: 8,  defense: 10, speed: 8,  crit: 6,  hp: 20 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Embershard Torc',        inventoryIcon: 'amulet_embershard_torc',        spriteIcon: null, slot: 'amulet', rarity: 'uncommon', stats: { attack: 12, defense: 8,  speed: 10, crit: 8,  hp: 18 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Amulet of the Thornveil', inventoryIcon: 'amulet_thornveil',             spriteIcon: null, slot: 'amulet', rarity: 'rare',    stats: { attack: 15, defense: 20, speed: 14, crit: 12, hp: 35 }, special: { id: 'ambush', label: 'Ambush', description: 'Ignore defense, guaranteed crit' }, consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Collar of the Riftborn', inventoryIcon: 'amulet_collar_riftborn',        spriteIcon: null, slot: 'amulet', rarity: 'epic',    stats: { attack: 25, defense: 30, speed: 22, crit: 20, hp: 55 }, special: { id: 'cleave',  label: 'Cleave',  description: '80% damage + bleed (5/turn, 3 turns)' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // CAPES (skiller)
  // ============================================================

  // --- common ---
  { name: 'Tattered Wool Cloak',    inventoryIcon: 'cape_tattered_wool',            spriteIcon: 'cape_tattered_wool',            slot: 'cape', rarity: 'common',   stats: { attack: 2, defense: 5,  speed: 5,  crit: 2,  hp: 8  }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Dustwalker Mantle',      inventoryIcon: 'cape_dustwalker_mantle',        spriteIcon: 'cape_dustwalker_mantle',        slot: 'cape', rarity: 'common',   stats: { attack: 3, defense: 4,  speed: 6,  crit: 1,  hp: 6  }, special: null, consumableType: null, consumableEffect: null },

  // --- uncommon ---
  { name: 'Shadowweave Cape',       inventoryIcon: 'cape_shadowweave',              spriteIcon: 'cape_shadowweave',              slot: 'cape', rarity: 'uncommon', stats: { attack: 6, defense: 10, speed: 12, crit: 6,  hp: 16 }, special: null, consumableType: null, consumableEffect: null },
  { name: 'Ironback Shroud',        inventoryIcon: 'cape_ironback_shroud',          spriteIcon: 'cape_ironback_shroud',          slot: 'cape', rarity: 'uncommon', stats: { attack: 5, defense: 14, speed: 9,  crit: 5,  hp: 20 }, special: null, consumableType: null, consumableEffect: null },

  // --- rare ---
  { name: 'Voidweave Cloak',        inventoryIcon: 'cape_voidweave_cloak',          spriteIcon: 'cape_voidweave_cloak',          slot: 'cape', rarity: 'rare',    stats: { attack: 12, defense: 22, speed: 18, crit: 10, hp: 32 }, special: { id: 'barrage',   label: 'Barrage',   description: 'Attack twice at 65% power' },          consumableType: null, consumableEffect: null },

  // --- epic ---
  { name: 'Cape of the Undying Veil', inventoryIcon: 'cape_undying_veil',           spriteIcon: 'cape_undying_veil',             slot: 'cape', rarity: 'epic',    stats: { attack: 20, defense: 35, speed: 26, crit: 18, hp: 52 }, special: { id: 'lifesteal', label: 'Lifesteal', description: 'Heal 30% of damage dealt this turn' }, consumableType: null, consumableEffect: null },

  // ============================================================
  // CONSUMABLES (skiller) — no body layer
  // spriteIcon null; inventoryIcon used for inventory display only
  // ============================================================

  // --- food (heal) ---
  { name: 'Boar Rib',               inventoryIcon: 'consumable_boar_rib',           spriteIcon: null, slot: 'consumable', rarity: 'common',   stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'food',    consumableEffect: { type: 'heal',         value: 40,  duration: 0, description: 'Restore 40 HP.' } },
  { name: 'Hunter\'s Stew',         inventoryIcon: 'consumable_hunters_stew',       spriteIcon: null, slot: 'consumable', rarity: 'uncommon', stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'food',    consumableEffect: { type: 'heal',         value: 65,  duration: 0, description: 'Restore 65 HP.' } },
  { name: 'Hero\'s Feast',          inventoryIcon: 'consumable_heros_feast',        spriteIcon: null, slot: 'consumable', rarity: 'rare',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'food',    consumableEffect: { type: 'heal',         value: 90,  duration: 0, description: 'Restore 90 HP.' } },
  { name: 'Warlord\'s Banquet',     inventoryIcon: 'consumable_warlords_banquet',   spriteIcon: null, slot: 'consumable', rarity: 'epic',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'food',    consumableEffect: { type: 'heal',         value: 120, duration: 0, description: 'Restore 120 HP.' } },

  // --- potions (temp stat buffs) ---
  { name: 'Berserker Draught',      inventoryIcon: 'consumable_berserker_draught',  spriteIcon: null, slot: 'consumable', rarity: 'common',   stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'potion',  consumableEffect: { type: 'buff_attack',  value: 12, duration: 2, description: '+12 attack for 2 turns.' } },
  { name: 'Ironhide Salve',         inventoryIcon: 'consumable_ironhide_salve',     spriteIcon: null, slot: 'consumable', rarity: 'uncommon', stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'potion',  consumableEffect: { type: 'buff_defense', value: 18, duration: 2, description: '+18 defense for 2 turns.' } },
  { name: 'Quickfoot Elixir',       inventoryIcon: 'consumable_quickfoot_elixir',   spriteIcon: null, slot: 'consumable', rarity: 'rare',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'potion',  consumableEffect: { type: 'buff_speed',   value: 14, duration: 2, description: '+14 speed for 2 turns.' } },
  { name: 'Sharpeye Tincture',      inventoryIcon: 'consumable_sharpeye_tincture',  spriteIcon: null, slot: 'consumable', rarity: 'epic',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'potion',  consumableEffect: { type: 'buff_crit',    value: 15, duration: 3, description: '+15% crit for 3 turns.' } },

  // --- elixirs (stronger / permanent) ---
  { name: 'Bloodmoss Paste',        inventoryIcon: 'consumable_bloodmoss_paste',    spriteIcon: null, slot: 'consumable', rarity: 'rare',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'elixir',  consumableEffect: { type: 'buff_attack',  value: 8,  duration: 0, description: '+8 attack permanently this battle.' } },
  { name: 'Champion\'s Blessing',   inventoryIcon: 'consumable_champions_blessing', spriteIcon: null, slot: 'consumable', rarity: 'rare',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'elixir',  consumableEffect: { type: 'buff_all',     value: 15, duration: 1, description: '+15 to all stats for 1 turn.' } },
  { name: 'Voidheart Elixir',       inventoryIcon: 'consumable_voidheart_elixir',   spriteIcon: null, slot: 'consumable', rarity: 'epic',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'elixir',  consumableEffect: { type: 'heal',         value: 50, duration: 0, description: 'Restore 50 HP and remove one debuff.' } },

  // --- utility (debuffs / damage) ---
  { name: 'Blinding Powder',        inventoryIcon: 'consumable_blinding_powder',    spriteIcon: null, slot: 'consumable', rarity: 'common',   stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'utility', consumableEffect: { type: 'debuff', debuffType: 'blind',  value: 0,  duration: 1, description: 'Enemy misses next attack.' } },
  { name: 'Voidfire Flask',         inventoryIcon: 'consumable_voidfire_flask',     spriteIcon: null, slot: 'consumable', rarity: 'uncommon', stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'utility', consumableEffect: { type: 'damage', value: 35, duration: 0, description: '35 magic damage, bypasses defense.' } },
  { name: 'Ashroot Dust',           inventoryIcon: 'consumable_ashroot_dust',       spriteIcon: null, slot: 'consumable', rarity: 'rare',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'utility', consumableEffect: { type: 'debuff', debuffType: 'weaken', value: 10, duration: 2, description: 'Enemy loses 10 attack for 2 turns.' } },
  { name: 'Hexbolt Vial',           inventoryIcon: 'consumable_hexbolt_vial',       spriteIcon: null, slot: 'consumable', rarity: 'epic',     stats: { attack: 0, defense: 0, speed: 0, crit: 0, hp: 0 }, special: null, consumableType: 'utility', consumableEffect: { type: 'damage', value: 60, duration: 0, description: '60 magic damage, bypasses defense.' } },
];

module.exports = { ITEMS };
