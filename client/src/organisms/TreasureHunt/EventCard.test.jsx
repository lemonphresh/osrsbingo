// organisms/TreasureHunt/EventCard.test.jsx
// Tests for EventCard — getStatusColor logic and conditional spinner overlay.

import React from 'react';
import { render, screen } from '@testing-library/react';
import EventCard from './EventCard';

// ── Chakra mock ──────────────────────────────────────────────────────────────
jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const make = (tag) =>
    ({ children, ...props }) =>
      React.createElement(tag, props, children);
  return {
    Badge: ({ children, bg, ...props }) =>
      React.createElement('span', { 'data-bg': bg, ...props }, children),
    Box: make('div'),
    Card: make('div'),
    CardBody: make('div'),
    CardHeader: make('div'),
    Flex: make('div'),
    Heading: make('h2'),
    HStack: make('div'),
    IconButton: ({ 'aria-label': label }) =>
      React.createElement('button', { 'aria-label': label }),
    Image: ({ src, alt }) => React.createElement('img', { src, alt }),
    Menu: make('div'),
    MenuButton: ({ children }) => React.createElement('div', null, children),
    MenuItem: make('div'),
    MenuList: make('div'),
    Spinner: ({ 'data-testid': tid }) =>
      React.createElement('div', { 'data-testid': tid || 'spinner', role: 'status' }),
    Text: make('span'),
    VStack: make('div'),
  };
});

jest.mock('@chakra-ui/icons', () => ({ DeleteIcon: () => null }));
jest.mock('react-icons/md', () => ({ MdMoreVert: () => null }));
jest.mock('../../assets/gemoji.png', () => 'gemoji.png');
jest.mock('../../utils/dateUtils', () => ({
  formatDisplayDate: (d) => (d ? `date:${d}` : ''),
}));

// ── Color palette used by EventCard ──────────────────────────────────────────

const c = {
  green: { base: '#00FF00' },
  red: '#FF0000',
  turquoise: { base: '#00CED1' },
  purple: { base: '#800080' },
  sapphire: { base: '#0000FF' },
  cardBg: '#1A1A2E',
  textColor: '#FFFFFF',
};

const makeEvent = (overrides = {}) => ({
  eventId: 'evt1',
  eventName: 'Test Event',
  status: 'PUBLIC',
  startDate: '2025-01-01T00:00:00.000Z',
  endDate: '2025-03-31T00:00:00.000Z',
  teams: [],
  ...overrides,
});

const baseProps = {
  clickedEventId: null,
  colorMode: 'dark',
  c,
  isMobile: false,
  onDeleteClick: jest.fn(),
  onEventClick: jest.fn(),
};

// ── getStatusColor (tested through badge bg attribute) ────────────────────────

describe('getStatusColor', () => {
  it('assigns green background for PUBLIC status', () => {
    render(<EventCard event={makeEvent({ status: 'PUBLIC' })} {...baseProps} />);
    const badge = screen.getByText('PUBLIC');
    expect(badge.getAttribute('data-bg')).toBe(c.green.base);
  });

  it('assigns red background for DRAFT status', () => {
    render(<EventCard event={makeEvent({ status: 'DRAFT' })} {...baseProps} />);
    const badge = screen.getByText('DRAFT');
    expect(badge.getAttribute('data-bg')).toBe(c.red);
  });

  it('assigns turquoise background for COMPLETED status', () => {
    render(<EventCard event={makeEvent({ status: 'COMPLETED' })} {...baseProps} />);
    const badge = screen.getByText('COMPLETED');
    expect(badge.getAttribute('data-bg')).toBe(c.turquoise.base);
  });

  it('assigns purple background for ARCHIVED status', () => {
    render(<EventCard event={makeEvent({ status: 'ARCHIVED' })} {...baseProps} />);
    const badge = screen.getByText('ARCHIVED');
    expect(badge.getAttribute('data-bg')).toBe(c.purple.base);
  });

  it('falls back to sapphire for unknown status', () => {
    render(<EventCard event={makeEvent({ status: 'UNKNOWN' })} {...baseProps} />);
    const badge = screen.getByText('UNKNOWN');
    expect(badge.getAttribute('data-bg')).toBe(c.sapphire.base);
  });
});

// ── Loading spinner overlay ───────────────────────────────────────────────────

describe('loading spinner overlay', () => {
  it('does not show spinner when clickedEventId does not match', () => {
    render(<EventCard event={makeEvent()} {...baseProps} clickedEventId="other-id" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows spinner when clickedEventId matches the event', () => {
    render(<EventCard event={makeEvent({ eventId: 'evt1' })} {...baseProps} clickedEventId="evt1" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

// ── Basic content rendering ───────────────────────────────────────────────────

describe('content rendering', () => {
  it('renders the event name', () => {
    render(<EventCard event={makeEvent({ eventName: 'Grand Tournament' })} {...baseProps} />);
    expect(screen.getByText('Grand Tournament')).toBeInTheDocument();
  });

  it('renders formatted start and end dates', () => {
    render(
      <EventCard
        event={makeEvent({
          startDate: '2025-01-01T00:00:00.000Z',
          endDate: '2025-03-31T00:00:00.000Z',
        })}
        {...baseProps}
      />
    );
    expect(screen.getByText('date:2025-01-01T00:00:00.000Z')).toBeInTheDocument();
    expect(screen.getByText('date:2025-03-31T00:00:00.000Z')).toBeInTheDocument();
  });

  it('renders team count', () => {
    render(<EventCard event={makeEvent({ teams: [{}, {}, {}] })} {...baseProps} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
