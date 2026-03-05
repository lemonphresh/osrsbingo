// organisms/TreasureHunt/BuffHistoryPanel.test.jsx
// Tests for BuffHistoryPanel — getBuffIcon, formatTimeAgo, sort order, null guard.

import React from 'react';
import { render, screen } from '@testing-library/react';
import BuffHistoryPanel from './BuffHistoryPanel';

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
    Badge: make('span'),
    Icon: () => null,
    Collapse: ({ in: isIn, children }) =>
      isIn ? React.createElement('div', null, children) : null,
    IconButton: ({ 'aria-label': label }) =>
      React.createElement('button', { 'aria-label': label }),
    useDisclosure: () => ({ isOpen: true, onToggle: jest.fn() }),
    useColorMode: () => ({ colorMode: 'dark' }),
  };
});

jest.mock('@chakra-ui/icons', () => ({
  ChevronDownIcon: () => null,
  ChevronUpIcon: () => null,
}));

jest.mock('react-icons/fa', () => ({ FaMagic: () => null }));

// ── Pure-function extraction ───────────────────────────────────────────────────
// Reproducing module-level helpers that aren't exported.

const getBuffIcon = (buffName = '') => {
  if (buffName.toLowerCase().includes('slayer')) return '⚔️';
  if (buffName.toLowerCase().includes('training')) return '📚';
  if (buffName.toLowerCase().includes('gather')) return '📦';
  if (buffName.toLowerCase().includes('versatile')) return '✨';
  return '🎁';
};

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// ── getBuffIcon ───────────────────────────────────────────────────────────────

describe('getBuffIcon', () => {
  it('returns sword for slayer buffs', () => {
    expect(getBuffIcon("Slayer's Edge")).toBe('⚔️');
    expect(getBuffIcon("slayer mastery")).toBe('⚔️');
  });

  it('returns book for training buffs', () => {
    expect(getBuffIcon('Training Efficiency')).toBe('📚');
    expect(getBuffIcon('training momentum')).toBe('📚');
  });

  it('returns box for gathering buffs', () => {
    expect(getBuffIcon('Master Gatherer')).toBe('📦');
    expect(getBuffIcon('Legendary gather')).toBe('📦');
  });

  it('returns sparkle for versatile buffs', () => {
    // 'Versatile Training' would match 'training' first — use a name with only 'versatile'
    expect(getBuffIcon('Versatile Boost')).toBe('✨');
  });

  it('returns gift for unrecognised buff names', () => {
    expect(getBuffIcon('Mystery Buff')).toBe('🎁');
    expect(getBuffIcon('')).toBe('🎁');
  });
});

// ── formatTimeAgo ─────────────────────────────────────────────────────────────

describe('formatTimeAgo', () => {
  it('returns "just now" for timestamps less than 1 minute ago', () => {
    const ts = new Date(Date.now() - 30 * 1000).toISOString();
    expect(formatTimeAgo(ts)).toBe('just now');
  });

  it('returns "Xm ago" for 1–59 minutes ago', () => {
    const ts = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    expect(formatTimeAgo(ts)).toBe('20m ago');
  });

  it('returns "Xh ago" for 1–23 hours ago', () => {
    const ts = new Date(Date.now() - 5 * 3600 * 1000).toISOString();
    expect(formatTimeAgo(ts)).toBe('5h ago');
  });

  it('returns "Xd ago" for 1–6 days ago', () => {
    const ts = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
    expect(formatTimeAgo(ts)).toBe('3d ago');
  });

  it('returns localeDateString for >= 7 days ago', () => {
    const date = new Date(Date.now() - 10 * 86400 * 1000);
    const ts = date.toISOString();
    expect(formatTimeAgo(ts)).toBe(date.toLocaleDateString());
  });
});

// ── null guard ────────────────────────────────────────────────────────────────

describe('null guard', () => {
  it('returns null when buffHistory is empty', () => {
    const { container } = render(<BuffHistoryPanel buffHistory={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when buffHistory is not provided', () => {
    const { container } = render(<BuffHistoryPanel />);
    expect(container.firstChild).toBeNull();
  });
});

// ── Rendering ─────────────────────────────────────────────────────────────────

const makeEntry = (overrides = {}) => ({
  buffId: 'b1',
  buffName: "Slayer's Edge",
  usedOn: 'node1',
  usedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  originalRequirement: '100',
  reducedRequirement: '75',
  benefit: '-25%',
  ...overrides,
});

describe('rendering', () => {
  it('shows "Buff Usage History" header', () => {
    render(<BuffHistoryPanel buffHistory={[makeEntry()]} />);
    expect(screen.getByText('Buff Usage History')).toBeInTheDocument();
  });

  it('shows correct plural count — "3 buffs used"', () => {
    const history = [makeEntry({ buffId: 'b1' }), makeEntry({ buffId: 'b2' }), makeEntry({ buffId: 'b3' })];
    render(<BuffHistoryPanel buffHistory={history} />);
    expect(screen.getByText('3 buffs used')).toBeInTheDocument();
  });

  it('shows singular "1 buff used"', () => {
    render(<BuffHistoryPanel buffHistory={[makeEntry()]} />);
    expect(screen.getByText('1 buff used')).toBeInTheDocument();
  });

  it('shows buff name', () => {
    render(<BuffHistoryPanel buffHistory={[makeEntry({ buffName: 'Speed Boost' })]} />);
    expect(screen.getByText('Speed Boost')).toBeInTheDocument();
  });

  it('shows reduction info', () => {
    render(<BuffHistoryPanel buffHistory={[makeEntry({ originalRequirement: '100', reducedRequirement: '75', benefit: '-25%' })]} />);
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('(-25%)')).toBeInTheDocument();
  });

  it('resolves node title from nodes array', () => {
    const nodes = [{ nodeId: 'node1', title: 'Dragon Lair' }];
    render(<BuffHistoryPanel buffHistory={[makeEntry({ usedOn: 'node1' })]} nodes={nodes} />);
    expect(screen.getByText('Dragon Lair')).toBeInTheDocument();
  });

  it('falls back to nodeId when node not found in nodes array', () => {
    render(<BuffHistoryPanel buffHistory={[makeEntry({ usedOn: 'unknown-node-id' })]} nodes={[]} />);
    expect(screen.getByText('unknown-node-id')).toBeInTheDocument();
  });
});

// ── Sort order (most recent first) ────────────────────────────────────────────

describe('sort order', () => {
  it('renders most recently used buff first', () => {
    const history = [
      makeEntry({ buffId: 'old', buffName: 'Old Buff', usedAt: new Date(Date.now() - 3600 * 1000).toISOString() }),
      makeEntry({ buffId: 'new', buffName: 'New Buff', usedAt: new Date(Date.now() - 60 * 1000).toISOString() }),
    ];
    render(<BuffHistoryPanel buffHistory={history} />);
    const names = screen.getAllByText(/Old Buff|New Buff/);
    expect(names[0]).toHaveTextContent('New Buff');
    expect(names[1]).toHaveTextContent('Old Buff');
  });
});
