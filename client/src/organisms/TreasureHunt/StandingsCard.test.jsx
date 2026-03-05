// organisms/TreasureHunt/StandingsCard.test.jsx
// Tests for StandingsCard — isLeader, isOnTeam, progressPct logic.

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StandingsCard from './StandingsCard';

// ── Chakra mock ──────────────────────────────────────────────────────────────
jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const make = (tag) =>
    ({ children, ...props }) =>
      React.createElement(tag, props, children);
  return {
    Box: make('div'),
    Flex: make('div'),
    HStack: make('div'),
    VStack: make('div'),
    Text: make('span'),
    Badge: make('span'),
    Button: ({ children, onClick }) =>
      React.createElement('button', { onClick }, children),
    IconButton: ({ 'aria-label': label, onClick }) =>
      React.createElement('button', { 'aria-label': label, onClick }),
    Icon: () => null,
    CircularProgress: ({ value, children }) =>
      React.createElement('div', { 'data-value': value, role: 'progressbar' }, children),
    CircularProgressLabel: make('span'),
  };
});

jest.mock('@chakra-ui/icons', () => ({ EditIcon: () => null, CheckCircleIcon: () => null }));
jest.mock('react-icons/fa', () => ({
  FaCrown: () => null,
  FaCoins: () => null,
  FaMap: () => null,
}));
jest.mock('../../utils/treasureHuntHelpers', () => ({
  formatGP: (gp) => `${gp}gp`,
}));

// ── Test helpers ─────────────────────────────────────────────────────────────

const STANDARD = (id) => ({ nodeId: id, nodeType: 'STANDARD' });
const INN = (id) => ({ nodeId: id, nodeType: 'INN' });
const START = (id) => ({ nodeId: id, nodeType: 'START' });

const makeTeam = (overrides = {}) => ({
  teamId: 'team1',
  teamName: 'Dragon Slayers',
  currentPot: 100000,
  members: [],
  completedNodes: [],
  ...overrides,
});

const makeEvent = (nodes = []) => ({ eventId: 'evt1', nodes });

const currentColors = {
  textColor: '#fff',
  white: '#fff',
  turquoise: { base: '#00CED1' },
};

const baseProps = {
  index: 0,
  currentColors,
  colorMode: 'dark',
  onEditTeam: null,
  onTeamClick: jest.fn(),
  userDiscordId: null,
};

const wrap = (ui) => <MemoryRouter>{ui}</MemoryRouter>;

// ── isLeader ──────────────────────────────────────────────────────────────────

describe('isLeader', () => {
  it('shows Leader badge when index=0 and currentPot > 0', () => {
    render(
      wrap(
        <StandingsCard
          {...baseProps}
          index={0}
          team={makeTeam({ currentPot: 50000 })}
          event={makeEvent()}
        />
      )
    );
    expect(screen.getByText('Leader')).toBeInTheDocument();
  });

  it('does not show Leader badge when index > 0, even with pot', () => {
    render(
      wrap(
        <StandingsCard
          {...baseProps}
          index={1}
          team={makeTeam({ currentPot: 50000 })}
          event={makeEvent()}
        />
      )
    );
    expect(screen.queryByText('Leader')).not.toBeInTheDocument();
  });

  it('does not show Leader badge when index=0 but currentPot is 0', () => {
    render(
      wrap(
        <StandingsCard
          {...baseProps}
          index={0}
          team={makeTeam({ currentPot: 0 })}
          event={makeEvent()}
        />
      )
    );
    expect(screen.queryByText('Leader')).not.toBeInTheDocument();
  });

  it('does not show Leader badge when index=0 and currentPot is null', () => {
    render(
      wrap(
        <StandingsCard
          {...baseProps}
          index={0}
          team={makeTeam({ currentPot: null })}
          event={makeEvent()}
        />
      )
    );
    expect(screen.queryByText('Leader')).not.toBeInTheDocument();
  });
});

// ── isOnTeam ──────────────────────────────────────────────────────────────────

describe('isOnTeam', () => {
  const nodes = [STANDARD('n1'), STANDARD('n2'), STANDARD('n3')];

  it('shows "View Page" button when user is on the team', () => {
    const team = makeTeam({
      members: [{ discordUserId: 'user123' }],
      completedNodes: [],
    });
    render(
      wrap(
        <StandingsCard
          {...baseProps}
          team={team}
          event={makeEvent(nodes)}
          userDiscordId="user123"
        />
      )
    );
    expect(screen.getByText(/View Page/)).toBeInTheDocument();
  });

  it('does not show "View Page" button when user is not on the team (and no onEditTeam)', () => {
    const team = makeTeam({
      members: [{ discordUserId: 'otherUser' }],
    });
    render(
      wrap(
        <StandingsCard
          {...baseProps}
          team={team}
          event={makeEvent(nodes)}
          userDiscordId="user123"
          onEditTeam={null}
        />
      )
    );
    expect(screen.queryByText(/View Page/)).not.toBeInTheDocument();
  });

  it('shows "View Page" button when onEditTeam is provided (regardless of membership)', () => {
    const team = makeTeam({ members: [] });
    render(
      wrap(
        <StandingsCard
          {...baseProps}
          team={team}
          event={makeEvent(nodes)}
          userDiscordId="notOnTeam"
          onEditTeam={jest.fn()}
        />
      )
    );
    expect(screen.getByText(/View Page/)).toBeInTheDocument();
  });
});

// ── progressPct ───────────────────────────────────────────────────────────────

describe('progressPct calculation', () => {
  it('shows 100% progress when all computed nodes are completed', () => {
    // 3 STANDARD nodes → Math.round(3/3)=1 effective node + 0 INN + 0 START = 1 total
    // completedNodes = 1 → 100%
    const nodes = [STANDARD('n1'), STANDARD('n2'), STANDARD('n3')];
    const team = makeTeam({ completedNodes: ['n1'] });
    render(
      wrap(<StandingsCard {...baseProps} team={team} event={makeEvent(nodes)} />)
    );
    const progressBar = screen.getByRole('progressbar');
    expect(Number(progressBar.getAttribute('data-value'))).toBeCloseTo(100, 0);
  });

  it('shows 0% progress when no nodes completed', () => {
    const nodes = [STANDARD('n1'), STANDARD('n2'), STANDARD('n3')];
    const team = makeTeam({ completedNodes: [] });
    render(
      wrap(<StandingsCard {...baseProps} team={team} event={makeEvent(nodes)} />)
    );
    const progressBar = screen.getByRole('progressbar');
    expect(Number(progressBar.getAttribute('data-value'))).toBe(0);
  });

  it('INN nodes count toward totalNodes directly', () => {
    // 3 STANDARD + 1 INN → Math.round(3/3) + 1 = 2 total
    // completedNodes = 1 → 50%
    const nodes = [STANDARD('n1'), STANDARD('n2'), STANDARD('n3'), INN('inn1')];
    const team = makeTeam({ completedNodes: ['n1'] });
    render(
      wrap(<StandingsCard {...baseProps} team={team} event={makeEvent(nodes)} />)
    );
    const progressBar = screen.getByRole('progressbar');
    expect(Number(progressBar.getAttribute('data-value'))).toBeCloseTo(50, 0);
  });

  it('START nodes count toward totalNodes directly', () => {
    // 3 STANDARD + 1 START → Math.round(3/3) + 1 = 2 total
    const nodes = [STANDARD('n1'), STANDARD('n2'), STANDARD('n3'), START('start1')];
    const team = makeTeam({ completedNodes: ['start1'] });
    render(
      wrap(<StandingsCard {...baseProps} team={team} event={makeEvent(nodes)} />)
    );
    const progressBar = screen.getByRole('progressbar');
    expect(Number(progressBar.getAttribute('data-value'))).toBeCloseTo(50, 0);
  });
});

// ── Team name and GP rendering ────────────────────────────────────────────────

describe('content rendering', () => {
  it('renders team name', () => {
    render(
      wrap(
        <StandingsCard
          {...baseProps}
          team={makeTeam({ teamName: 'Iron Warriors' })}
          event={makeEvent()}
        />
      )
    );
    expect(screen.getByText('Iron Warriors')).toBeInTheDocument();
  });

  it('renders GP value via formatGP mock', () => {
    render(
      wrap(
        <StandingsCard
          {...baseProps}
          team={makeTeam({ currentPot: 250000 })}
          event={makeEvent()}
        />
      )
    );
    expect(screen.getByText('250000gp GP')).toBeInTheDocument();
  });

  it('renders rank number for non-leader', () => {
    render(
      wrap(
        <StandingsCard
          {...baseProps}
          index={2}
          team={makeTeam({ currentPot: 0 })}
          event={makeEvent()}
        />
      )
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
