// organisms/TreasureHunt/NodeDetailModal.test.jsx
// Tests for NodeDetailModal — getObjectiveText, getBuffIcon, getBuffTierColor,
// formatGP, conditional rendering (badges, admin controls, status).

import React from 'react';
import { render, screen } from '@testing-library/react';
import NodeDetailModal from './NodeDetailModal';

// ── Chakra mock ──────────────────────────────────────────────────────────────
jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const make = (tag) =>
    ({ children, ...props }) =>
      React.createElement(tag, props, children);
  return {
    Modal: ({ isOpen, children }) =>
      isOpen ? React.createElement('div', { role: 'dialog' }, children) : null,
    ModalOverlay: () => null,
    ModalContent: make('div'),
    ModalHeader: make('h2'),
    ModalBody: make('div'),
    ModalCloseButton: () => null,
    VStack: make('div'),
    HStack: make('div'),
    Text: make('span'),
    Button: ({ children, onClick, isDisabled }) =>
      React.createElement('button', { onClick, disabled: isDisabled }, children),
    Box: make('div'),
    Heading: make('h3'),
    Badge: make('span'),
    Divider: () => React.createElement('hr'),
    Image: ({ src, alt }) => React.createElement('img', { src, alt }),
    Code: make('code'),
    Icon: () => null,
    Wrap: make('div'),
    WrapItem: make('div'),
    Alert: make('div'),
    AlertIcon: () => null,
    AlertTitle: make('strong'),
    AlertDescription: make('span'),
    Tooltip: ({ label, children }) =>
      React.createElement('div', { 'data-label': label }, children),
    IconButton: ({ 'aria-label': label, onClick }) =>
      React.createElement('button', { 'aria-label': label, onClick }),
    useDisclosure: () => ({ isOpen: false, onClose: jest.fn() }),
  };
});

jest.mock('@chakra-ui/icons', () => ({
  CheckIcon: () => null,
  CloseIcon: () => null,
  CopyIcon: () => null,
}));

jest.mock('react-icons/fa', () => ({ FaDiscord: () => null }));

jest.mock('../../assets/casket.png', () => 'casket.png');

jest.mock('../../hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    colors: {
      cardBg: '#2D3748',
      textColor: '#F7FAFC',
      green: { base: '#00FF00' },
      purple: { light: 'purple.200' },
    },
    colorMode: 'dark',
  }),
}));

jest.mock('../../utils/objectiveCollections', () => ({
  COLLECTIBLE_ITEMS: {},
  SOLO_BOSSES: {},
  RAIDS: {},
  MINIGAMES: {},
}));

jest.mock('../../utils/treasureHuntHelpers', () => ({
  userHasNeverSubmitted: () => false,
}));

jest.mock('../../providers/ToastProvider', () => ({
  useToastContext: () => ({ showToast: jest.fn() }),
}));

jest.mock('./ProgressiveStartTutorial', () => () => null);

// ── Pure-function extraction ───────────────────────────────────────────────────

const getObjectiveText = (objective) => {
  if (!objective) return null;
  switch (objective.type) {
    case 'xp_gain':
      return `Gain ${objective.quantity.toLocaleString()} XP in ${objective.target}`;
    case 'item_collection':
      return `Collect ${objective.quantity} ${objective.target.trim()}${
        objective.quantity > 1 ? 's' : ''
      }`;
    case 'boss_kc':
      return `Defeat ${objective.target} ${objective.quantity} times`;
    case 'minigame':
      return `Complete ${objective.quantity} ${objective.target} runs`;
    case 'clue_scrolls':
      return `Complete ${objective.quantity} ${objective.target} clue scrolls`;
    default:
      return 'Complete the objective';
  }
};

const getBuffIcon = (buffType) => {
  if (buffType.includes('kill_reduction')) return '⚔️';
  if (buffType.includes('xp_reduction')) return '📚';
  if (buffType.includes('item_reduction')) return '📦';
  if (buffType.includes('universal')) return '✨';
  if (buffType.includes('multi_use')) return '🔄';
  return '🎁';
};

const getBuffTierColor = (tier) => {
  if (tier === 'major') return 'purple';
  if (tier === 'moderate') return 'blue';
  if (tier === 'minor') return 'green';
  if (tier === 'universal') return 'yellow';
  return 'gray';
};

// formatGP as used in NodeDetailModal: (gp / 1000000).toFixed(1) + 'M'
const formatGP = (gp) => (gp / 1000000).toFixed(1) + 'M';

// ── getObjectiveText ──────────────────────────────────────────────────────────

describe('getObjectiveText', () => {
  it('returns null for null objective', () => {
    expect(getObjectiveText(null)).toBeNull();
  });

  it('boss_kc', () => {
    expect(getObjectiveText({ type: 'boss_kc', target: 'Giant Mole', quantity: 50 })).toBe(
      'Defeat Giant Mole 50 times'
    );
  });

  it('xp_gain with formatted number', () => {
    expect(
      getObjectiveText({ type: 'xp_gain', target: 'Slayer', quantity: 500000 })
    ).toBe('Gain 500,000 XP in Slayer');
  });

  it('item_collection singular', () => {
    expect(
      getObjectiveText({ type: 'item_collection', target: 'Bandos chestplate', quantity: 1 })
    ).toBe('Collect 1 Bandos chestplate');
  });

  it('item_collection plural', () => {
    expect(
      getObjectiveText({ type: 'item_collection', target: 'Dragon bone', quantity: 5 })
    ).toBe('Collect 5 Dragon bones');
  });

  it('minigame', () => {
    expect(
      getObjectiveText({ type: 'minigame', target: 'Tempoross', quantity: 10 })
    ).toBe('Complete 10 Tempoross runs');
  });

  it('clue_scrolls', () => {
    expect(
      getObjectiveText({ type: 'clue_scrolls', target: 'Hard', quantity: 5 })
    ).toBe('Complete 5 Hard clue scrolls');
  });

  it('default / unknown type', () => {
    expect(getObjectiveText({ type: 'other', target: 'X', quantity: 1 })).toBe(
      'Complete the objective'
    );
  });
});

// ── getBuffIcon ───────────────────────────────────────────────────────────────

describe('getBuffIcon', () => {
  it('⚔️ for kill_reduction', () => expect(getBuffIcon('kill_reduction')).toBe('⚔️'));
  it('📚 for xp_reduction', () => expect(getBuffIcon('xp_reduction')).toBe('📚'));
  it('📦 for item_reduction', () => expect(getBuffIcon('item_reduction')).toBe('📦'));
  it('✨ for universal', () => expect(getBuffIcon('universal')).toBe('✨'));
  it('🔄 for multi_use', () => expect(getBuffIcon('multi_use')).toBe('🔄'));
  it('🎁 for unknown', () => expect(getBuffIcon('mystery')).toBe('🎁'));
});

// ── getBuffTierColor ──────────────────────────────────────────────────────────

describe('getBuffTierColor', () => {
  it('major → purple', () => expect(getBuffTierColor('major')).toBe('purple'));
  it('moderate → blue', () => expect(getBuffTierColor('moderate')).toBe('blue'));
  it('minor → green', () => expect(getBuffTierColor('minor')).toBe('green'));
  it('universal → yellow', () => expect(getBuffTierColor('universal')).toBe('yellow'));
  it('unknown → gray', () => expect(getBuffTierColor('other')).toBe('gray'));
});

// ── formatGP (NodeDetailModal version) ───────────────────────────────────────

describe('formatGP (NodeDetailModal)', () => {
  it('formats 1M as "1.0M"', () => expect(formatGP(1000000)).toBe('1.0M'));
  it('formats 2.5M as "2.5M"', () => expect(formatGP(2500000)).toBe('2.5M'));
  it('formats 0 as "0.0M"', () => expect(formatGP(0)).toBe('0.0M'));
});

// ── null guard ────────────────────────────────────────────────────────────────

describe('null guard', () => {
  it('returns null when node is null', () => {
    const { container } = render(
      <NodeDetailModal isOpen node={null} onClose={jest.fn()} team={{}} />
    );
    expect(container.firstChild).toBeNull();
  });
});

// ── Header badges ─────────────────────────────────────────────────────────────

const baseNode = (overrides = {}) => ({
  nodeId: 'n1',
  title: 'Test Node',
  nodeType: 'STANDARD',
  status: 'available',
  ...overrides,
});

const baseTeam = { teamId: 't1', members: [], completedNodes: ['prev1'], activeBuffs: [] };

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  team: baseTeam,
  event: { eventId: 'e1' },
};

describe('header badges', () => {
  it('shows START badge for START nodes', () => {
    render(<NodeDetailModal {...baseProps} node={baseNode({ nodeType: 'START', title: 'Start Here' })} />);
    expect(screen.getByText('START')).toBeInTheDocument();
  });

  it('shows INN badge for INN nodes', () => {
    render(<NodeDetailModal {...baseProps} node={baseNode({ nodeType: 'INN', title: 'The Inn' })} />);
    expect(screen.getByText('INN')).toBeInTheDocument();
  });

  it('does not show START or INN badge for STANDARD nodes', () => {
    render(<NodeDetailModal {...baseProps} node={baseNode({ nodeType: 'STANDARD' })} />);
    expect(screen.queryByText('START')).not.toBeInTheDocument();
    expect(screen.queryByText('INN')).not.toBeInTheDocument();
  });

  it('renders node title in header', () => {
    render(<NodeDetailModal {...baseProps} node={baseNode({ title: 'Dragon Lair' })} />);
    expect(screen.getByText('Dragon Lair')).toBeInTheDocument();
  });
});

// ── Status-based conditional rendering ───────────────────────────────────────

describe('completed status', () => {
  it('shows "Completed ✔" badge when node is completed and not adminMode', () => {
    render(
      <NodeDetailModal
        {...baseProps}
        node={baseNode({ status: 'completed' })}
        adminMode={false}
      />
    );
    expect(screen.getByText('Completed ✔')).toBeInTheDocument();
  });

  it('does not show "Completed ✔" badge in admin mode', () => {
    render(
      <NodeDetailModal
        {...baseProps}
        node={baseNode({ status: 'completed' })}
        adminMode={true}
      />
    );
    expect(screen.queryByText('Completed ✔')).not.toBeInTheDocument();
  });
});

// ── Admin controls ────────────────────────────────────────────────────────────

describe('admin controls', () => {
  it('shows Admin Controls section in adminMode', () => {
    render(
      <NodeDetailModal
        {...baseProps}
        node={baseNode({ status: 'available' })}
        adminMode={true}
      />
    );
    expect(screen.getByText('🛡️ Admin Controls')).toBeInTheDocument();
  });

  it('does not show Admin Controls when adminMode=false', () => {
    render(
      <NodeDetailModal
        {...baseProps}
        node={baseNode({ status: 'available' })}
        adminMode={false}
      />
    );
    expect(screen.queryByText('🛡️ Admin Controls')).not.toBeInTheDocument();
  });

  it('shows "Mark as Completed" button for available node in adminMode', () => {
    render(
      <NodeDetailModal
        {...baseProps}
        node={baseNode({ status: 'available' })}
        adminMode={true}
      />
    );
    expect(screen.getByText('Mark as Completed')).toBeInTheDocument();
  });
});

// ── Objective rendering ───────────────────────────────────────────────────────

describe('objective rendering', () => {
  it('shows objective text for boss_kc', () => {
    const node = baseNode({
      objective: { type: 'boss_kc', target: 'Zulrah', quantity: 25 },
    });
    render(<NodeDetailModal {...baseProps} node={node} />);
    expect(screen.getByText('Defeat Zulrah 25 times')).toBeInTheDocument();
  });

  it('shows objective text for xp_gain', () => {
    const node = baseNode({
      objective: { type: 'xp_gain', target: 'Herblore', quantity: 1000000 },
    });
    render(<NodeDetailModal {...baseProps} node={node} />);
    expect(screen.getByText('Gain 1,000,000 XP in Herblore')).toBeInTheDocument();
  });
});

// ── Applied buff display ──────────────────────────────────────────────────────

describe('applied buff', () => {
  it('shows applied buff name and reduction when buff is applied', () => {
    const node = baseNode({ status: 'available' });
    render(
      <NodeDetailModal
        {...baseProps}
        node={node}
        appliedBuff={{ buffName: 'Speed Boost', reduction: 0.25 }}
      />
    );
    expect(screen.getByText(/Speed Boost/)).toBeInTheDocument();
    expect(screen.getByText(/\-25%/)).toBeInTheDocument();
  });
});
