// organisms/GielinorRush/GRBuffApplicationModal.test.jsx
// Tests for GRBuffApplicationModal — calculateReduction, applicableBuffs filter, rendering.

import React from 'react';
import { render, screen } from '@testing-library/react';
import BuffApplicationModal from './GRBuffApplicationModal';

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
    ModalFooter: make('div'),
    ModalCloseButton: () => null,
    VStack: make('div'),
    HStack: make('div'),
    Text: make('span'),
    Button: ({ children, onClick, isDisabled, isLoading }) =>
      React.createElement('button', { onClick, disabled: isDisabled || isLoading }, children),
    Box: make('div'),
    Badge: make('span'),
    Divider: () => React.createElement('hr'),
    Radio: ({ value }) => React.createElement('input', { type: 'radio', value }),
    RadioGroup: ({ children }) => React.createElement('div', null, children),
    Alert: make('div'),
    AlertIcon: () => null,
    useColorMode: () => ({ colorMode: 'dark' }),
  };
});

jest.mock('../../utils/grHelpers', () => ({
  OBJECTIVE_TYPES: {
    boss_kc: 'Boss Kill Count',
    xp_gain: 'XP Gain',
    item_collection: 'Item Collection',
  },
}));

// ── Pure-function extraction ───────────────────────────────────────────────────

const calculateReduction = (objective, selectedBuff) => {
  if (!selectedBuff) return null;
  const original = objective.quantity;
  const reduced = Math.ceil(original * (1 - selectedBuff.reduction));
  const saved = original - reduced;
  return { original, reduced, saved };
};

const getApplicableBuffs = (availableBuffs, objective) =>
  availableBuffs.filter((buff) => {
    if (!buff.objectiveTypes.includes(objective.type)) return false;
    const reduced = Math.ceil(objective.quantity * (1 - buff.reduction));
    return Number(reduced.toFixed(0)) !== 0;
  });

const getBuffIcon = (buffType) => {
  if (buffType.includes('kill_reduction')) return '⚔️';
  if (buffType.includes('xp_reduction')) return '📚';
  if (buffType.includes('item_reduction')) return '📦';
  if (buffType.includes('universal')) return '✨';
  if (buffType.includes('multi_use')) return '🔄';
  return '🎁';
};

// ── calculateReduction ────────────────────────────────────────────────────────

describe('calculateReduction', () => {
  const objective = { quantity: 100 };

  it('returns null when no buff selected', () => {
    expect(calculateReduction(objective, null)).toBeNull();
  });

  it('25% reduction on 100 → reduced=75, saved=25', () => {
    const result = calculateReduction(objective, { reduction: 0.25 });
    expect(result.original).toBe(100);
    expect(result.reduced).toBe(75);
    expect(result.saved).toBe(25);
  });

  it('50% reduction on 100 → reduced=50, saved=50', () => {
    const result = calculateReduction(objective, { reduction: 0.5 });
    expect(result.reduced).toBe(50);
    expect(result.saved).toBe(50);
  });

  it('75% reduction on 100 → reduced=25, saved=75', () => {
    const result = calculateReduction(objective, { reduction: 0.75 });
    expect(result.reduced).toBe(25);
    expect(result.saved).toBe(75);
  });

  it('uses Math.ceil — 25% of 7 → ceil(7*0.75)=6, saved=1', () => {
    const result = calculateReduction({ quantity: 7 }, { reduction: 0.25 });
    expect(result.reduced).toBe(6); // Math.ceil(7 * 0.75) = Math.ceil(5.25) = 6
    expect(result.saved).toBe(1);
  });

  it('50% of 3 → ceil(3*0.5)=2, saved=1', () => {
    const result = calculateReduction({ quantity: 3 }, { reduction: 0.5 });
    expect(result.reduced).toBe(2);
    expect(result.saved).toBe(1);
  });
});

// ── getApplicableBuffs filter ─────────────────────────────────────────────────

describe('getApplicableBuffs', () => {
  const boss_kc_objective = { type: 'boss_kc', quantity: 50 };

  const kcBuff = { buffId: 'kc1', buffType: 'kill_reduction', objectiveTypes: ['boss_kc'], reduction: 0.25 };
  const xpBuff = { buffId: 'xp1', buffType: 'xp_reduction', objectiveTypes: ['xp_gain'], reduction: 0.5 };
  const universalBuff = { buffId: 'u1', buffType: 'universal', objectiveTypes: ['boss_kc', 'xp_gain'], reduction: 0.5 };

  it('includes buffs matching the objective type', () => {
    const result = getApplicableBuffs([kcBuff, xpBuff], boss_kc_objective);
    expect(result).toHaveLength(1);
    expect(result[0].buffId).toBe('kc1');
  });

  it('includes universal buffs that match the objective type', () => {
    const result = getApplicableBuffs([universalBuff, xpBuff], boss_kc_objective);
    expect(result).toHaveLength(1);
    expect(result[0].buffId).toBe('u1');
  });

  it('excludes buffs for a different objective type', () => {
    const result = getApplicableBuffs([xpBuff], boss_kc_objective);
    expect(result).toHaveLength(0);
  });

  it('excludes buffs where reduction would result in 0 remaining', () => {
    // quantity=1, reduction=1.0 → Math.ceil(1 * 0) = 0 → excluded
    const fullBuff = { buffId: 'full', buffType: 'kill_reduction', objectiveTypes: ['boss_kc'], reduction: 1.0 };
    const result = getApplicableBuffs([fullBuff], { type: 'boss_kc', quantity: 1 });
    expect(result).toHaveLength(0);
  });

  it('returns empty when availableBuffs is empty', () => {
    expect(getApplicableBuffs([], boss_kc_objective)).toHaveLength(0);
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

// ── Rendering ─────────────────────────────────────────────────────────────────

const makeNode = (overrides = {}) => ({
  nodeId: 'n1',
  title: 'Zulrah',
  status: 'available',
  objective: { type: 'boss_kc', quantity: 50, target: 'Zulrah' },
  ...overrides,
});

const makeBuff = (overrides = {}) => ({
  buffId: 'b1',
  buffName: 'Kill Boost',
  buffType: 'kill_reduction',
  reduction: 0.25,
  description: 'Reduces KC by 25%',
  objectiveTypes: ['boss_kc'],
  ...overrides,
});

const baseProps = {
  isOpen: true,
  onClose: jest.fn(),
  onApplyBuff: jest.fn(),
};

describe('null guard', () => {
  it('returns null when node is null', () => {
    const { container } = render(<BuffApplicationModal {...baseProps} node={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when node has no objective', () => {
    const { container } = render(
      <BuffApplicationModal {...baseProps} node={{ nodeId: 'n1', title: 'Test' }} />
    );
    expect(container.firstChild).toBeNull();
  });
});

describe('modal content', () => {
  it('shows header text', () => {
    render(
      <BuffApplicationModal {...baseProps} node={makeNode()} availableBuffs={[]} />
    );
    expect(screen.getByText('Apply Buff to Objective')).toBeInTheDocument();
  });

  it('shows "no buffs" alert when no applicable buffs', () => {
    render(
      <BuffApplicationModal {...baseProps} node={makeNode()} availableBuffs={[]} />
    );
    expect(screen.getByText(/No buffs available for this objective/)).toBeInTheDocument();
  });

  it('shows buff name when applicable buffs exist', () => {
    const buff = makeBuff({ buffName: 'Alpha Strike' });
    render(
      <BuffApplicationModal {...baseProps} node={makeNode()} availableBuffs={[buff]} />
    );
    expect(screen.getByText('Alpha Strike')).toBeInTheDocument();
  });

  it('shows current objective description', () => {
    render(
      <BuffApplicationModal {...baseProps} node={makeNode()} availableBuffs={[]} />
    );
    expect(screen.getByText(/Boss Kill Count: 50 Zulrah/)).toBeInTheDocument();
  });

  it('Apply Buff button is disabled when no buff selected (initial state)', () => {
    render(
      <BuffApplicationModal {...baseProps} node={makeNode()} availableBuffs={[makeBuff()]} />
    );
    const applyBtn = screen.getByText('Apply Buff');
    expect(applyBtn.closest('button')).toBeDisabled();
  });
});
