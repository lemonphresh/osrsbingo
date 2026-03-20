'use strict';

/**
 * battleAnimations.js
 *
 * Maps battle log entries / action context → ActionEffect effect definitions.
 *
 * Each def: { effectKey: string, side: 'actor' | 'defender' | 'center' }
 *
 * `side` is semantic — callers resolve it to 'left'|'right'|'center' using resolveSide().
 */

/**
 * For BattleReplayModal + BattleScreen.
 * Parses a ClanWarsBattleEvent log entry and returns effect defs.
 */
export function getActionEffects(entry) {
  if (!entry) return [];
  const { action, isCrit, narrative = '', damageDealt } = entry;
  const n = narrative.toUpperCase();

  if (action === 'BATTLE_START' || action === 'BATTLE_END') return [];

  if (action === 'DEFEND')     return [{ effectKey: 'shield',                          side: 'actor'    }];
  if (action === 'BLEED_TICK') return [{ effectKey: 'bleed',                           side: 'defender' }];
  if (action === 'ATTACK')     return [{ effectKey: isCrit ? 'critSlash' : 'slash',    side: 'defender' }];

  if (action === 'SPECIAL') {
    if (n.includes('CLEAVE'))
      return [
        { effectKey: isCrit ? 'critSlash' : 'slash', side: 'defender' },
        { effectKey: 'bleed',                         side: 'defender' },
      ];
    if (n.includes('AMBUSH'))
      return [{ effectKey: 'critSlash',      side: 'defender' }];
    if (n.includes('BARRAGE'))
      return [{ effectKey: 'doubleSlash',    side: 'defender' }];
    if (n.includes('CHAIN LIGHTNING'))
      return [{ effectKey: 'lightning',      side: 'center'   }];
    if (n.includes('FORTRESS'))
      return [{ effectKey: 'fortressRipple', side: 'actor'    }];
    if (n.includes('LIFESTEAL'))
      return [
        { effectKey: 'slash', side: 'defender' },
        { effectKey: 'drain', side: 'center'   },
      ];
    return [{ effectKey: isCrit ? 'critSlash' : 'slash', side: 'defender' }];
  }

  if (action === 'USE_ITEM') {
    if (n.includes('RESTORED') || n.includes('HEALED'))
      return [{ effectKey: 'heal',      side: 'actor'    }];
    if (n.includes('MAGIC DAMAGE') || damageDealt > 0)
      return [{ effectKey: 'explosion', side: 'defender' }];
    if (n.includes('BLIND') || n.includes('DEBUFF'))
      return [{ effectKey: 'debuff',    side: 'defender' }];
    return [{ effectKey: 'buff', side: 'actor' }];
  }

  return [];
}

/**
 * For OutfittingScreen — spId is known directly, no narrative parsing needed.
 */
export function getSpecialEffects(spId, isCrit = false) {
  switch (spId) {
    case 'cleave':
      return [
        { effectKey: isCrit ? 'critSlash' : 'slash', side: 'defender' },
        { effectKey: 'bleed',                         side: 'defender' },
      ];
    case 'ambush':
      return [{ effectKey: 'critSlash',      side: 'defender' }];
    case 'barrage':
      return [{ effectKey: 'doubleSlash',    side: 'defender' }];
    case 'chain_lightning':
      return [{ effectKey: 'lightning',      side: 'center'   }];
    case 'fortress':
      return [{ effectKey: 'fortressRipple', side: 'actor'    }];
    case 'lifesteal':
      return [
        { effectKey: 'slash', side: 'defender' },
        { effectKey: 'drain', side: 'center'   },
      ];
    default:
      return [{ effectKey: 'slash', side: 'defender' }];
  }
}

/**
 * For OutfittingScreen — consumable effectType known directly.
 */
export function getConsumableEffects(effectType) {
  if (effectType === 'heal')                  return [{ effectKey: 'heal',      side: 'actor'    }];
  if (effectType === 'damage')                return [{ effectKey: 'explosion', side: 'defender' }];
  if (effectType === 'debuff')                return [{ effectKey: 'debuff',    side: 'defender' }];
  if (effectType && effectType.startsWith('buff_'))
                                              return [{ effectKey: 'buff',      side: 'actor'    }];
  return [{ effectKey: 'buff', side: 'actor' }];
}

/**
 * Resolves semantic side to positional 'left'|'right'|'center'.
 *
 * isActorOnLeft: true if the acting team renders on the left of the arena.
 *   BattleScreen / BattleReplayModal: isActorOnLeft = actorTeamId === battle.team1Id
 *   OutfittingScreen: isActorOnLeft = actorSide === 'me'  (me is always on the left)
 */
export function resolveSide(side, isActorOnLeft) {
  if (side === 'center')   return 'center';
  if (side === 'actor')    return isActorOnLeft ? 'left' : 'right';
  /* defender */           return isActorOnLeft ? 'right' : 'left';
}
