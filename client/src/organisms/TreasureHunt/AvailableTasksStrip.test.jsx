// organisms/TreasureHunt/AvailableTasksStrip.test.jsx
// Tests for AvailableTasksStrip — node filtering and sort ordering.

import React from 'react';
import { render, screen } from '@testing-library/react';
import AvailableTasksStrip from './AvailableTasksStrip';

// ── Chakra mock ──────────────────────────────────────────────────────────────
jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const make = (tag) =>
    ({ children, ...props }) =>
      React.createElement(tag, props, children);
  return {
    Badge: make('span'),
    Box: make('div'),
    Flex: make('div'),
    HStack: make('div'),
    Icon: () => null,
    Text: make('span'),
  };
});

jest.mock('react-icons/fa', () => ({ FaCoins: () => null }));

jest.mock('../../atoms/GemTitle', () => {
  const React = require('react');
  return ({ children }) => React.createElement('h3', null, children);
});

jest.mock('../../utils/treasureHuntHelpers', () => ({
  OBJECTIVE_TYPES: { boss_kc: 'Boss Kill Count', xp_gain: 'XP Gain' },
  formatGP: (gp) => `${gp}gp`,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeNode = (id, overrides = {}) => ({
  nodeId: id,
  nodeType: 'STANDARD',
  title: `Node ${id}`,
  difficultyTier: 1,
  ...overrides,
});

const makeTeam = (overrides = {}) => ({
  teamId: 'team1',
  innTransactions: [],
  ...overrides,
});

const baseProps = {
  team: makeTeam(),
  flashNodeId: null,
  scrollRef: { current: null },
  handleQuestScroll: jest.fn(),
  showLeftFade: false,
  showRightFade: false,
  sectionBg: '#fff',
  colorMode: 'dark',
  currentColors: { green: { base: '#00FF00' }, orange: '#FFA500' },
  handleNodeClick: jest.fn(),
};

// ── null return when no available nodes ──────────────────────────────────────

describe('returns null when no available nodes', () => {
  it('renders nothing when all nodes are locked', () => {
    const { container } = render(
      <AvailableTasksStrip
        {...baseProps}
        nodes={[makeNode('n1'), makeNode('n2')]}
        getNodeStatus={() => 'locked'}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when nodes array is empty', () => {
    const { container } = render(
      <AvailableTasksStrip
        {...baseProps}
        nodes={[]}
        getNodeStatus={() => 'available'}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});

// ── filtering ─────────────────────────────────────────────────────────────────

describe('node filtering', () => {
  it('includes nodes with status "available"', () => {
    const nodes = [makeNode('n1'), makeNode('n2', { title: 'Node Two' })];
    render(
      <AvailableTasksStrip
        {...baseProps}
        nodes={nodes}
        getNodeStatus={(n) => 'available'}
      />
    );
    expect(screen.getByText('Node n1')).toBeInTheDocument();
    expect(screen.getByText('Node Two')).toBeInTheDocument();
  });

  it('excludes locked nodes', () => {
    const nodes = [makeNode('n1'), makeNode('n2')];
    render(
      <AvailableTasksStrip
        {...baseProps}
        nodes={nodes}
        getNodeStatus={(n) => (n.nodeId === 'n1' ? 'available' : 'locked')}
      />
    );
    expect(screen.getByText('Node n1')).toBeInTheDocument();
    expect(screen.queryByText('Node n2')).not.toBeInTheDocument();
  });

  it('includes INN nodes that are completed but have no transaction', () => {
    const innNode = makeNode('inn1', { nodeType: 'INN', title: 'The Rusty Coin' });
    const team = makeTeam({ innTransactions: [] }); // no transactions
    render(
      <AvailableTasksStrip
        {...baseProps}
        team={team}
        nodes={[innNode]}
        getNodeStatus={(n) => 'completed'}
      />
    );
    expect(screen.getByText('The Rusty Coin')).toBeInTheDocument();
  });

  it('excludes INN nodes that are completed AND already have a transaction', () => {
    const innNode = makeNode('inn1', { nodeType: 'INN', title: 'The Rusty Coin' });
    const team = makeTeam({ innTransactions: [{ nodeId: 'inn1' }] });
    const { container } = render(
      <AvailableTasksStrip
        {...baseProps}
        team={team}
        nodes={[innNode]}
        getNodeStatus={(n) => 'completed'}
      />
    );
    // No available nodes → returns null
    expect(container.firstChild).toBeNull();
  });
});

// ── available count badge ─────────────────────────────────────────────────────

describe('available count badge', () => {
  it('shows the count of available nodes', () => {
    const nodes = [makeNode('n1'), makeNode('n2'), makeNode('n3')];
    render(
      <AvailableTasksStrip
        {...baseProps}
        nodes={nodes}
        getNodeStatus={() => 'available'}
      />
    );
    expect(screen.getByText('3 available')).toBeInTheDocument();
  });

  it('shows 1 available when only one node passes filter', () => {
    const nodes = [makeNode('n1'), makeNode('n2')];
    render(
      <AvailableTasksStrip
        {...baseProps}
        nodes={nodes}
        getNodeStatus={(n) => (n.nodeId === 'n1' ? 'available' : 'locked')}
      />
    );
    expect(screen.getByText('1 available')).toBeInTheDocument();
  });
});

// ── sort ordering — INN with no transaction appears first ─────────────────────

describe('sort ordering', () => {
  it('places INN-completed-no-tx node before regular available node', () => {
    const innNode = makeNode('inn1', {
      nodeType: 'INN',
      title: 'INN First',
    });
    const stdNode = makeNode('std1', {
      nodeType: 'STANDARD',
      title: 'Standard After',
    });
    const team = makeTeam({ innTransactions: [] });

    render(
      <AvailableTasksStrip
        {...baseProps}
        team={team}
        nodes={[stdNode, innNode]} // inn listed second in source
        getNodeStatus={(n) =>
          n.nodeType === 'INN' ? 'completed' : 'available'
        }
      />
    );

    const cards = screen.getAllByText(/INN First|Standard After/);
    expect(cards[0]).toHaveTextContent('INN First');
    expect(cards[1]).toHaveTextContent('Standard After');
  });

  it('places buffed node before unbuffed node', () => {
    const buffed = makeNode('b1', {
      title: 'Buffed Task',
      objective: { appliedBuff: { reduction: 0.2, buffName: 'Speed' } },
    });
    const unbuffed = makeNode('u1', { title: 'Unbuffed Task' });

    render(
      <AvailableTasksStrip
        {...baseProps}
        nodes={[unbuffed, buffed]} // unbuffed first in source
        getNodeStatus={() => 'available'}
      />
    );

    const cards = screen.getAllByText(/Buffed Task|Unbuffed Task/);
    expect(cards[0]).toHaveTextContent('Buffed Task');
    expect(cards[1]).toHaveTextContent('Unbuffed Task');
  });
});
