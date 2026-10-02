'use strict';

process.env.NODE_ENV = 'test';

const fs = require('fs');
const path = require('path');
const { parseContent } = require('../utils/spoopy/spoopyContentImporter');

const FIXTURE_PATH = path.join(__dirname, '..', 'utils', 'spoopy', 'fixtures', 'example_content.csv');
const fixtureCsv = fs.readFileSync(FIXTURE_PATH, 'utf8');

describe('parseContent against example fixture', () => {
  const { contentById, errors } = parseContent(fixtureCsv);

  test('parses without errors', () => {
    expect(errors).toEqual([]);
  });

  test('produces one entry per tile row', () => {
    // Example fixture has 15 tiles.
    expect(Object.keys(contentById)).toHaveLength(15);
  });

  test('house tiles have dialog with two options', () => {
    const house = contentById['main-1'];
    expect(house.tile_type).toBe('house');
    expect(house.dialog.prompt).toMatch(/trick or treat/i);
    expect(house.dialog.options.a).toMatchObject({ outcome: 'treat', reward_gp: 500000 });
    expect(house.dialog.options.b).toMatchObject({ outcome: 'trick', reward_gp: 200000 });
    expect(house.dialog.options.a.task).toEqual({ kind: 'skilling_xp', target: 'firemaking', amount: 100000 });
    expect(house.dialog.options.b.task).toEqual({ kind: 'boss_kc', target: 'callisto', amount: 5 });
  });

  test('pumpkin tile has task and no dialog', () => {
    const pumpkin = contentById['main-2'];
    expect(pumpkin.tile_type).toBe('pumpkin');
    expect(pumpkin.task).toEqual({ kind: 'skilling_xp', target: 'woodcutting', amount: 75000 });
    expect(pumpkin.dialog).toBeUndefined();
    expect(pumpkin.flavor_text).toBe('a stray jack-o-lantern flickers on the sidewalk');
  });

  test('grave with uniques kind is preserved', () => {
    const grave = contentById['s3-2'];
    expect(grave.tile_type).toBe('grave');
    expect(grave.task).toEqual({ kind: 'uniques', target: 'vetion', amount: 1 });
  });
});

describe('parseContent error surfacing', () => {
  test('allows a house with no dialog_prompt (UI fallbacks instead)', () => {
    // Spooptober-ism: coordinators often ship houses with blank prompts and
    // fill them in later via a data edit. Importer no longer errors here —
    // the client renders a default prompt when `dialog.prompt` is null.
    const csv = [
      'tile_id,tile_type,dialog_prompt,option_a_label,option_a_outcome,option_a_task_kind,option_a_task_target,option_a_task_amount,option_a_reward_gp,option_b_label,option_b_outcome,option_b_task_kind,option_b_task_target,option_b_task_amount,option_b_reward_gp',
      'h1,house,,pick a,treat,skilling_xp,cooking,1000,100,pick b,trick,boss_kc,zulrah,1,50',
    ].join('\n');
    const { contentById, errors } = parseContent(csv);
    expect(errors).toEqual([]);
    expect(contentById.h1.dialog.prompt).toBeNull();
  });

  test('rejects a house with two of the same outcome', () => {
    const csv = [
      'tile_id,tile_type,dialog_prompt,option_a_label,option_a_outcome,option_a_task_kind,option_a_task_target,option_a_task_amount,option_a_reward_gp,option_b_label,option_b_outcome,option_b_task_kind,option_b_task_target,option_b_task_amount,option_b_reward_gp',
      'h1,house,say hi,pick a,treat,skilling_xp,cooking,1000,100,pick b,treat,boss_kc,zulrah,1,50',
    ].join('\n');
    const { errors } = parseContent(csv);
    expect(errors.some((e) => /exactly one trick and one treat/.test(e))).toBe(true);
  });

  test('rejects a non-house missing task fields', () => {
    const csv = [
      'tile_id,tile_type,task_kind,task_target,task_amount',
      'p1,pumpkin,,,,',
    ].join('\n');
    const { errors } = parseContent(csv);
    expect(errors.some((e) => /missing valid task/.test(e))).toBe(true);
  });

  test('flags duplicate tile ids', () => {
    const csv = [
      'tile_id,tile_type,task_kind,task_target,task_amount',
      'p1,pumpkin,skilling_xp,fishing,1000',
      'p1,pumpkin,skilling_xp,mining,2000',
    ].join('\n');
    const { errors } = parseContent(csv);
    expect(errors.some((e) => /duplicate tile_id/.test(e))).toBe(true);
  });
});

describe('parseContent relaxations for spooptober coordinator CSVs', () => {
  test('allows empty option labels (defaulted to null, UI falls back to outcome)', () => {
    const csv = [
      'tile_id,tile_type,dialog_prompt,option_a_label,option_a_outcome,option_a_task_kind,option_a_task_target,option_a_task_amount,option_a_reward_gp,option_b_label,option_b_outcome,option_b_task_kind,option_b_task_target,option_b_task_amount,option_b_reward_gp',
      'h1,house,,,treat,skilling_xp,cooking,1000,,,trick,boss_kc,zulrah,1,',
    ].join('\n');
    const { contentById, errors } = parseContent(csv);
    expect(errors).toEqual([]);
    expect(contentById.h1.dialog.options.a.label).toBeNull();
    expect(contentById.h1.dialog.options.b.label).toBeNull();
  });

  test('defaults blank reward_gp to 0', () => {
    const csv = [
      'tile_id,tile_type,dialog_prompt,option_a_label,option_a_outcome,option_a_task_kind,option_a_task_target,option_a_task_amount,option_a_reward_gp,option_b_label,option_b_outcome,option_b_task_kind,option_b_task_target,option_b_task_amount,option_b_reward_gp',
      'h1,house,,a,treat,skilling_xp,cooking,1000,,b,trick,boss_kc,zulrah,1,',
    ].join('\n');
    const { contentById } = parseContent(csv);
    expect(contentById.h1.dialog.options.a.reward_gp).toBe(0);
    expect(contentById.h1.dialog.options.b.reward_gp).toBe(0);
  });

  test('accepts `kc` as an alias for `boss_kc`', () => {
    const csv = [
      'tile_id,tile_type,task_kind,task_target,task_amount',
      'g1,ghost,kc,zulrah,5',
    ].join('\n');
    const { contentById, errors } = parseContent(csv);
    expect(errors).toEqual([]);
    expect(contentById.g1.task).toEqual({ kind: 'boss_kc', target: 'zulrah', amount: 5 });
  });

  test('accepts the new `custom` task_kind', () => {
    const csv = [
      'tile_id,tile_type,task_kind,task_target,task_amount',
      'p1,pumpkin,custom,"cheese potatos from scratch",1',
    ].join('\n');
    const { contentById, errors } = parseContent(csv);
    expect(errors).toEqual([]);
    expect(contentById.p1.task).toEqual({
      kind: 'custom',
      target: 'cheese potatos from scratch',
      amount: 1,
    });
  });

  test('silently skips rows with a blank tile_type (TBD placeholder rows)', () => {
    const csv = [
      'tile_id,tile_type,task_kind,task_target,task_amount',
      'p1,pumpkin,skilling_xp,fishing,1000',
      's1-4,,,,,',
      'p2,pumpkin,skilling_xp,mining,2000',
    ].join('\n');
    const { contentById, errors } = parseContent(csv);
    expect(errors).toEqual([]);
    expect(Object.keys(contentById).sort()).toEqual(['p1', 'p2']);
  });

  test('option_a_acceptable_drops_override on a non-house uniques task sets empty acceptable_drops', () => {
    // Single-column convention: non-house tiles use `option_a_acceptable_drops_override`
    // too, so authors don't have to think about which column applies per tile type.
    // Signals to the UI "override is active, drop list is pending" so it
    // suppresses the registry fallback.
    const csv = [
      'tile_id,tile_type,task_kind,task_target,task_amount,option_a_acceptable_drops_override',
      'g1,ghost,uniques,chaos_elemental,1,yes',
    ].join('\n');
    const { contentById, errors } = parseContent(csv);
    expect(errors).toEqual([]);
    expect(contentById.g1.task.acceptable_drops).toEqual([]);
  });

  test('legacy acceptable_drops_override column still honored on non-house tiles', () => {
    // Older CSVs that used the top-level column keep working.
    const csv = [
      'tile_id,tile_type,task_kind,task_target,task_amount,acceptable_drops_override',
      'g1,ghost,uniques,chaos_elemental,1,yes',
    ].join('\n');
    const { contentById, errors } = parseContent(csv);
    expect(errors).toEqual([]);
    expect(contentById.g1.task.acceptable_drops).toEqual([]);
  });

  test('acceptable_drops_override is ignored on non-uniques tasks', () => {
    const csv = [
      'tile_id,tile_type,task_kind,task_target,task_amount,option_a_acceptable_drops_override',
      'p1,pumpkin,skilling_xp,fishing,1000,yes',
    ].join('\n');
    const { contentById } = parseContent(csv);
    expect(contentById.p1.task.acceptable_drops).toBeUndefined();
  });

  test('per-option acceptable_drops_override works on house uniques options', () => {
    const csv = [
      'tile_id,tile_type,dialog_prompt,option_a_label,option_a_outcome,option_a_task_kind,option_a_task_target,option_a_task_amount,option_a_reward_gp,option_a_acceptable_drops_override,option_b_label,option_b_outcome,option_b_task_kind,option_b_task_target,option_b_task_amount,option_b_reward_gp,option_b_acceptable_drops_override',
      'h1,house,,,trick,uniques,chambers_of_xeric,1,,yes,,treat,uniques,nex,1,,',
    ].join('\n');
    const { contentById, errors } = parseContent(csv);
    expect(errors).toEqual([]);
    expect(contentById.h1.dialog.options.a.task.acceptable_drops).toEqual([]);
    expect(contentById.h1.dialog.options.b.task.acceptable_drops).toBeUndefined();
  });
});
