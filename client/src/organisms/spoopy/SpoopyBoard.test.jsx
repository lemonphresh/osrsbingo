import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const passthrough = (tag) => ({ children, as, onClick, sx, _hover, ...props }) =>
    React.createElement(as || tag, { onClick, ...props }, children);
  return {
    Box: passthrough('div'),
    Icon: ({ as: AsIcon, ...props }) =>
      React.createElement('span', { 'data-icon': AsIcon?.displayName || 'icon', ...props }),
  };
});

jest.mock('react-icons/fa', () => ({ FaHome: () => null, FaCamera: () => null }));

jest.mock('../../assets/spoopy/house.webp',         () => 'house.webp',       { virtual: true });
jest.mock('../../assets/spoopy/pumpkin.webp',       () => 'pumpkin.webp',     { virtual: true });
jest.mock('../../assets/spoopy/grave.webp',         () => 'grave.webp',       { virtual: true });
jest.mock('../../assets/spoopy/ghost.webp',         () => 'ghost.webp',       { virtual: true });
jest.mock('../../assets/spoopy/black_cat.webp',     () => 'black_cat.webp',   { virtual: true });
jest.mock('../../assets/spoopy/bag_of_sweets.webp', () => 'bag_of_sweets.webp', { virtual: true });
jest.mock('react-icons/gi', () => ({
  GiPumpkin: () => null,
  GiTombstone: () => null,
  GiGhost: () => null,
  GiHollowCat: () => null,
  GiSpookyHouse: () => null,
}));

import SpoopyBoard from './SpoopyBoard';

const boardFixture = {
  dimensions: { rows: 2, cols: 4 },
  candybagTileId: 't-r1-c3',
  tiles: [
    { id: 't-r0-c0', tile_type: 'house',    position: { row: 0, col: 0 }, neighbors: ['t-r0-c2'] },
    { id: 't-r0-c2', tile_type: 'pumpkin',  position: { row: 0, col: 2 }, neighbors: ['t-r0-c0'] },
    { id: 't-r1-c3', tile_type: 'candybag', position: { row: 1, col: 3 }, neighbors: [] },
  ],
  cells: [
    [{ kind: 'tile' }, { kind: 'connector' }, { kind: 'tile' }, { kind: 'empty' }],
    [{ kind: 'empty' }, { kind: 'empty' }, { kind: 'empty' }, { kind: 'tile' }],
  ],
};

const teamState = {
  tiles: {
    't-r0-c0': { status: 'unlocked' },
    't-r0-c2': { status: 'locked' },
    't-r1-c3': { status: 'locked' },
  },
};

describe('SpoopyBoard', () => {
  test('renders one sticker per real tile', () => {
    render(<SpoopyBoard board={boardFixture} teamState={teamState} />);
    expect(screen.getByLabelText(/trick or treat.*unlocked/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pumpkin.*locked/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/scary castle.*locked/i)).toBeInTheDocument();
  });

  test('defaults status to locked when teamState omits a tile', () => {
    render(<SpoopyBoard board={boardFixture} />);
    // No teamState — every tile should end up locked
    expect(screen.getByLabelText(/trick or treat.*locked/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pumpkin.*locked/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/scary castle.*locked/i)).toBeInTheDocument();
  });

  test('invokes onTileClick with the tile id for unlocked tiles', () => {
    const handler = jest.fn();
    render(<SpoopyBoard board={boardFixture} teamState={teamState} onTileClick={handler} />);
    fireEvent.click(screen.getByLabelText(/trick or treat.*unlocked/i));
    expect(handler).toHaveBeenCalledWith('t-r0-c0');
  });

  test('locked-tile click is a no-op', () => {
    const handler = jest.fn();
    render(<SpoopyBoard board={boardFixture} teamState={teamState} onTileClick={handler} />);
    fireEvent.click(screen.getByLabelText(/pumpkin.*locked/i));
    expect(handler).not.toHaveBeenCalled();
  });

  test('renders gracefully with an empty board', () => {
    const empty = { dimensions: { rows: 0, cols: 0 }, tiles: [] };
    render(<SpoopyBoard board={empty} />);
    // Just proving no crash — nothing to assert visible-wise.
    expect(true).toBe(true);
  });
});
