'use strict';

process.env.NODE_ENV = 'test';

const { mockEvent, makeInitialTeamState } = require('../utils/spoopy/spoopyMockEvent');
const { TILE_STATUSES } = require('../utils/spoopy/spoopyConfig');
const sm = require('../utils/spoopy/spoopyStateMachine');

// Convenience — the mock board:
//         c0    c1   c2   c3   c4   c5   c6
//   r0    H     -    P    -    Gh   -    Gr
//   r2    H                    X    -    $
const HOUSE_TL = 't-r0-c0';
const PUMPKIN  = 't-r0-c2';
const GHOST    = 't-r0-c4';
const GRAVE    = 't-r0-c6';
const HOUSE_BL = 't-r2-c0';
const BLACK_CAT = 't-r2-c4';
const CANDYBAG  = 't-r2-c6';

function fresh() {
  return makeInitialTeamState('team-1', ['user-a', 'user-b']);
}

// Walks a non-house tile UNLOCKED → COMPLETE.
function completeNonHouse(state, tileId) {
  state = sm.submitProof(state, mockEvent, tileId, `sub-${tileId}`);
  state = sm.approveSubmission(state, mockEvent, tileId);
  return state;
}

// Walks a house UNLOCKED → COMPLETE via a chosen option.
function completeHouse(state, tileId, option) {
  state = sm.chooseOption(state, mockEvent, tileId, option);
  state = sm.submitProof(state, mockEvent, tileId, `sub-${tileId}`);
  state = sm.approveSubmission(state, mockEvent, tileId);
  return state;
}

describe('initial state', () => {
  test('starting tiles are unlocked', () => {
    const s = fresh();
    expect(s.tiles[HOUSE_TL].status).toBe(TILE_STATUSES.UNLOCKED);
    expect(s.tiles[HOUSE_BL].status).toBe(TILE_STATUSES.UNLOCKED);
    expect(s.tiles[PUMPKIN].status).toBe(TILE_STATUSES.LOCKED);
  });
});

describe('house tile flow', () => {
  test('happy path: choose treat → submit → approve → gp banked → neighbors unlocked', () => {
    let s = fresh();
    s = sm.chooseOption(s, mockEvent, HOUSE_TL, 'a');       // treat, 500k
    expect(s.tiles[HOUSE_TL].choice).toBe('a');
    expect(s.tiles[HOUSE_TL].outcome).toBe('treat');

    s = sm.submitProof(s, mockEvent, HOUSE_TL, 'sub-1');
    expect(s.tiles[HOUSE_TL].status).toBe(TILE_STATUSES.SUBMITTED);
    expect(s.tiles[HOUSE_TL].submissionId).toBe('sub-1');

    s = sm.approveSubmission(s, mockEvent, HOUSE_TL);
    expect(s.tiles[HOUSE_TL].status).toBe(TILE_STATUSES.COMPLETE);
    expect(s.tiles[HOUSE_TL].rewardEarned).toBe(500000);
    expect(s.gpEarned).toBe(500000);
    expect(s.tiles[PUMPKIN].status).toBe(TILE_STATUSES.UNLOCKED);
  });

  test('trick option pays out the trick reward', () => {
    let s = fresh();
    s = completeHouse(s, HOUSE_TL, 'b'); // trick, 200k
    expect(s.gpEarned).toBe(200000);
  });

  test('choice is write-once (no take-backsies)', () => {
    let s = fresh();
    s = sm.chooseOption(s, mockEvent, HOUSE_TL, 'a');
    expect(() => sm.chooseOption(s, mockEvent, HOUSE_TL, 'b'))
      .toThrow(/already locked/);
  });

  test('cannot submit before choosing an option', () => {
    const s = fresh();
    expect(() => sm.submitProof(s, mockEvent, HOUSE_TL, 'sub'))
      .toThrow(/before choosing/);
  });

  test('getActiveTask returns null before choice, resolved task after', () => {
    let s = fresh();
    expect(sm.getActiveTask(s, mockEvent, HOUSE_TL)).toBeNull();
    s = sm.chooseOption(s, mockEvent, HOUSE_TL, 'a');
    expect(sm.getActiveTask(s, mockEvent, HOUSE_TL))
      .toEqual({ kind: 'skilling_xp', target: 'firemaking', amount: 100000 });
  });
});

describe('non-house tile flow', () => {
  test('pumpkin completion awards no gp but unlocks neighbors', () => {
    let s = fresh();
    s = completeHouse(s, HOUSE_TL, 'a'); // unlock the pumpkin
    const gpBefore = s.gpEarned;
    s = completeNonHouse(s, PUMPKIN);
    expect(s.gpEarned).toBe(gpBefore); // no gp reward
    expect(s.tiles[PUMPKIN].status).toBe(TILE_STATUSES.COMPLETE);
    expect(s.tiles[GHOST].status).toBe(TILE_STATUSES.UNLOCKED);
  });

  test('chooseOption on a non-house tile is rejected', () => {
    let s = fresh();
    s = completeHouse(s, HOUSE_TL, 'a');
    expect(() => sm.chooseOption(s, mockEvent, PUMPKIN, 'a'))
      .toThrow(/only valid on house/);
  });
});

describe('deny submission', () => {
  test('rolls back to unlocked but preserves the house choice', () => {
    let s = fresh();
    s = sm.chooseOption(s, mockEvent, HOUSE_TL, 'a');
    s = sm.submitProof(s, mockEvent, HOUSE_TL, 'sub-1');
    s = sm.denySubmission(s, mockEvent, HOUSE_TL);
    expect(s.tiles[HOUSE_TL].status).toBe(TILE_STATUSES.UNLOCKED);
    expect(s.tiles[HOUSE_TL].choice).toBe('a');  // no take-backsies even on deny
    expect(s.tiles[HOUSE_TL].submissionId).toBeNull();
  });
});

describe('haunted house / cashout', () => {
  function walkToCandybag(s) {
    // TL house → pumpkin → ghost → grave → candybag
    s = completeHouse(s, HOUSE_TL, 'a');
    s = completeNonHouse(s, PUMPKIN);
    s = completeNonHouse(s, GHOST);
    s = completeNonHouse(s, GRAVE);
    return s;
  }

  test('enterHauntedHouse returns severe warning tier when lots of time left', () => {
    let s = fresh();
    s = walkToCandybag(s);
    const before = new Date(mockEvent.curfew.end).getTime() - 10 * 60 * 60 * 1000; // 10h before end
    const result = sm.enterHauntedHouse(s, mockEvent, new Date(before));
    expect(result.warningTier.dialog).toMatch(/cowardice/i);
  });

  test('enterHauntedHouse returns light warning near curfew', () => {
    let s = fresh();
    s = walkToCandybag(s);
    const nearEnd = new Date(mockEvent.curfew.end).getTime() - 30 * 60 * 1000; // 30 min before end
    const result = sm.enterHauntedHouse(s, mockEvent, new Date(nearEnd));
    expect(result.warningTier.dialog).not.toMatch(/cowardice/i);
  });

  test('enterHauntedHouse rejects if candybag not yet unlocked', () => {
    const s = fresh();
    expect(() => sm.enterHauntedHouse(s, mockEvent))
      .toThrow(/not unlocked/);
  });

  test('completing the candybag tile cashes the team out and adds the bonus', () => {
    let s = fresh();
    s = walkToCandybag(s);
    const gpBefore = s.gpEarned;
    expect(s.cashedOut).toBeNull();

    s = sm.submitProof(s, mockEvent, CANDYBAG, 'sub-hh');
    s = sm.approveSubmission(s, mockEvent, CANDYBAG);

    expect(s.cashedOut).not.toBeNull();
    expect(s.cashedOut.forfeited).toBe(false);
    expect(s.gpEarned).toBe(gpBefore + mockEvent.hauntedHouse.bonusReward_gp);
  });

  test('no transitions allowed after cashout', () => {
    let s = fresh();
    s = walkToCandybag(s);
    s = sm.submitProof(s, mockEvent, CANDYBAG, 'sub-hh');
    s = sm.approveSubmission(s, mockEvent, CANDYBAG);

    expect(() => sm.chooseOption(s, mockEvent, HOUSE_BL, 'a'))
      .toThrow(/already cashed out/);
    expect(() => sm.submitProof(s, mockEvent, HOUSE_BL, 'sub'))
      .toThrow(/already cashed out/);
  });
});

describe('curfew forfeit', () => {
  test('no-op before curfew end', () => {
    let s = fresh();
    s = completeHouse(s, HOUSE_TL, 'a');
    const gpBefore = s.gpEarned;
    const before = new Date(mockEvent.curfew.end).getTime() - 60 * 1000;
    s = sm.handleCurfew(s, mockEvent, new Date(before));
    expect(s.gpEarned).toBe(gpBefore);
    expect(s.cashedOut).toBeNull();
  });

  test('forfeits ALL banked gp if curfew hits without cashout', () => {
    let s = fresh();
    s = completeHouse(s, HOUSE_TL, 'a');   // bank 500k
    s = completeHouse(s, HOUSE_BL, 'a');   // bank another 750k
    expect(s.gpEarned).toBe(1250000);

    const after = new Date(mockEvent.curfew.end).getTime() + 60 * 1000;
    s = sm.handleCurfew(s, mockEvent, new Date(after));

    expect(s.gpEarned).toBe(0);
    expect(s.cashedOut.forfeited).toBe(true);
    expect(s.cashedOut.bonusEarned).toBe(0);
  });

  test('does not clobber already-cashed-out state', () => {
    let s = fresh();
    // Walk to candybag and cash out.
    s = completeHouse(s, HOUSE_TL, 'a');
    s = completeNonHouse(s, PUMPKIN);
    s = completeNonHouse(s, GHOST);
    s = completeNonHouse(s, GRAVE);
    s = sm.submitProof(s, mockEvent, CANDYBAG, 'sub-hh');
    s = sm.approveSubmission(s, mockEvent, CANDYBAG);
    const snapshot = s;

    const after = new Date(mockEvent.curfew.end).getTime() + 60 * 1000;
    s = sm.handleCurfew(s, mockEvent, new Date(after));
    expect(s).toEqual(snapshot);
  });
});

describe('immutability', () => {
  test('input state is not mutated by transitions', () => {
    const original = fresh();
    const snapshot = JSON.parse(JSON.stringify(original));
    sm.chooseOption(original, mockEvent, HOUSE_TL, 'a');
    expect(original).toEqual(snapshot);
  });
});
