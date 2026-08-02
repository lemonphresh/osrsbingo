// GroupGoalBuilder.test.jsx
//
// Pre-migration behavior lock for the metric lists in GroupGoalBuilder.
// BOSS_METRICS, SKILL_METRICS, CLUE_METRICS, and MINIGAME_METRICS are currently
// defined as inline constants. These tests document their current content and
// format so the registry migration can verify nothing gets dropped or malformed.

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const make = (as) => ({ children, ...props }) =>
    React.createElement(as, props, children);
  return {
    Box: make('div'),
    VStack: make('div'),
    HStack: make('div'),
    Text: make('span'),
    FormControl: make('div'),
    FormLabel: make('label'),
    Input: (props) => React.createElement('input', props),
    Select: ({ children, value, onChange, ...rest }) =>
      React.createElement('select', { value, onChange, ...rest }, children),
    NumberInput: make('div'),
    NumberInputField: (props) => React.createElement('input', { type: 'number', ...props }),
    IconButton: ({ onClick, 'aria-label': label }) =>
      React.createElement('button', { onClick, 'aria-label': label }),
    Button: ({ children, onClick }) =>
      React.createElement('button', { onClick }, children),
    Popover: make('div'),
    PopoverTrigger: make('div'),
    PopoverContent: make('div'),
    PopoverBody: make('div'),
    SimpleGrid: make('div'),
    Switch: (props) => React.createElement('input', { type: 'checkbox', ...props }),
    Checkbox: ({ children, ...props }) =>
      React.createElement('label', null,
        React.createElement('input', { type: 'checkbox', ...props }),
        children
      ),
    Tooltip: ({ children }) => children,
  };
});

jest.mock('@chakra-ui/icons', () => ({
  DeleteIcon: () => null,
}));

import GroupGoalBuilder from './GroupGoalBuilder';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeGoal(type, metric = '') {
  return {
    type,
    metric,
    displayName: '',
    target: 100,
    emoji: '',
    enabled: true,
  };
}

function renderWithGoal(type) {
  const defaultMetrics = {
    boss_kc: 'abyssal_sire',
    skill_xp: 'agility',
    minigame_kc: 'bounty_hunter_hunter',
    clue_kc: 'clue_scrolls_all',
    ehb: '',
    ehp: '',
    leagues_points: '',
  };
  const goal = makeGoal(type, defaultMetrics[type] ?? '');
  render(<GroupGoalBuilder goal={goal} onChange={() => {}} onRemove={() => {}} />);
}

function getMetricOptions() {
  // The metric select is the second <select> in the rendered output
  // (first is the goal type select)
  const selects = document.querySelectorAll('select');
  const metricSelect = selects[1];
  if (!metricSelect) return [];
  return Array.from(metricSelect.options).map((o) => ({
    value: o.value,
    label: o.text,
  }));
}

// ── BOSS_METRICS ──────────────────────────────────────────────────────────────

describe('BOSS_METRICS (rendered as boss_kc options)', () => {
  beforeEach(() => {
    renderWithGoal('boss_kc');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('renders a metric select for boss_kc', () => {
    const selects = document.querySelectorAll('select');
    expect(selects.length).toBeGreaterThanOrEqual(2);
  });

  test('all boss metric values are snake_case wom keys (no camelCase)', () => {
    const options = getMetricOptions();
    for (const { value } of options) {
      // snake_case: lowercase letters and underscores only
      expect(value).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });

  test('no duplicate boss metric values', () => {
    const options = getMetricOptions();
    const values = options.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
  });

  // Spot-check bosses that must survive the migration.
  const requiredBosses = [
    ['abyssal_sire', 'Abyssal Sire'],
    ['alchemical_hydra', 'Alchemical Hydra'],
    ['araxxor', 'Araxxor'],
    ['cerberus', 'Cerberus'],
    ['chambers_of_xeric', 'Chambers of Xeric'],
    ['chambers_of_xeric_challenge_mode', 'Chambers of Xeric (CM)'],
    ['commander_zilyana', 'Commander Zilyana (Sara)'],
    ['corporeal_beast', 'Corporeal Beast'],
    ['dagannoth_prime', 'Dagannoth Prime'],
    ['dagannoth_rex', 'Dagannoth Rex'],
    ['dagannoth_supreme', 'Dagannoth Supreme'],
    ['general_graardor', 'General Graardor (Bandos)'],
    ['giant_mole', 'Giant Mole'],
    ['the_hueycoatl', 'The Hueycoatl'],
    ['kraken', 'Kraken'],
    ['kreearra', "Kree'arra (Arma)"],
    ['kril_tsutsaroth', "K'ril Tsutsaroth (Zammy)"],
    ['mad_angel', 'Mad Angel'],
    ['maggot_king', 'Maggot King'],
    ['nex', 'Nex'],
    ['phantom_muspah', 'Phantom Muspah'],
    ['shellbane_gryphon', 'Shellbane Gryphon'],
    ['theatre_of_blood', 'Theatre of Blood'],
    ['theatre_of_blood_hard_mode', 'Theatre of Blood (HM)'],
    ['tombs_of_amascut', 'Tombs of Amascut'],
    ['tombs_of_amascut_expert', 'Tombs of Amascut (Expert)'],
    ['vardorvis', 'Vardorvis'],
    ['vorkath', 'Vorkath'],
    ['yama', 'Yama'],
    ['zulrah', 'Zulrah'],
  ];

  test.each(requiredBosses)('%s is present with label "%s"', (value, label) => {
    const options = getMetricOptions();
    const match = options.find((o) => o.value === value);
    expect(match).toBeDefined();
    expect(match.label).toBe(label);
  });
});

// ── SKILL_METRICS ─────────────────────────────────────────────────────────────

describe('SKILL_METRICS (rendered as skill_xp options)', () => {
  beforeEach(() => {
    renderWithGoal('skill_xp');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('all skill metric values are lowercase wom keys', () => {
    const options = getMetricOptions();
    for (const { value } of options) {
      expect(value).toMatch(/^[a-z][a-z_]*$/);
    }
  });

  test('no duplicate skill metric values', () => {
    const options = getMetricOptions();
    const values = options.map((o) => o.value);
    expect(new Set(values).size).toBe(values.length);
  });

  const requiredSkills = [
    'agility', 'attack', 'construction', 'cooking', 'crafting',
    'defence', 'farming', 'firemaking', 'fishing', 'fletching',
    'herblore', 'hitpoints', 'hunter', 'magic', 'mining',
    'overall', 'prayer', 'ranged', 'runecrafting', 'sailing',
    'slayer', 'smithing', 'strength', 'thieving', 'woodcutting',
  ];

  test.each(requiredSkills)('%s is present', (skill) => {
    const options = getMetricOptions();
    expect(options.find((o) => o.value === skill)).toBeDefined();
  });
});

// ── CLUE_METRICS ──────────────────────────────────────────────────────────────

describe('CLUE_METRICS (rendered as clue_kc options)', () => {
  beforeEach(() => {
    renderWithGoal('clue_kc');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('all seven clue tiers are present', () => {
    const options = getMetricOptions();
    const values = options.map((o) => o.value);
    expect(values).toContain('clue_scrolls_all');
    expect(values).toContain('clue_scrolls_beginner');
    expect(values).toContain('clue_scrolls_easy');
    expect(values).toContain('clue_scrolls_medium');
    expect(values).toContain('clue_scrolls_hard');
    expect(values).toContain('clue_scrolls_elite');
    expect(values).toContain('clue_scrolls_master');
  });
});

// ── MINIGAME_METRICS ──────────────────────────────────────────────────────────

describe('MINIGAME_METRICS (rendered as minigame_kc options)', () => {
  beforeEach(() => {
    renderWithGoal('minigame_kc');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('expected minigames are present', () => {
    const options = getMetricOptions();
    const values = options.map((o) => o.value);
    expect(values).toContain('colosseum_glory');
    expect(values).toContain('guardians_of_the_rift');
    expect(values).toContain('soul_wars_zeal');
    expect(values).toContain('last_man_standing');
  });
});

// ── GOAL_TYPES ────────────────────────────────────────────────────────────────

describe('GOAL_TYPES (rendered as goal type select)', () => {
  beforeEach(() => {
    renderWithGoal('boss_kc');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  test('goal type select includes all expected types', () => {
    const typeSelect = document.querySelectorAll('select')[0];
    const values = Array.from(typeSelect.options).map((o) => o.value);
    expect(values).toContain('boss_kc');
    expect(values).toContain('skill_xp');
    expect(values).toContain('ehb');
    expect(values).toContain('ehp');
    expect(values).toContain('individual_boss_kc');
    expect(values).toContain('individual_skill_xp');
    expect(values).toContain('leagues_points');
  });
});
