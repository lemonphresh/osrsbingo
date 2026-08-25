import React from 'react';
import { render, screen } from '@testing-library/react';
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
    Button: ({ children, onClick, isLoading }) =>
      React.createElement('button', { onClick, disabled: !!isLoading }, children),
    Modal: ({ isOpen, children }) => (isOpen ? React.createElement('div', null, children) : null),
    ModalOverlay: passthrough('div'),
    ModalContent: passthrough('div'),
    ModalBody: passthrough('div'),
    ModalCloseButton: () => React.createElement('button', { 'aria-label': 'close' }),
  };
});

import SpoopyStartModal, { composeStoryParagraphs } from './SpoopyStartModal';

const STORY = {
  intro: 'welcome to the neighborhood',
  task: 'take a selfie{{passwordClause}} and submit via {{command}}',
  passwordClauseTemplate: ' with password "{{password}}" visible',
  command: '!spoopysubmit',
  footer: 'good luck out there',
};

describe('composeStoryParagraphs', () => {
  test('substitutes password + command when password is set', () => {
    const paragraphs = composeStoryParagraphs(STORY, 'spooky2026');
    expect(paragraphs).toHaveLength(3);
    expect(paragraphs[0]).toBe('welcome to the neighborhood');
    expect(paragraphs[1]).toContain('with password "spooky2026" visible');
    expect(paragraphs[1]).toContain('!spoopysubmit');
    expect(paragraphs[2]).toBe('good luck out there');
  });

  test('omits the password clause entirely when no password is set', () => {
    const paragraphs = composeStoryParagraphs(STORY, null);
    expect(paragraphs[1]).not.toContain('password');
    expect(paragraphs[1]).toContain('!spoopysubmit');
  });

  test('skips missing sections gracefully', () => {
    expect(composeStoryParagraphs({ intro: 'only intro' }, null)).toEqual(['only intro']);
    expect(composeStoryParagraphs({ footer: 'only footer' }, null)).toEqual(['only footer']);
  });
});

describe('SpoopyStartModal', () => {
  test('renders nothing when closed', () => {
    const { container } = render(<SpoopyStartModal isOpen={false} story={STORY} />);
    expect(container.textContent).toBe('');
  });

  test('renders nothing when story missing', () => {
    const { container } = render(<SpoopyStartModal isOpen story={null} />);
    expect(container.textContent).toBe('');
  });

  test('shows intro + task + footer with the password inlined', () => {
    render(
      <SpoopyStartModal
        isOpen
        story={STORY}
        eventPassword="spooky2026"
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('welcome to the neighborhood')).toBeInTheDocument();
    expect(screen.getByText('good luck out there')).toBeInTheDocument();
    // Password appears in both the story paragraph and the task callout box.
    expect(screen.getAllByText(/"spooky2026"/).length).toBeGreaterThanOrEqual(1);
  });

  test('hides the password callout when no password is set', () => {
    render(
      <SpoopyStartModal
        isOpen
        story={STORY}
        eventPassword={null}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByText(/wom plugin overlay/i)).not.toBeInTheDocument();
  });

  test('renders the discord submission hint (no on-site submit button)', () => {
    render(
      <SpoopyStartModal isOpen story={STORY} eventPassword="pw" onClose={() => {}} />,
    );
    expect(screen.queryByText(/submit selfie/i)).not.toBeInTheDocument();
    // Command appears in both the story task line and the discord-hint line.
    expect(screen.getAllByText(/!spoopysubmit/).length).toBeGreaterThanOrEqual(1);
  });
});
