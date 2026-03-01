// organisms/TreasureHunt/EventStatusBanner.test.jsx
// Tests for EventStatusBanner — statusConfig logic per event status.

import React from 'react';
import { render, screen } from '@testing-library/react';
import EventStatusBanner from './EventStatusBanner';

// ── Chakra mock ──────────────────────────────────────────────────────────────
jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const make = (tag) =>
    ({ children, ...props }) =>
      React.createElement(tag, props, children);
  return {
    Box: make('div'),
    HStack: make('div'),
    VStack: make('div'),
    Text: make('span'),
    Badge: make('span'),
    Icon: () => null,
    Progress: ({ value }) =>
      React.createElement('div', { role: 'progressbar', 'aria-valuenow': value }),
  };
});

jest.mock('@chakra-ui/icons', () => ({ LockIcon: () => null }));
jest.mock('react-icons/fa', () => ({
  FaFlagCheckered: () => null,
  FaArchive: () => null,
  FaClock: () => null,
  FaFire: () => null,
}));

jest.mock('../../utils/dateUtils', () => ({
  formatDisplayDateTime: (d) => `formatted:${new Date(d).toISOString()}`,
}));

// ── Date helpers ─────────────────────────────────────────────────────────────

// Dates that are definitely in the future from any test runner
const FUTURE_START = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
const FUTURE_END = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

// Dates that are definitely in the past
const PAST_START = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
const PAST_END = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

// Currently live: started in past, ends in future
const LIVE_START = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
const LIVE_END = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

// ── null / unknown guard ──────────────────────────────────────────────────────

describe('null guard', () => {
  it('returns null when event is null', () => {
    const { container } = render(<EventStatusBanner event={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null for unknown status', () => {
    const event = { status: 'UNKNOWN', startDate: FUTURE_START, endDate: FUTURE_END };
    const { container } = render(<EventStatusBanner event={event} />);
    expect(container.firstChild).toBeNull();
  });
});

// ── DRAFT ─────────────────────────────────────────────────────────────────────

describe('DRAFT status', () => {
  const event = { status: 'DRAFT', startDate: FUTURE_START, endDate: FUTURE_END };

  it('shows "DRAFT" label', () => {
    render(<EventStatusBanner event={event} />);
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
  });

  it('shows "Event Setup In Progress" title', () => {
    render(<EventStatusBanner event={event} />);
    expect(screen.getByText('Event Setup In Progress')).toBeInTheDocument();
  });

  it('shows admin subtitle for admins', () => {
    render(<EventStatusBanner event={event} isAdmin />);
    expect(
      screen.getByText('Complete the launch checklist to go live')
    ).toBeInTheDocument();
  });

  it('shows non-admin subtitle for regular users', () => {
    render(<EventStatusBanner event={event} isAdmin={false} />);
    expect(
      screen.getByText('This event is being prepared by organizers')
    ).toBeInTheDocument();
  });

  it('shows "Only visible to admins" badge for admins', () => {
    render(<EventStatusBanner event={event} isAdmin />);
    expect(screen.getByText('Only visible to admins')).toBeInTheDocument();
  });
});

// ── PUBLIC — not yet started ──────────────────────────────────────────────────

describe('PUBLIC status — not yet started', () => {
  const event = { status: 'PUBLIC', startDate: FUTURE_START, endDate: FUTURE_END };

  it('shows "STARTING SOON" label', () => {
    render(<EventStatusBanner event={event} />);
    expect(screen.getByText('STARTING SOON')).toBeInTheDocument();
  });

  it('shows "Starts in" in the title', () => {
    render(<EventStatusBanner event={event} />);
    expect(screen.getByText(/Starts in/)).toBeInTheDocument();
  });
});

// ── PUBLIC — live ─────────────────────────────────────────────────────────────

describe('PUBLIC status — live', () => {
  const event = { status: 'PUBLIC', startDate: LIVE_START, endDate: LIVE_END };

  it('shows "LIVE" label', () => {
    render(<EventStatusBanner event={event} />);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });

  it('shows "Event In Progress" when not ending soon', () => {
    render(<EventStatusBanner event={event} />);
    expect(screen.getByText('Event In Progress')).toBeInTheDocument();
  });

  it('shows countdown for remaining time', () => {
    render(<EventStatusBanner event={event} />);
    // countdown label shown alongside countdown value
    expect(screen.getByText('remaining')).toBeInTheDocument();
  });
});

// ── PUBLIC — ended (past end date, status not updated) ────────────────────────

describe('PUBLIC status — ended', () => {
  const event = { status: 'PUBLIC', startDate: PAST_START, endDate: PAST_END };

  it('shows "ENDED" label', () => {
    render(<EventStatusBanner event={event} />);
    expect(screen.getByText('ENDED')).toBeInTheDocument();
  });

  it('shows "Event Has Ended" title', () => {
    render(<EventStatusBanner event={event} />);
    expect(screen.getByText('Event Has Ended')).toBeInTheDocument();
  });

  it('shows "Update status to COMPLETED" admin badge', () => {
    render(<EventStatusBanner event={event} isAdmin />);
    expect(screen.getByText('Update status to COMPLETED')).toBeInTheDocument();
  });
});

// ── COMPLETED ─────────────────────────────────────────────────────────────────

describe('COMPLETED status', () => {
  const event = { status: 'COMPLETED', startDate: PAST_START, endDate: PAST_END };

  it('shows "COMPLETED" label', () => {
    render(<EventStatusBanner event={event} />);
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('shows "Event Finished" title', () => {
    render(<EventStatusBanner event={event} />);
    expect(screen.getByText('Event Finished')).toBeInTheDocument();
  });
});

// ── ARCHIVED ──────────────────────────────────────────────────────────────────

describe('ARCHIVED status', () => {
  const event = { status: 'ARCHIVED', startDate: PAST_START, endDate: PAST_END };

  it('shows "ARCHIVED" label', () => {
    render(<EventStatusBanner event={event} />);
    expect(screen.getByText('ARCHIVED')).toBeInTheDocument();
  });

  it('shows "Event Archived" title', () => {
    render(<EventStatusBanner event={event} />);
    expect(screen.getByText('Event Archived')).toBeInTheDocument();
  });

  it('shows "This event is no longer active" subtitle', () => {
    render(<EventStatusBanner event={event} />);
    expect(screen.getByText('This event is no longer active')).toBeInTheDocument();
  });
});

// ── formatCountdown (internal helper) — tested via output ─────────────────────

describe('formatCountdown logic', () => {
  it('shows days and hours when more than 24h remain', () => {
    // 2+ days from now
    render(
      <EventStatusBanner
        event={{ status: 'PUBLIC', startDate: FUTURE_START, endDate: FUTURE_END }}
      />
    );
    // At least one element contains a "Xd Yh" pattern (title + countdown widget)
    const elements = screen.getAllByText(/\d+d \d+h/);
    expect(elements.length).toBeGreaterThan(0);
  });
});
