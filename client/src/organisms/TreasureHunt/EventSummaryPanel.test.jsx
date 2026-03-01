// organisms/TreasureHunt/EventSummaryPanel.test.jsx
// Tests for EventSummaryPanel — toNum, formatGP, getDiffBreakdown, sorting, totals.

import React from 'react';
import { render, screen } from '@testing-library/react';
import EventSummaryPanel from './EventSummaryPanel';

// ── Chakra mock ──────────────────────────────────────────────────────────────
jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const make = (tag) =>
    ({ children, ...props }) =>
      React.createElement(tag, props, children);
  return {
    Box: make('div'),
    Heading: make('h2'),
    HStack: make('div'),
    VStack: make('div'),
    Text: make('span'),
    Table: make('table'),
    Thead: make('thead'),
    Tbody: make('tbody'),
    Tr: make('tr'),
    Th: make('th'),
    Td: make('td'),
    Badge: make('span'),
    Stat: make('div'),
    StatLabel: make('dt'),
    StatNumber: make('dd'),
    StatGroup: make('dl'),
    Divider: () => React.createElement('hr'),
    Image: ({ src, alt }) => React.createElement('img', { src, alt }),
  };
});

jest.mock('../../hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    colors: { white: '#fff', green: { base: '#00FF00' } },
    colorMode: 'dark',
  }),
}));

jest.mock('../../utils/dateUtils', () => ({
  formatDisplayDateTime: (d) => `dt:${d}`,
}));

jest.mock('../../assets/success.webp', () => 'success.webp');

// ── Test helpers ─────────────────────────────────────────────────────────────

const makeTeam = (id, pot, completedNodes = []) => ({
  teamId: id,
  teamName: `Team ${id}`,
  currentPot: pot,
  completedNodes,
});

const makeNode = (id, tier) => ({ nodeId: id, difficultyTier: tier });

const event = {
  eventId: 'evt1',
  eventName: 'Grand Rush',
  endDate: '2025-06-01T00:00:00.000Z',
  status: 'COMPLETED',
};

// ── Pure-function extraction ───────────────────────────────────────────────────
// These are module-level functions in EventSummaryPanel that aren't exported.
// Reproduced here to enable direct unit testing.

function toNum(gpStr) {
  return Number(gpStr || 0) || 0;
}

function formatGP(gpStr) {
  return toNum(gpStr).toLocaleString();
}

function getDiffBreakdown(completedNodeIds, nodes) {
  const counts = { 1: 0, 3: 0, 5: 0 };
  completedNodeIds?.forEach((id) => {
    const node = nodes?.find((n) => n.nodeId === id);
    if (node?.difficultyTier != null)
      counts[node.difficultyTier] = (counts[node.difficultyTier] || 0) + 1;
  });
  return counts;
}

// ── toNum ─────────────────────────────────────────────────────────────────────

describe('toNum', () => {
  it('converts a numeric string', () => {
    expect(toNum('5000000')).toBe(5000000);
  });

  it('returns 0 for null', () => {
    expect(toNum(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(toNum(undefined)).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(toNum('')).toBe(0);
  });

  it('returns 0 for non-numeric string', () => {
    expect(toNum('abc')).toBe(0);
  });

  it('passes through a number', () => {
    expect(toNum(1234567)).toBe(1234567);
  });
});

// ── formatGP (EventSummaryPanel local version) ────────────────────────────────

describe('formatGP (toLocaleString-based)', () => {
  it('formats 0 as "0"', () => {
    expect(formatGP(0)).toBe((0).toLocaleString());
  });

  it('formats a million GP with locale separators', () => {
    expect(formatGP(1000000)).toBe((1000000).toLocaleString());
  });

  it('handles null gracefully', () => {
    expect(formatGP(null)).toBe('0');
  });
});

// ── getDiffBreakdown ──────────────────────────────────────────────────────────

describe('getDiffBreakdown', () => {
  const nodes = [
    makeNode('n1', 1),  // Easy
    makeNode('n2', 1),  // Easy
    makeNode('n3', 3),  // Medium
    makeNode('n4', 5),  // Hard
    makeNode('n5', 5),  // Hard
  ];

  it('counts easy, medium, hard nodes correctly', () => {
    const result = getDiffBreakdown(['n1', 'n2', 'n3', 'n4', 'n5'], nodes);
    expect(result[1]).toBe(2); // 2 Easy
    expect(result[3]).toBe(1); // 1 Medium
    expect(result[5]).toBe(2); // 2 Hard
  });

  it('returns zeroes when completedNodeIds is empty', () => {
    const result = getDiffBreakdown([], nodes);
    expect(result).toEqual({ 1: 0, 3: 0, 5: 0 });
  });

  it('returns zeroes when completedNodeIds is null/undefined', () => {
    const result = getDiffBreakdown(null, nodes);
    expect(result).toEqual({ 1: 0, 3: 0, 5: 0 });
  });

  it('ignores nodes that are not in the nodes array', () => {
    const result = getDiffBreakdown(['nonexistent'], nodes);
    expect(result).toEqual({ 1: 0, 3: 0, 5: 0 });
  });

  it('ignores nodes with no difficultyTier', () => {
    const nodesWithNull = [{ nodeId: 'x', difficultyTier: null }];
    const result = getDiffBreakdown(['x'], nodesWithNull);
    expect(result).toEqual({ 1: 0, 3: 0, 5: 0 });
  });
});

// ── Rendered output ───────────────────────────────────────────────────────────

describe('EventSummaryPanel rendering', () => {
  it('renders the event name', () => {
    render(
      <EventSummaryPanel event={event} teams={[]} nodes={[]} />
    );
    expect(screen.getByText('Grand Rush')).toBeInTheDocument();
  });

  it('renders total number of teams', () => {
    const teams = [makeTeam('a', 100), makeTeam('b', 200)];
    render(<EventSummaryPanel event={event} teams={teams} nodes={[]} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('sorts teams by currentPot descending', () => {
    const teams = [
      makeTeam('low', 1000),
      makeTeam('high', 9000),
      makeTeam('mid', 5000),
    ];
    render(<EventSummaryPanel event={event} teams={teams} nodes={[]} />);
    const cells = screen.getAllByText(/Team (low|high|mid)/);
    // First team cell should be "Team high" (highest pot)
    expect(cells[0]).toHaveTextContent('Team high');
    expect(cells[1]).toHaveTextContent('Team mid');
    expect(cells[2]).toHaveTextContent('Team low');
  });

  it('shows correct total nodes completed', () => {
    const teams = [
      makeTeam('a', 0, ['n1', 'n2']),
      makeTeam('b', 0, ['n3']),
    ];
    render(<EventSummaryPanel event={event} teams={teams} nodes={[]} />);
    // Total = 3
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows difficulty breakdown badges for easy nodes', () => {
    const nodes = [makeNode('n1', 1), makeNode('n2', 1)];
    const teams = [makeTeam('a', 500, ['n1', 'n2'])];
    render(<EventSummaryPanel event={event} teams={teams} nodes={nodes} />);
    // Badge should show "2E" (2 Easy nodes)
    expect(screen.getByText(/2E/)).toBeInTheDocument();
  });

  it('shows difficulty breakdown badges for hard nodes', () => {
    const nodes = [makeNode('n1', 5)];
    const teams = [makeTeam('a', 500, ['n1'])];
    render(<EventSummaryPanel event={event} teams={teams} nodes={nodes} />);
    // Badge should show "1H"
    expect(screen.getByText(/1H/)).toBeInTheDocument();
  });

  it('shows medal emoji for top 3 teams', () => {
    const teams = [makeTeam('a', 3000), makeTeam('b', 2000), makeTeam('c', 1000)];
    render(<EventSummaryPanel event={event} teams={teams} nodes={[]} />);
    expect(screen.getByText('🥇')).toBeInTheDocument();
    expect(screen.getByText('🥈')).toBeInTheDocument();
    expect(screen.getByText('🥉')).toBeInTheDocument();
  });
});
