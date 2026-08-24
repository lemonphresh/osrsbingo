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
  };
});

import SpoopyTaskCard, { taskLine } from './SpoopyTaskCard';

describe('taskLine formatter', () => {
  test('skilling_xp formats amount and skill', () => {
    expect(taskLine({ kind: 'skilling_xp', target: 'firemaking', amount: 100000 }))
      .toMatch(/100,000 xp.*firemaking/);
  });

  test('boss_kc formats kc count and boss', () => {
    expect(taskLine({ kind: 'boss_kc', target: 'zulrah', amount: 10 })).toMatch(/10× kc.*zulrah/);
  });

  test('uniques formats target', () => {
    expect(taskLine({ kind: 'uniques', target: 'nex', amount: 1 })).toMatch(/1× uniques.*nex/);
  });

  test('null task returns em dash', () => {
    expect(taskLine(null)).toBe('—');
  });
});

describe('SpoopyTaskCard', () => {
  test('renders formatted task line', () => {
    render(<SpoopyTaskCard task={{ kind: 'skilling_xp', target: 'cooking', amount: 50000 }} />);
    expect(screen.getByText(/50,000 xp.*cooking/)).toBeInTheDocument();
  });

  test('renders reward gp when > 0', () => {
    render(
      <SpoopyTaskCard task={{ kind: 'boss_kc', target: 'zulrah', amount: 5 }} rewardGp={500000} />,
    );
    expect(screen.getByText(/\+500,000 gp/)).toBeInTheDocument();
  });

  test('does not render reward when 0', () => {
    render(
      <SpoopyTaskCard task={{ kind: 'boss_kc', target: 'zulrah', amount: 5 }} rewardGp={0} />,
    );
    expect(screen.queryByText(/gp/)).not.toBeInTheDocument();
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
