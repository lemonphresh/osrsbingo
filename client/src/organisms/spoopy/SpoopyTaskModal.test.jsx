import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const passthrough = (tag) => ({ children, as, ...props }) =>
    React.createElement(as || tag, props, children);
  return {
    Box: passthrough('div'),
    VStack: passthrough('div'),
    HStack: passthrough('div'),
    Text: passthrough('span'),
    Heading: passthrough('h2'),
    Badge: passthrough('span'),
    Modal: ({ isOpen, children }) => (isOpen ? React.createElement('div', null, children) : null),
    ModalOverlay: passthrough('div'),
    ModalContent: passthrough('div'),
    ModalBody: passthrough('div'),
    ModalCloseButton: () => React.createElement('button', { 'aria-label': 'close' }),
    useClipboard: () => ({ onCopy: () => {}, hasCopied: false }),
  };
});

import SpoopyTaskModal from './SpoopyTaskModal';

const CONTENT = {
  id: 't-r5-c11',
  tile_type: 'pumpkin',
  flavor_text: 'a stray jack-o-lantern',
  task: { kind: 'skilling_xp', target: 'firemaking', amount: 100000 },
};

describe('SpoopyTaskModal', () => {
  test('renders nothing when closed', () => {
    const { container } = render(<SpoopyTaskModal isOpen={false} content={CONTENT} />);
    expect(container.textContent).toBe('');
  });

  test('renders task, flavor text, and discord submission hints', () => {
    render(
      <SpoopyTaskModal
        isOpen
        content={CONTENT}
        tileState={{ status: 'unlocked', progress: 40 }}
        tileType="pumpkin"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('a stray jack-o-lantern')).toBeInTheDocument();
    expect(screen.getByText(/100,000 xp.*firemaking/)).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText(/!spoopypre t-r5-c11/)).toBeInTheDocument();
    expect(screen.getByText(/!spoopysubmit t-r5-c11/)).toBeInTheDocument();
  });

  test('shows status badge derived from tileState.status', () => {
    render(
      <SpoopyTaskModal
        isOpen
        content={CONTENT}
        tileState={{ status: 'submitted', progress: 90 }}
        tileType="pumpkin"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/awaiting review/i)).toBeInTheDocument();
  });

  test('clamps progress display within 0-100', () => {
    const { rerender } = render(
      <SpoopyTaskModal isOpen content={CONTENT} tileState={{ progress: -5 }} tileType="pumpkin" onClose={() => {}} />,
    );
    expect(screen.getByText('0%')).toBeInTheDocument();

    rerender(
      <SpoopyTaskModal isOpen content={CONTENT} tileState={{ progress: 250 }} tileType="pumpkin" onClose={() => {}} />,
    );
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
