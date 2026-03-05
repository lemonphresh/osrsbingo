// organisms/TreasureHunt/TreasureBuffInventory.test.jsx
// Tests for BuffInventory (TreasureBuffInventory) — getBuffColor, getBuffIcon, rendering.

import React from 'react';
import { render, screen } from '@testing-library/react';
import BuffInventory from './TreasureBuffInventory';

// ── Chakra mock ──────────────────────────────────────────────────────────────
jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const make = (tag) =>
    ({ children, ...props }) =>
      React.createElement(tag, props, children);
  return {
    Box: make('div'),
    VStack: make('div'),
    HStack: make('div'),
    Text: make('span'),
    Badge: ({ children, colorScheme }) =>
      React.createElement('span', { 'data-colorscheme': colorScheme }, children),
    Tooltip: ({ children }) => React.createElement('div', null, children),
    Icon: () => null,
    Button: ({ children, onClick }) =>
      React.createElement('button', { onClick }, children),
    Flex: make('div'),
  };
});

jest.mock('@chakra-ui/icons', () => ({
  InfoIcon: () => null,
  InfoOutlineIcon: () => null,
}));

// Mock the BuffInfoModal to avoid deep render tree
jest.mock('./TreasureHuntBuffInfoModal', () => () => null);

// ── Pure-function extraction ───────────────────────────────────────────────────

const getBuffColor = (reduction) => {
  if (reduction >= 0.75) return 'purple';
  if (reduction >= 0.5) return 'blue';
  return 'green';
};

const getBuffIcon = (buffType) => {
  if (buffType.includes('kill_reduction')) return '⚔️';
  if (buffType.includes('xp_reduction')) return '📚';
  if (buffType.includes('item_reduction')) return '📦';
  if (buffType.includes('universal')) return '✨';
  if (buffType.includes('multi_use')) return '🔄';
  return '🎁';
};

// ── getBuffColor ──────────────────────────────────────────────────────────────

describe('getBuffColor', () => {
  it('returns "purple" for >= 75% reduction', () => {
    expect(getBuffColor(0.75)).toBe('purple');
    expect(getBuffColor(1.0)).toBe('purple');
  });

  it('returns "blue" for >= 50% but < 75% reduction', () => {
    expect(getBuffColor(0.5)).toBe('blue');
    expect(getBuffColor(0.74)).toBe('blue');
  });

  it('returns "green" for < 50% reduction', () => {
    expect(getBuffColor(0.25)).toBe('green');
    expect(getBuffColor(0.49)).toBe('green');
    expect(getBuffColor(0)).toBe('green');
  });
});

// ── getBuffIcon ───────────────────────────────────────────────────────────────

describe('getBuffIcon', () => {
  it('returns ⚔️ for kill_reduction', () => {
    expect(getBuffIcon('kill_reduction')).toBe('⚔️');
    expect(getBuffIcon('kill_reduction_minor')).toBe('⚔️');
  });

  it('returns 📚 for xp_reduction', () => {
    expect(getBuffIcon('xp_reduction')).toBe('📚');
  });

  it('returns 📦 for item_reduction', () => {
    expect(getBuffIcon('item_reduction')).toBe('📦');
  });

  it('returns ✨ for universal', () => {
    expect(getBuffIcon('universal')).toBe('✨');
  });

  it('returns 🔄 for multi_use', () => {
    expect(getBuffIcon('multi_use')).toBe('🔄');
  });

  it('returns 🎁 for unrecognised type', () => {
    expect(getBuffIcon('mystery_buff')).toBe('🎁');
    expect(getBuffIcon('')).toBe('🎁');
  });
});

// ── Empty state ───────────────────────────────────────────────────────────────

describe('empty state', () => {
  it('shows empty message when buffs array is empty', () => {
    render(<BuffInventory buffs={[]} />);
    expect(screen.getByText('No available buffs. Complete nodes to earn buffs!')).toBeInTheDocument();
  });

  it('shows "Learn About Buffs" button when empty', () => {
    render(<BuffInventory buffs={[]} />);
    expect(screen.getByText('Learn About Buffs')).toBeInTheDocument();
  });

  it('shows empty message when buffs is not provided', () => {
    render(<BuffInventory />);
    expect(screen.getByText('No available buffs. Complete nodes to earn buffs!')).toBeInTheDocument();
  });
});

// ── Buff item rendering ───────────────────────────────────────────────────────

const makeBuff = (overrides = {}) => ({
  buffId: 'buff1',
  buffName: 'Speed Boost',
  buffType: 'kill_reduction',
  reduction: 0.25,
  description: 'Reduces kill count by 25%',
  usesRemaining: 1,
  objectiveTypes: ['boss_kc'],
  ...overrides,
});

describe('buff item rendering', () => {
  it('renders buff name', () => {
    render(<BuffInventory buffs={[makeBuff({ buffName: 'Iron Will' })]} />);
    expect(screen.getByText('Iron Will')).toBeInTheDocument();
  });

  it('renders reduction percentage badge', () => {
    render(<BuffInventory buffs={[makeBuff({ reduction: 0.25 })]} />);
    expect(screen.getByText('-25%')).toBeInTheDocument();
  });

  it('renders buff description', () => {
    render(<BuffInventory buffs={[makeBuff({ description: 'A helpful buff' })]} />);
    expect(screen.getByText('A helpful buff')).toBeInTheDocument();
  });

  it('shows "X uses remaining" badge when usesRemaining > 1', () => {
    render(<BuffInventory buffs={[makeBuff({ usesRemaining: 3 })]} />);
    expect(screen.getByText('3 uses remaining')).toBeInTheDocument();
  });

  it('does not show uses badge when usesRemaining is 1', () => {
    render(<BuffInventory buffs={[makeBuff({ usesRemaining: 1 })]} />);
    expect(screen.queryByText(/uses remaining/)).not.toBeInTheDocument();
  });

  it('renders multiple buffs', () => {
    const buffs = [
      makeBuff({ buffId: 'b1', buffName: 'Alpha Buff' }),
      makeBuff({ buffId: 'b2', buffName: 'Beta Buff' }),
    ];
    render(<BuffInventory buffs={buffs} />);
    expect(screen.getByText('Alpha Buff')).toBeInTheDocument();
    expect(screen.getByText('Beta Buff')).toBeInTheDocument();
  });

  it('uses purple colorScheme badge for 75%+ reduction', () => {
    render(<BuffInventory buffs={[makeBuff({ reduction: 0.75 })]} />);
    const badge = screen.getByText('-75%');
    expect(badge.getAttribute('data-colorscheme')).toBe('purple');
  });

  it('uses blue colorScheme badge for 50%+ reduction', () => {
    render(<BuffInventory buffs={[makeBuff({ reduction: 0.5 })]} />);
    const badge = screen.getByText('-50%');
    expect(badge.getAttribute('data-colorscheme')).toBe('blue');
  });

  it('uses green colorScheme badge for < 50% reduction', () => {
    render(<BuffInventory buffs={[makeBuff({ reduction: 0.25 })]} />);
    const badge = screen.getByText('-25%');
    expect(badge.getAttribute('data-colorscheme')).toBe('green');
  });
});
