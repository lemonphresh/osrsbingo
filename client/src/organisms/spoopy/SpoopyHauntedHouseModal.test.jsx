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

  test('warning phase shows the server-supplied dialog', () => {
    render(
      <SpoopyHauntedHouseModal
        isOpen
        phase="warning"
        warningDialog="you sure about this?"
        msRemaining={3600000}
        currentGp={1000000}
        onProceed={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('you sure about this?')).toBeInTheDocument();
    expect(screen.getByText(/1,000,000 gp/)).toBeInTheDocument();
    expect(screen.getByText(/1h 0m/)).toBeInTheDocument();
  });

  test('warning phase fires onProceed', () => {
    const proceed = jest.fn();
    render(
      <SpoopyHauntedHouseModal
        isOpen
        phase="warning"
        warningDialog="hello"
        msRemaining={1000}
        currentGp={0}
        onProceed={proceed}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByText(/step inside/i));
    expect(proceed).toHaveBeenCalledTimes(1);
  });

  test('confirm phase reveals the bonus task and reward', () => {
    render(
      <SpoopyHauntedHouseModal
        isOpen
        phase="confirm"
        bonusTask={{ kind: 'custom', target: 'group photo', amount: 1 }}
        bonusRewardGp={1000000}
        onSubmit={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/group photo/)).toBeInTheDocument();
    expect(screen.getByText(/\+1,000,000 gp/)).toBeInTheDocument();
  });

  test('confirm phase fires onSubmit', () => {
    const submit = jest.fn();
    render(
      <SpoopyHauntedHouseModal
        isOpen
        phase="confirm"
        bonusTask={{ kind: 'custom', target: 'photo', amount: 1 }}
        onSubmit={submit}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByText(/submit proof/i));
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
