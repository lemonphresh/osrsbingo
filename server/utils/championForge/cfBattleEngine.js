'use strict';

/**
 * Pure-ish helpers for computing a single battle turn's state transition.
 * Used by the interactive submitBattleAction resolver, the turn-timer
 * auto-attack, and the dev-only auto-battle simulator so that a bug fix to
 * the core combat math only lives in one place.
 */

const { rollDamage } = require('./cfRandomisation');
const {
  getEffectiveStats,
  hasFortress,
  isBlinded,
  tickEffects,
  advanceTurn,
} = require('../../schema/resolvers/championForge/helpers');

/**
 * Apply an auto-attack (used when a turn timer expires or the dev simulator
 * runs). Returns the mutated state along with derived fields the caller can
 * write to the battle log.
 *
 * Does NOT mutate `state`; returns a new object.
 */
function computeAutoAttack({ state, snap, actorSide, defSide, options = {} }) {
  const { autoAttackNarrativePrefix = '⏰ Time ran out! ' } = options;
  const actorSnap = snap[actorSide === 'team1' ? 'champion1' : 'champion2'];
  const defSnap = snap[actorSide === 'team1' ? 'champion2' : 'champion1'];

  let newState = { ...state };

  // Decay fortress on actor's turn
  newState.activeEffects = { ...newState.activeEffects };
  newState.activeEffects[actorSide] = (newState.activeEffects[actorSide] ?? [])
    .map((e) => (e.type === 'fortress' ? { ...e, turns: e.turns - 1 } : e))
    .filter((e) => e.turns > 0);

  const actorEffStats = getEffectiveStats(actorSnap, newState.activeEffects[actorSide]);
  const defEffStats = getEffectiveStats(defSnap, newState.activeEffects[defSide]);
  const isDefending = newState.defendActive[defSide] ?? false;

  let damageDealt = 0;
  let isCrit = false;
  let narrative;

  if (isBlinded(newState.activeEffects[actorSide])) {
    narrative = `${autoAttackNarrativePrefix}${actorSnap.teamName} was blinded and missed!`;
  } else {
    const roll = rollDamage({
      attackStat: actorEffStats.attack,
      defenseStat: defEffStats.defense,
      critChance: actorEffStats.crit,
      isDefending,
    });
    const fortressMult = hasFortress(newState.activeEffects[defSide]) ? 0.4 : 1;
    damageDealt =
      fortressMult < 1 ? Math.max(1, Math.round(roll.damage * fortressMult)) : roll.damage;
    isCrit = roll.isCrit;
    newState.hp = { ...newState.hp };
    newState.hp[defSide] = Math.max(0, newState.hp[defSide] - damageDealt);
    newState.defendActive = { ...newState.defendActive, [defSide]: false };
    narrative = `${autoAttackNarrativePrefix}${actorSnap.teamName} auto-attacks for ${damageDealt} damage!${
      isCrit ? ' (crit!)' : ''
    }`;
  }

  const bleedResult = tickEffects(newState, actorSide);
  if (bleedResult.bleedDamage > 0) {
    newState.hp = { ...newState.hp };
    newState.hp[actorSide] = Math.max(0, newState.hp[actorSide] - bleedResult.bleedDamage);
    newState.activeEffects[actorSide] = bleedResult.effects;
  }

  const stateBeforeAdvance = newState;
  newState = advanceTurn(newState);

  return {
    newState,
    turnNumberBeforeAdvance: stateBeforeAdvance.turnNumber,
    actorSnap,
    damageDealt,
    isCrit,
    narrative,
    bleedResult,
    rollInputs: {
      attackStat: actorEffStats.attack,
      defenseStat: defEffStats.defense,
      critChance: actorEffStats.crit,
      isDefending,
    },
  };
}

module.exports = { computeAutoAttack };
