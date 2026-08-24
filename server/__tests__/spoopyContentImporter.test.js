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
  test('rejects a house missing dialog_prompt', () => {
    const csv = [
      'tile_id,tile_type,dialog_prompt,option_a_label,option_a_outcome,option_a_task_kind,option_a_task_target,option_a_task_amount,option_a_reward_gp,option_b_label,option_b_outcome,option_b_task_kind,option_b_task_target,option_b_task_amount,option_b_reward_gp',
      'h1,house,,pick a,treat,skilling_xp,cooking,1000,100,pick b,trick,boss_kc,zulrah,1,50',
    ].join('\n');
    const { errors } = parseContent(csv);
    expect(errors.some((e) => /missing dialog_prompt/.test(e))).toBe(true);
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
