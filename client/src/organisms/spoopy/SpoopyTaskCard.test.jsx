import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const passthrough = (tag) => ({ children, ...props }) =>
    React.createElement(tag, props, children);
  return {
    Box: passthrough('div'),
    VStack: passthrough('div'),
    HStack: passthrough('div'),
    Text: passthrough('span'),
    Badge: passthrough('span'),
    Wrap: passthrough('div'),
    WrapItem: passthrough('div'),
  };
});

// Stub out the content registry hook so uniques tasks don't fetch over the
// network (which would 404 in jsdom). Returning empty collections means the
// AcceptableUniquesDrops component renders nothing — fine for these tests
// since they don't assert on the drop list.
jest.mock('../../hooks/useContentRegistry', () => ({
  __esModule: true,
  default: () => ({ soloBosses: {}, raids: {}, minigames: {}, skills: {} }),
}));

import SpoopyTaskCard, { taskLine } from './SpoopyTaskCard';

describe('taskLine formatter', () => {
  test('skilling_xp humanizes snake_case target', () => {
    // Snake_case keys are title-cased, so "firemaking" renders as "Firemaking"
    // (and compound keys like "giant_mole" render as "Giant Mole") — matches
    // what players see on the actual tile card.
    expect(taskLine({ kind: 'skilling_xp', target: 'firemaking', amount: 100000 }))
      .toMatch(/100,000 xp.*Firemaking/);
  });

  test('boss_kc humanizes boss target', () => {
    expect(taskLine({ kind: 'boss_kc', target: 'zulrah', amount: 10 })).toMatch(/10× kc.*Zulrah/);
  });

  test('uniques singularizes label when amount is 1', () => {
    // "1× unique" (singular) when amount is 1, "N× uniques" (plural) otherwise.
    expect(taskLine({ kind: 'uniques', target: 'nex', amount: 1 })).toMatch(/1× unique:.*Nex/);
  });

  test('uniques pluralizes label when amount is >1', () => {
    expect(taskLine({ kind: 'uniques', target: 'nex', amount: 3 })).toMatch(/3× uniques:.*Nex/);
  });

  test('custom task keeps author-written target verbatim', () => {
    // Custom targets with uppercase or whitespace are left untouched so
    // "f2p Castle Wars KO" doesn't get mangled into "f2p Castle Wars Ko".
    expect(taskLine({ kind: 'custom', target: 'f2p Castle Wars KO', amount: 1 }))
      .toBe('1× f2p Castle Wars KO');
  });

  test('null task returns em dash', () => {
    expect(taskLine(null)).toBe('—');
  });
});

describe('SpoopyTaskCard', () => {
  test('renders formatted task line', () => {
    render(<SpoopyTaskCard task={{ kind: 'skilling_xp', target: 'cooking', amount: 50000 }} />);
    expect(screen.getByText(/50,000 xp.*Cooking/)).toBeInTheDocument();
  });

  test('does not render any gp amount', () => {
    // reward_gp display was intentionally stripped: real payout is derived
    // from the event's prize pool / team pool allocation / house count split,
    // and surfacing a per-tile gp number on the card was misleading.
    render(
      <SpoopyTaskCard task={{ kind: 'boss_kc', target: 'zulrah', amount: 5 }} />,
    );
    expect(screen.queryByText(/gp/i)).not.toBeInTheDocument();
  });

  test('renders flavor text when provided', () => {
    render(
      <SpoopyTaskCard
        task={{ kind: 'boss_kc', target: 'zulrah', amount: 5 }}
        flavorText="scary snakes"
      />,
    );
    expect(screen.getByText('scary snakes')).toBeInTheDocument();
  });

  test('shows status badge', () => {
    render(
      <SpoopyTaskCard task={{ kind: 'skilling_xp', target: 'fishing', amount: 1 }} status="submitted" />,
    );
    expect(screen.getByText('awaiting')).toBeInTheDocument();
  });

  test('renders custom actions node', () => {
    render(
      <SpoopyTaskCard
        task={{ kind: 'skilling_xp', target: 'fishing', amount: 1 }}
        actions={<div>submit-btn</div>}
      />,
    );
    expect(screen.getByText('submit-btn')).toBeInTheDocument();
  });
});
