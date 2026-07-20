'use strict';

const { ITEMS } = require('./clanWarsItems');

// ============================================================
// RARITY & SLOT WEIGHTS
// ============================================================

const RARITY_WEIGHTS = {
  initiate: { common: 70, uncommon: 25, rare: 4,  epic: 1  },
  adept:    { common: 30, uncommon: 45, rare: 20, epic: 5  },
  master:   { common: 5,  uncommon: 20, rare: 50, epic: 25 },
};

const SKILLER_SLOT_WEIGHTS = {
  consumable: 50,
  ring:       14,
  amulet:     14,
  cape:       14,
  shield:     8,
};

// ============================================================
// CORE RNG HELPERS
// ============================================================

function weightedRandom(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

function rollRarity(difficulty) {
  if (!RARITY_WEIGHTS[difficulty]) throw new Error(`Unknown difficulty: ${difficulty}`);
  return weightedRandom(RARITY_WEIGHTS[difficulty]);
}

function rollItem(slot, rarity) {
  const pool = ITEMS.filter((i) => i.slot === slot && i.rarity === rarity);
  if (pool.length === 0) {
    const rarityOrder = ['common', 'uncommon', 'rare', 'epic'];
    for (let i = rarityOrder.indexOf(rarity) - 1; i >= 0; i--) {
      const fallback = ITEMS.filter((item) => item.slot === slot && item.rarity === rarityOrder[i]);
      if (fallback.length > 0) return fallback[Math.floor(Math.random() * fallback.length)];
    }
    throw new Error(`No items found for slot: ${slot}`);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Rerolls until unique, walks up rarity tier if current tier is exhausted.
 *  If all items in the slot are owned, allows a duplicate (trinkets expect this). */
function rollUniqueItem(slot, rarity, warChest, maxAttempts = 10) {
  const ownedNames = new Set(warChest.map((i) => i.name));
  const rarityOrder = ['common', 'uncommon', 'rare', 'epic'];
  let idx = rarityOrder.indexOf(rarity);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (idx >= rarityOrder.length) break; // exhausted all tiers — fall through to dupe
    const pool = ITEMS.filter(
      (i) => i.slot === slot && i.rarity === rarityOrder[idx] && !ownedNames.has(i.name)
    );
    if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
    idx++; // tier exhausted — walk up
  }

  // All unique items in this slot are owned — allow a duplicate
  const dupePool = ITEMS.filter((i) => i.slot === slot);
  if (dupePool.length === 0) return null;
  return dupePool[Math.floor(Math.random() * dupePool.length)];
}

// ============================================================
// DROP PIPELINES
// ============================================================

const MISC_PVMER_SLOTS = ['gloves', 'boots', 'trinket'];

/** PvMer drop: admin picks the slot, system rolls rarity + item.
 *  slot='misc' randomly resolves to gloves, boots, or trinket. */
function rollPvmerDrop({ slot, difficulty, warChest }) {
  const resolvedSlot =
    slot === 'misc'
      ? MISC_PVMER_SLOTS[Math.floor(Math.random() * MISC_PVMER_SLOTS.length)]
      : slot;
  const rarity = rollRarity(difficulty);
  const item = rollUniqueItem(resolvedSlot, rarity, warChest);
  if (!item) return { success: false, reason: `No items found for slot: ${resolvedSlot}` };
  return { success: true, item, slot: resolvedSlot, rarity };
}

/** Skiller drop: fully automatic — system picks slot and rolls item. */
function rollSkillerDrop({ difficulty, warChest }) {
  const slot = weightedRandom(SKILLER_SLOT_WEIGHTS);
  const rarity = rollRarity(difficulty);
  const item = rollUniqueItem(slot, rarity, warChest);
  if (!item) return { success: false, reason: `No items found for slot: ${slot}` };
  return { success: true, item, slot, rarity };
}

// ============================================================
// BATTLE DAMAGE
// ============================================================

function rollDamage({ attackStat, defenseStat, critChance, isDefending = false }) {
  const base = Math.max(1, attackStat - defenseStat * 0.3);
  const variance = 0.85 + Math.random() * 0.3;
  const defMult = isDefending ? 0.4 : 1;
  const isCrit = Math.random() * 100 < Math.min(critChance, 75);
  const damage = Math.round(base * variance * defMult * (isCrit ? 1.5 : 1));
  return { damage: Math.max(1, damage), isCrit };
}

// ============================================================
// SPECIAL ABILITIES
// ============================================================

/**
 * processSpecial(specialId, actorSnap, defSnap, state, actorSide, defSide)
 *
 * Returns {
 *   damage: number,
 *   isCrit: boolean,
 *   attackerHeal: number,
 *   attackerEffects: [],   // effects added to attacker
 *   defenderEffects: [],   // effects added to defender
 *   narrative: string,
 * }
 */
function processSpecial(specialId, actorSnap, defSnap, state, actorSide, defSide) {
  const atk = actorSnap.stats.attack;
  const def = defSnap.stats.defense;
  const crit = actorSnap.stats.crit;
  const actorName = actorSnap.teamName;

  switch (specialId) {
    case 'cleave': {
      const roll = rollDamage({ attackStat: atk * 0.8, defenseStat: def, critChance: crit, isDefending: state.defendActive[defSide] });
      return {
        damage: roll.damage,
        isCrit: roll.isCrit,
        attackerHeal: 0,
        attackerEffects: [],
        defenderEffects: [{ type: 'bleed', value: 5, turns: 3 }],
        narrative: `⚡ ${actorName} uses CLEAVE! ${roll.damage} damage + bleed (5/turn, 3 turns)!`,
      };
    }

    case 'ambush': {
      // Ignore defense, guaranteed crit → 1.5× base damage
      const base = Math.max(1, atk);
      const variance = 0.85 + Math.random() * 0.3;
      const damage = Math.round(base * variance * 1.5);
      return {
        damage: Math.max(1, damage),
        isCrit: true,
        attackerHeal: 0,
        attackerEffects: [],
        defenderEffects: [],
        narrative: `💥 ${actorName} uses AMBUSH! ${damage} guaranteed critical damage (defense ignored)!`,
      };
    }

    case 'barrage': {
      const roll1 = rollDamage({ attackStat: atk * 0.65, defenseStat: def, critChance: crit, isDefending: state.defendActive[defSide] });
      const roll2 = rollDamage({ attackStat: atk * 0.65, defenseStat: def, critChance: crit, isDefending: state.defendActive[defSide] });
      const total = roll1.damage + roll2.damage;
      return {
        damage: total,
        isCrit: roll1.isCrit || roll2.isCrit,
        attackerHeal: 0,
        attackerEffects: [],
        defenderEffects: [],
        narrative: `⚡ ${actorName} uses BARRAGE! Two hits: ${roll1.damage} + ${roll2.damage} = ${total} total damage!`,
      };
    }

    case 'chain_lightning': {
      // 120% of attack stat, bypasses defense entirely
      const base = atk * 1.2;
      const variance = 0.85 + Math.random() * 0.3;
      const damage = Math.max(1, Math.round(base * variance));
      return {
        damage,
        isCrit: false,
        attackerHeal: 0,
        attackerEffects: [],
        defenderEffects: [],
        narrative: `⚡ ${actorName} unleashes CHAIN LIGHTNING! ${damage} unblockable magic damage!`,
      };
    }

    case 'fortress': {
      return {
        damage: 0,
        isCrit: false,
        attackerHeal: 0,
        attackerEffects: [{ type: 'fortress', turns: 2 }],
        defenderEffects: [],
        narrative: `🛡️ ${actorName} activates FORTRESS! All incoming damage reduced by 60% for 2 turns.`,
      };
    }

    case 'lifesteal': {
      const roll = rollDamage({ attackStat: atk, defenseStat: def, critChance: crit, isDefending: state.defendActive[defSide] });
      const heal = Math.round(roll.damage * 0.3);
      return {
        damage: roll.damage,
        isCrit: roll.isCrit,
        attackerHeal: heal,
        attackerEffects: [],
        defenderEffects: [],
        narrative: `🩸 ${actorName} uses LIFESTEAL! ${roll.damage} damage, healed ${heal} HP!`,
      };
    }

    default:
      throw new Error(`Unknown special ability: ${specialId}`);
  }
}

// ============================================================
// CHAMPION STAT BUILDER
// ============================================================

const CHAMPION_BASE_HP = 150;

/**
 * buildChampionStats(loadout, items)
 *
 * loadout shape: { weapon: itemId, helm: itemId, ..., consumables: [itemId, ...] }
 * items: array of ClanWarsItem JSON objects
 *
 * Returns { attack, defense, speed, crit, hp, maxHp, specials: [specialId, ...] }
 */
function buildChampionStats(loadout, items) {
  if (!loadout) {
    return { attack: 10, defense: 10, speed: 10, crit: 5, hp: CHAMPION_BASE_HP, maxHp: CHAMPION_BASE_HP, specials: [] };
  }

  const GEAR_SLOTS = ['weapon', 'helm', 'chest', 'legs', 'gloves', 'boots', 'shield', 'ring', 'amulet', 'cape', 'trinket'];
  const itemsById = Object.fromEntries(items.map((i) => [i.itemId, i]));

  const stats = { attack: 8, defense: 0, speed: 0, crit: 0, hp: CHAMPION_BASE_HP };
  const specials = [];

  for (const slot of GEAR_SLOTS) {
    const itemId = loadout[slot];
    if (!itemId) continue;
    const item = itemsById[itemId];
    if (!item?.itemSnapshot?.stats) continue;

    const s = item.itemSnapshot.stats;
    stats.attack  += s.attack  ?? 0;
    stats.defense += s.defense ?? 0;
    stats.speed   += s.speed   ?? 0;
    stats.crit    += s.crit    ?? 0;
    stats.hp      += s.hp      ?? 0;

    if (item.itemSnapshot.special?.id) {
      specials.push(item.itemSnapshot.special.id);
    }
  }

  // Move the captain's chosen special to front so it fires first
  if (loadout.chosenSpecial) {
    const idx = specials.indexOf(loadout.chosenSpecial);
    if (idx > 0) specials.unshift(...specials.splice(idx, 1));
  }

  return { ...stats, maxHp: stats.hp, specials };
}

module.exports = {
  RARITY_WEIGHTS,
  SKILLER_SLOT_WEIGHTS,
  weightedRandom,
  rollRarity,
  rollItem,
  rollUniqueItem,
  rollPvmerDrop,
  rollSkillerDrop,
  rollDamage,
  processSpecial,
  buildChampionStats,
};
