import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const passthrough = (tag) => ({ children, as, onClick, ...props }) =>
    React.createElement(as || tag, { onClick, ...props }, children);
  return {
    Box: passthrough('div'),
    VStack: passthrough('div'),
    HStack: passthrough('div'),
    Text: passthrough('span'),
    Heading: passthrough('h2'),
    Badge: passthrough('span'),
    Button: ({ children, onClick, isDisabled }) =>
      React.createElement('button', { onClick, disabled: isDisabled }, children),
    Modal: ({ isOpen, children }) => (isOpen ? React.createElement('div', null, children) : null),
    ModalOverlay: passthrough('div'),
    ModalContent: passthrough('div'),
    ModalBody: passthrough('div'),
    ModalCloseButton: () => React.createElement('button', { 'aria-label': 'close' }),
    useClipboard: () => ({ onCopy: () => {}, hasCopied: false }),
  };
});

import SpoopyHauntedHouseModal, { formatMsRemaining } from './SpoopyHauntedHouseModal';

describe('formatMsRemaining', () => {
  test('handles days + hours + minutes', () => {
    const ms = 2 * 86400000 + 3 * 3600000 + 15 * 60000;
    expect(formatMsRemaining(ms)).toBe('2d 3h 15m');
  });

  test('handles hours + minutes only', () => {
    expect(formatMsRemaining(3 * 3600000 + 12 * 60000)).toBe('3h 12m');
  });

  test('handles minutes only', () => {
    expect(formatMsRemaining(45 * 60000)).toBe('45m');
  });

  test('returns "curfew passed" for 0 or negative', () => {
    expect(formatMsRemaining(0)).toBe('curfew passed');
    expect(formatMsRemaining(-5000)).toBe('curfew passed');
  });
});

describe('SpoopyHauntedHouseModal', () => {
  test('renders nothing when closed', () => {
    const { container } = render(<SpoopyHauntedHouseModal isOpen={false} />);
    expect(container.textContent).toBe('');
  });

  test('stage 1 (gauntletLevel=0) shows !stepinside + the server dialog', () => {
    render(
      <SpoopyHauntedHouseModal
        isOpen
        gauntletLevel={0}
        warningDialog="you sure about this?"
        msRemaining={3600000}
        currentGp={1000000}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('you sure about this?')).toBeInTheDocument();
    expect(screen.getByText(/stage 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByText('!stepinside')).toBeInTheDocument();
    // 1,000,000 gp = 100 candies at the 10k:1 ratio.
    expect(screen.getByText(/100 candies/)).toBeInTheDocument();
    expect(screen.getByText(/1h 0m/)).toBeInTheDocument();
  });

  test('stage 2 (gauntletLevel=1) shows !imserious', () => {
    render(
      <SpoopyHauntedHouseModal
        isOpen
        gauntletLevel={1}
        currentGp={0}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/stage 2 of 3/i)).toBeInTheDocument();
    expect(screen.getByText('!imserious')).toBeInTheDocument();
  });

  test('stage 3 (gauntletLevel=2) shows !nogoingback', () => {
    render(
      <SpoopyHauntedHouseModal
        isOpen
        gauntletLevel={2}
        currentGp={0}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/stage 3 of 3/i)).toBeInTheDocument();
    expect(screen.getByText('!nogoingback')).toBeInTheDocument();
  });

  test('confirm (gauntletLevel>=3) reveals the bonus task and reward', () => {
    render(
      <SpoopyHauntedHouseModal
        isOpen
        gauntletLevel={3}
        bonusTask={{ kind: 'custom', target: 'group photo', amount: 1 }}
        bonusRewardGp={1000000}
        onSubmit={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/group photo/)).toBeInTheDocument();
    expect(screen.getByText(/\+1,000,000 gp/)).toBeInTheDocument();
  });

  test('confirm shows the discord submit commands when a tileId is present', () => {
    render(
      <SpoopyHauntedHouseModal
        isOpen
        gauntletLevel={3}
        tileId="t-r99-c99"
        bonusTask={{ kind: 'custom', target: 'photo', amount: 1 }}
        onSubmit={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/!spoopypre t-r99-c99/)).toBeInTheDocument();
    expect(screen.getByText(/!spoopysubmit t-r99-c99/)).toBeInTheDocument();
  });

  test('confirm close button fires onSubmit (parent uses it to close)', () => {
    const submit = jest.fn();
    render(
      <SpoopyHauntedHouseModal
        isOpen
        gauntletLevel={3}
        bonusTask={{ kind: 'custom', target: 'photo', amount: 1 }}
        onSubmit={submit}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByText(/^close$/i));
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
