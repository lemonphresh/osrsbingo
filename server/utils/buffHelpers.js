const { v4: uuidv4 } = require('uuid');

const OBJECTIVE_TYPES = {
  boss_kc: 'Boss Kill Count',
  xp_gain: 'XP Gain',
  minigame: 'Mini Game',
  item_collection: 'Item Collection',
  clue_scrolls: 'Clue Scrolls',
};

const BUFF_CONFIGS = {
  kill_reduction_minor: {
    name: "Slayer's Edge",
    description: 'Reduces kill count by 25% on one kill objective',
    reduction: 0.25,
    objectiveTypes: ['boss_kc'],
    icon: '⚔️',
  },
  kill_reduction_moderate: {
    name: "Slayer's Focus",
    description: 'Reduces kill count by 50% on one kill objective',
    reduction: 0.5,
    objectiveTypes: ['boss_kc'],
    icon: '⚔️',
  },
  kill_reduction_major: {
    name: "Slayer's Mastery",
    description: 'Reduces kill count by 75% on one kill objective',
    reduction: 0.75,
    objectiveTypes: ['boss_kc'],
    icon: '⚔️',
  },
  xp_reduction_minor: {
    name: 'Training Efficiency',
    description: 'Reduces XP requirement by 25% on one skill objective',
    reduction: 0.25,
    objectiveTypes: ['xp_gain'],
    icon: '📚',
  },
  xp_reduction_moderate: {
    name: 'Training Momentum',
    description: 'Reduces XP requirement by 50% on one skill objective',
    reduction: 0.5,
    objectiveTypes: ['xp_gain'],
    icon: '📚',
  },
  xp_reduction_major: {
    name: 'Training Enlightenment',
    description: 'Reduces XP requirement by 75% on one skill objective',
    reduction: 0.75,
    objectiveTypes: ['xp_gain'],
    icon: '📚',
  },
  item_reduction_minor: {
    name: 'Efficient Gathering',
    description: 'Reduces item collection by 25% on one collection objective',
    reduction: 0.25,
    objectiveTypes: ['item_collection'],
    icon: '📦',
  },

  universal_reduction: {
    name: 'Versatile Training',
    description: 'Reduces any objective by 50% (your choice)',
    reduction: 0.5,
    objectiveTypes: ['xp_gain', 'item_collection', 'boss_kc', 'minigame', 'clue_scrolls'],
    icon: '✨',
  },
  multi_use_minor: {
    name: 'Persistent Focus',
    description: 'Reduces two objectives by 25% each',
    reduction: 0.25,
    objectiveTypes: ['xp_gain', 'item_collection', 'boss_kc'],
    usesRemaining: 2,
    icon: '🔄',
  },
};

function createBuff(buffType, customConfig = {}) {
  const config = BUFF_CONFIGS[buffType];
  if (!config) throw new Error(`Unknown buff type: ${buffType}`);

  return {
    buffId: `buff_${uuidv4().substring(0, 8)}`,
    buffType,
    buffName: config.name,
    description: config.description,
    reduction: config.reduction,
    objectiveTypes: config.objectiveTypes,
    usesRemaining: config.usesRemaining || 1,
    icon: config.icon,
    acquiredAt: new Date().toISOString(),
    ...customConfig,
  };
}

function canApplyBuff(buff, objective) {
  if (!buff || buff.usesRemaining <= 0) return false;
  if (!objective || !objective.type) return false;
  if (!buff.objectiveTypes.includes(objective.type)) return false;

  // item_collection buffs only apply if quantity > 2
  if (objective.type === 'item_collection' && objective.quantity <= 2) return false;

  return true;
}

function applyBuffToObjective(objective, buff) {
  if (!canApplyBuff(buff, objective)) {
    throw new Error(
      `Buff ${buff.buffName} cannot be applied to ${OBJECTIVE_TYPES[objective.type]} objectives`
    );
  }

  const originalQuantity = objective.quantity;
  const reducedQuantity = Math.ceil(originalQuantity * (1 - buff.reduction));

  return {
    ...objective,
    quantity: reducedQuantity,
    originalQuantity,
    appliedBuff: {
      buffId: buff.buffId,
      buffName: buff.buffName,
      reduction: buff.reduction,
      savedAmount: originalQuantity - reducedQuantity,
    },
  };
}

module.exports = {
  BUFF_CONFIGS,
  createBuff,
  canApplyBuff,
  applyBuffToObjective,
};
