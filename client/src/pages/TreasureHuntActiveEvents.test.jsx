import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { MemoryRouter } from 'react-router-dom';
import TreasureHuntActiveEvents from './TreasureHuntActiveEvents';
import { GET_ALL_TREASURE_EVENTS } from '../graphql/queries';

// ─── Mock Chakra UI ───────────────────────────────────────────────────────────
// Chakra's color-mode provider crashes in jsdom; swap all components for simple
// HTML equivalents so tests focus on behaviour, not styling.
jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const div = (displayName) => {
    const C = React.forwardRef(({ children, ...rest }, ref) => {
      // Forward data-testid and role so queries still work
      const { 'data-testid': testId, role } = rest;
      return React.createElement('div', { ref, 'data-testid': testId, role }, children);
    });
    C.displayName = displayName;
    return C;
  };
  const span = (displayName) => {
    const C = React.forwardRef(({ children }, ref) =>
      React.createElement('span', { ref }, children)
    );
    C.displayName = displayName;
    return C;
  };

  return {
    Box: div('Box'),
    Flex: div('Flex'),
    VStack: div('VStack'),
    HStack: div('HStack'),
    SimpleGrid: div('SimpleGrid'),
    Skeleton: div('Skeleton'),
    SkeletonText: div('SkeletonText'),
    Text: span('Text'),
    Heading: ({ children, size, ...rest }) =>
      React.createElement('h2', rest, children),
    Image: ({ src, alt }) => React.createElement('img', { src, alt }),
    Spinner: () => React.createElement('div', { 'data-testid': 'spinner' }),
    Badge: ({ children }) => React.createElement('span', {}, children),
    ChakraProvider: ({ children }) => children,
    useColorModeValue: (light) => light,
  };
});

// ─── Mock GemTitle atom ───────────────────────────────────────────────────────
jest.mock('../atoms/GemTitle', () => ({ children }) => <span>{children}</span>);

// ─── Mock the gem image asset ─────────────────────────────────────────────────
jest.mock('../assets/gemoji.png', () => 'gemoji.png');

// ─── Wrapper ──────────────────────────────────────────────────────────────────
const Wrapper = ({ children, mocks }) => (
  <MockedProvider mocks={mocks} addTypename={false}>
    <MemoryRouter>{children}</MemoryRouter>
  </MockedProvider>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const hoursFromNow = (h) => new Date(Date.now() + h * 3600000).toISOString();

const makeEvent = (overrides = {}) => ({
  eventId: 'evt-1',
  eventName: 'Test Event',
  status: 'PUBLIC',
  startDate: hoursFromNow(-24),
  endDate: hoursFromNow(24),
  derivedValues: { max_reward_per_team: 1_000_000 },
  nodes: [],
  teams: [],
  ...overrides,
});

const mockQuery = (events) => ({
  request: { query: GET_ALL_TREASURE_EVENTS },
  result: { data: { getAllTreasureEvents: events } },
});

// ─── Section headings ─────────────────────────────────────────────────────────

describe('section headings', () => {
  it('always shows the "Live Now" heading', async () => {
    const mocks = [mockQuery([makeEvent()])];
    render(<TreasureHuntActiveEvents />, {
      wrapper: ({ children }) => <Wrapper mocks={mocks}>{children}</Wrapper>,
    });
    expect(await screen.findByText('Live Now')).toBeInTheDocument();
  });

  it('shows "Upcoming Events" when there is a PUBLIC event with a future startDate', async () => {
    const mocks = [mockQuery([makeEvent({ eventId: 'u1', startDate: hoursFromNow(48) })])];
    render(<TreasureHuntActiveEvents />, {
      wrapper: ({ children }) => <Wrapper mocks={mocks}>{children}</Wrapper>,
    });
    expect(await screen.findByText('Upcoming Events')).toBeInTheDocument();
  });

  it('shows "Past Events" for COMPLETED events', async () => {
    const mocks = [
      mockQuery([
        makeEvent({
          eventId: 'c1',
          status: 'COMPLETED',
          startDate: hoursFromNow(-72),
          endDate: hoursFromNow(-24),
        }),
      ]),
    ];
    render(<TreasureHuntActiveEvents />, {
      wrapper: ({ children }) => <Wrapper mocks={mocks}>{children}</Wrapper>,
    });
    expect(await screen.findByText('Past Events')).toBeInTheDocument();
  });
});

// ─── Live vs upcoming split ───────────────────────────────────────────────────

describe('live vs upcoming split', () => {
  const liveEvent = makeEvent({ eventId: 'live-1', eventName: 'Currently Live' });
  const upcomingEvent = makeEvent({
    eventId: 'upcoming-1',
    eventName: 'Starts Tomorrow',
    startDate: hoursFromNow(24),
  });
  const mocks = [mockQuery([liveEvent, upcomingEvent])];

  it('renders both Live Now and Upcoming Events sections when both exist', async () => {
    render(<TreasureHuntActiveEvents />, {
      wrapper: ({ children }) => <Wrapper mocks={mocks}>{children}</Wrapper>,
    });
    expect(await screen.findByText('Live Now')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Events')).toBeInTheDocument();
  });

  it('shows the LIVE badge for a started event and UPCOMING badge for a future one', async () => {
    render(<TreasureHuntActiveEvents />, {
      wrapper: ({ children }) => <Wrapper mocks={mocks}>{children}</Wrapper>,
    });
    await screen.findByText('Currently Live');
    expect(screen.getByText('LIVE')).toBeInTheDocument();
    expect(screen.getByText('UPCOMING')).toBeInTheDocument();
  });

  it('hides Upcoming Events section when all PUBLIC events have already started', async () => {
    const onlyLive = [mockQuery([liveEvent])];
    render(<TreasureHuntActiveEvents />, {
      wrapper: ({ children }) => <Wrapper mocks={onlyLive}>{children}</Wrapper>,
    });
    await screen.findByText('Live Now');
    expect(screen.queryByText('Upcoming Events')).not.toBeInTheDocument();
  });

  it('shows empty state under Live Now when only upcoming events exist', async () => {
    const onlyUpcoming = [mockQuery([upcomingEvent])];
    render(<TreasureHuntActiveEvents />, {
      wrapper: ({ children }) => <Wrapper mocks={onlyUpcoming}>{children}</Wrapper>,
    });
    await screen.findByText('Upcoming Events');
    expect(screen.getByText('No competitions underway')).toBeInTheDocument();
  });
});

// ─── Card badges ──────────────────────────────────────────────────────────────

describe('event card badges', () => {
  it('shows LIVE badge on a live event card', async () => {
    const mocks = [mockQuery([makeEvent({ eventId: 'live-badge' })])];
    render(<TreasureHuntActiveEvents />, {
      wrapper: ({ children }) => <Wrapper mocks={mocks}>{children}</Wrapper>,
    });
    expect(await screen.findByText('LIVE')).toBeInTheDocument();
  });

  it('shows UPCOMING badge on an upcoming event card', async () => {
    const mocks = [mockQuery([makeEvent({ eventId: 'up-badge', startDate: hoursFromNow(48) })])];
    render(<TreasureHuntActiveEvents />, {
      wrapper: ({ children }) => <Wrapper mocks={mocks}>{children}</Wrapper>,
    });
    expect(await screen.findByText('UPCOMING')).toBeInTheDocument();
  });

  it('shows COMPLETED badge on a completed event card', async () => {
    const mocks = [
      mockQuery([makeEvent({ eventId: 'done-badge', status: 'COMPLETED', endDate: hoursFromNow(-24) })]),
    ];
    render(<TreasureHuntActiveEvents />, {
      wrapper: ({ children }) => <Wrapper mocks={mocks}>{children}</Wrapper>,
    });
    expect(await screen.findByText('COMPLETED')).toBeInTheDocument();
  });
});

// ─── Empty state ──────────────────────────────────────────────────────────────

describe('empty state', () => {
  it('shows empty state message when there are no events', async () => {
    const mocks = [mockQuery([])];
    render(<TreasureHuntActiveEvents />, {
      wrapper: ({ children }) => <Wrapper mocks={mocks}>{children}</Wrapper>,
    });
    expect(await screen.findByText('No competitions underway')).toBeInTheDocument();
  });

  it('does not render Past Events or Upcoming Events sections when empty', async () => {
    const mocks = [mockQuery([])];
    render(<TreasureHuntActiveEvents />, {
      wrapper: ({ children }) => <Wrapper mocks={mocks}>{children}</Wrapper>,
    });
    await screen.findByText('No competitions underway');
    expect(screen.queryByText('Past Events')).not.toBeInTheDocument();
    expect(screen.queryByText('Upcoming Events')).not.toBeInTheDocument();
  });
});

// ─── Section counts ───────────────────────────────────────────────────────────

describe('section badge counts', () => {
  it('shows the correct live count in the badge next to Live Now', async () => {
    const mocks = [
      mockQuery([makeEvent({ eventId: 'a' }), makeEvent({ eventId: 'b', eventName: 'Event B' })]),
    ];
    render(<TreasureHuntActiveEvents />, {
      wrapper: ({ children }) => <Wrapper mocks={mocks}>{children}</Wrapper>,
    });
    await screen.findByText('Live Now');
    expect(screen.getByText('2 live')).toBeInTheDocument();
  });
});
