import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Chakra mock — modal renders inline when open, nothing when closed.
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

import SpoopyTileDialog from './SpoopyTileDialog';

const dialog = {
  prompt: 'trick or treat!',
  options: {
    a: { label: 'be nice', outcome: 'treat', task: { kind: 'skilling_xp', target: 'firemaking', amount: 100 }, reward_gp: 500 },
    b: { label: 'be naughty', outcome: 'trick', task: { kind: 'boss_kc', target: 'callisto', amount: 5 }, reward_gp: 200 },
  },
};

describe('SpoopyTileDialog', () => {
  test('renders nothing when closed', () => {
    const { container } = render(<SpoopyTileDialog isOpen={false} dialog={dialog} />);
    expect(container.textContent).toBe('');
  });

  test('shows prompt + both option labels when open with no choice', () => {
    render(<SpoopyTileDialog isOpen dialog={dialog} onChoose={() => {}} onClose={() => {}} />);
    // "trick or treat" appears in both the heading and the prompt — use exact prompt text
    expect(screen.getByText('trick or treat!')).toBeInTheDocument();
    expect(screen.getByText('be nice')).toBeInTheDocument();
    expect(screen.getByText('be naughty')).toBeInTheDocument();
    expect(screen.getByText(/no take-backsies/i)).toBeInTheDocument();
  });

  test('shows discord commands and does not fire any handler when an option label is clicked', () => {
    // Options are now read-only cards — the actual choice is committed via
    // the Discord bot so the whole team can weigh in before locking anything.
    render(<SpoopyTileDialog isOpen dialog={dialog} tileId="t-r0-c0" onClose={() => {}} />);
    fireEvent.click(screen.getByText('be nice')); // should be a no-op
    expect(screen.getByText(/discuss with the gang/i)).toBeInTheDocument();
    expect(screen.getByText(/!spoopya t-r0-c0/)).toBeInTheDocument();
    expect(screen.getByText(/!spoopyb t-r0-c0/)).toBeInTheDocument();
  });

  test('hides options and shows the resolved task node when a choice is locked', () => {
    render(
      <SpoopyTileDialog
        isOpen
        dialog={dialog}
        choiceMade="a"
        onChoose={() => {}}
        onClose={() => {}}
        resolvedTaskNode={<div>the-task-card</div>}
      />,
    );
    // The option labels are still visible in the locked-in "option a" section,
    // but the "no take-backsies" hint disappears.
    expect(screen.queryByText(/no take-backsies/i)).not.toBeInTheDocument();
    expect(screen.getByText('the-task-card')).toBeInTheDocument();
  });

  test('shows the outcome badge for the locked choice (treat)', () => {
    render(
      <SpoopyTileDialog
        isOpen
        dialog={dialog}
        choiceMade="a"
        onChoose={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/🍬 treat/i)).toBeInTheDocument();
  });

  test('shows the outcome badge for the locked choice (trick)', () => {
    render(
      <SpoopyTileDialog
        isOpen
        dialog={dialog}
        choiceMade="b"
        onChoose={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/👻 trick/i)).toBeInTheDocument();
  });
});
