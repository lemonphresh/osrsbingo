// organisms/TreasureHunt/AdminChecklist.test.jsx
// Tests for AdminLaunchChecklist — checks logic, progress, and null guard.

import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminLaunchChecklist from './AdminChecklist';

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
    Icon: () => null,
    IconButton: ({ 'aria-label': label, onClick }) =>
      React.createElement('button', { 'aria-label': label, onClick }),
    Badge: make('span'),
    Button: ({ children, onClick, isDisabled, isLoading }) =>
      React.createElement(
        'button',
        { onClick, disabled: isDisabled || isLoading },
        children
      ),
    Collapse: ({ in: isIn, children }) =>
      isIn ? React.createElement('div', null, children) : null,
    Progress: ({ value }) =>
      React.createElement('div', { role: 'progressbar', 'aria-valuenow': value }),
    Tooltip: ({ children }) => React.createElement('div', null, children),
    Alert: make('div'),
    AlertIcon: () => null,
  };
});

jest.mock('@chakra-ui/icons', () => ({
  CheckCircleIcon: () => null,
  ChevronUpIcon: () => null,
  ChevronDownIcon: () => null,
  InfoIcon: () => null,
  WarningIcon: () => null,
}));

jest.mock('react-icons/fa', () => ({
  FaRocket: () => null,
  FaMap: () => null,
  FaUsers: () => null,
  FaDiscord: () => null,
  FaCalendarCheck: () => null,
  FaUserFriends: () => null,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeEvent = (overrides = {}) => ({
  status: 'DRAFT',
  nodes: [],
  teams: [],
  eventConfig: { num_of_teams: 2, players_per_team: 1 },
  discordConfig: { confirmed: false, guildId: null },
  startDate: null,
  endDate: null,
  ...overrides,
});

const noop = jest.fn();

// ── null guard ────────────────────────────────────────────────────────────────

describe('null guard', () => {
  it('returns null for null event', () => {
    const { container } = render(<AdminLaunchChecklist event={null} onLaunchEvent={noop} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null for PUBLIC event', () => {
    const { container } = render(
      <AdminLaunchChecklist event={makeEvent({ status: 'PUBLIC' })} onLaunchEvent={noop} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('returns null for COMPLETED event', () => {
    const { container } = render(
      <AdminLaunchChecklist event={makeEvent({ status: 'COMPLETED' })} onLaunchEvent={noop} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders for DRAFT event', () => {
    render(<AdminLaunchChecklist event={makeEvent()} onLaunchEvent={noop} />);
    expect(screen.getByText('Launch Checklist')).toBeInTheDocument();
  });
});

// ── Map check ─────────────────────────────────────────────────────────────────

describe('map check', () => {
  it('shows "Create the treasure map" when nodes is empty', () => {
    render(<AdminLaunchChecklist event={makeEvent({ nodes: [] })} onLaunchEvent={noop} />);
    expect(screen.getByText('Create the treasure map')).toBeInTheDocument();
  });

  it('shows node count when nodes exist', () => {
    const event = makeEvent({
      nodes: [{ nodeId: 'n1' }, { nodeId: 'n2' }, { nodeId: 'n3' }],
    });
    render(<AdminLaunchChecklist event={event} onLaunchEvent={noop} />);
    expect(screen.getByText('3 nodes created')).toBeInTheDocument();
  });
});

// ── Teams check ───────────────────────────────────────────────────────────────

describe('teams check', () => {
  it('shows team shortfall description when not enough teams', () => {
    const event = makeEvent({
      teams: [{ teamId: 't1', members: [{ discordUserId: 'u1' }] }],
      eventConfig: { num_of_teams: 2, players_per_team: 1 },
    });
    render(<AdminLaunchChecklist event={event} onLaunchEvent={noop} />);
    expect(screen.getByText(/1\/2 teams/)).toBeInTheDocument();
    expect(screen.getByText(/need 1 more/)).toBeInTheDocument();
  });

  it('shows success description when team requirement met', () => {
    const event = makeEvent({
      teams: [
        { teamId: 't1', members: [{ discordUserId: 'u1' }] },
        { teamId: 't2', members: [{ discordUserId: 'u2' }] },
      ],
      eventConfig: { num_of_teams: 2, players_per_team: 1 },
    });
    render(<AdminLaunchChecklist event={event} onLaunchEvent={noop} />);
    expect(screen.getByText(/2\/2 minimum teams created/)).toBeInTheDocument();
  });

  it('uses numberOfTeams fallback when eventConfig absent', () => {
    const event = {
      ...makeEvent(),
      eventConfig: null,
      numberOfTeams: 3,
      teams: [{ teamId: 't1', members: [{ discordUserId: 'u1' }] }],
    };
    render(<AdminLaunchChecklist event={event} onLaunchEvent={noop} />);
    expect(screen.getByText(/1\/3 teams/)).toBeInTheDocument();
  });
});

// ── Discord check ─────────────────────────────────────────────────────────────

describe('discord check', () => {
  it('shows "Connect and verify Discord bot" when not configured', () => {
    render(<AdminLaunchChecklist event={makeEvent()} onLaunchEvent={noop} />);
    expect(screen.getByText('Connect and verify Discord bot')).toBeInTheDocument();
  });

  it('shows connected description when discord is confirmed', () => {
    const event = makeEvent({
      discordConfig: { confirmed: true, guildId: '987654321012345678' },
    });
    render(<AdminLaunchChecklist event={event} onLaunchEvent={noop} />);
    expect(screen.getByText('Bot verified & connected ✓')).toBeInTheDocument();
  });

  it('shows not-done when confirmed=true but guildId missing', () => {
    const event = makeEvent({
      discordConfig: { confirmed: true, guildId: null },
    });
    render(<AdminLaunchChecklist event={event} onLaunchEvent={noop} />);
    expect(screen.getByText('Connect and verify Discord bot')).toBeInTheDocument();
  });
});

// ── Dates check ───────────────────────────────────────────────────────────────

describe('dates check', () => {
  it('shows "Set start and end dates" when dates missing', () => {
    render(<AdminLaunchChecklist event={makeEvent()} onLaunchEvent={noop} />);
    expect(screen.getByText('Set start and end dates')).toBeInTheDocument();
  });

  it('shows formatted dates when both are set', () => {
    const event = makeEvent({
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-31T00:00:00.000Z',
    });
    render(<AdminLaunchChecklist event={event} onLaunchEvent={noop} />);
    // Should NOT show the empty prompt
    expect(screen.queryByText('Set start and end dates')).not.toBeInTheDocument();
  });
});

// ── Launch button ─────────────────────────────────────────────────────────────

describe('launch button', () => {
  it('is disabled when checks are incomplete', () => {
    render(<AdminLaunchChecklist event={makeEvent()} onLaunchEvent={noop} />);
    const btn = screen.getByText(/Complete All Steps to Launch/i);
    expect(btn.closest('button')).toBeDisabled();
  });

  it('is enabled and shows launch text when all checks pass', () => {
    const event = makeEvent({
      nodes: [{ nodeId: 'n1' }],
      teams: [
        { teamId: 't1', members: [{ discordUserId: 'u1' }] },
        { teamId: 't2', members: [{ discordUserId: 'u2' }] },
      ],
      eventConfig: { num_of_teams: 2, players_per_team: 1 },
      discordConfig: { confirmed: true, guildId: '123456789012345678' },
      startDate: '2025-01-01T00:00:00.000Z',
      endDate: '2025-01-31T00:00:00.000Z',
    });
    render(<AdminLaunchChecklist event={event} onLaunchEvent={noop} />);
    const btn = screen.getByText('Launch Event! 🎉');
    expect(btn.closest('button')).not.toBeDisabled();
  });
});

// ── allTeamsHaveEnoughMembers check ───────────────────────────────────────────

describe('teamMembers check', () => {
  it('shows insufficient members message when team is short', () => {
    const event = makeEvent({
      teams: [
        { teamId: 't1', members: [] },
        { teamId: 't2', members: [{ discordUserId: 'u2' }] },
      ],
      eventConfig: { num_of_teams: 2, players_per_team: 1 },
    });
    render(<AdminLaunchChecklist event={event} onLaunchEvent={noop} />);
    expect(screen.getByText(/1 team\(s\) need more members/)).toBeInTheDocument();
  });

  it('shows success when all teams have enough members', () => {
    const event = makeEvent({
      teams: [
        { teamId: 't1', members: [{ discordUserId: 'u1' }] },
        { teamId: 't2', members: [{ discordUserId: 'u2' }] },
      ],
      eventConfig: { num_of_teams: 2, players_per_team: 1 },
    });
    render(<AdminLaunchChecklist event={event} onLaunchEvent={noop} />);
    expect(screen.getByText(/All teams have 1\+ members/)).toBeInTheDocument();
  });
});
