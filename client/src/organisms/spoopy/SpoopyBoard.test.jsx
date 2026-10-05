import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockPlaySpoopySound = jest.fn();

jest.mock('../../utils/spoopy/spoopyAudio', () => ({
  playSpoopySound: (...args) => mockPlaySpoopySound(...args),
}));

jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const passthrough = (tag) => React.forwardRef(
    ({ children, as, onClick, sx, _hover, ...props }, ref) =>
      React.createElement(as || tag, { ref, onClick, ...props }, children),
  );
  return {
    Box: passthrough('div'),
    HStack: passthrough('div'),
    Text: passthrough('span'),
    Icon: ({ as: AsIcon, ...props }) =>
      React.createElement('span', { 'data-icon': AsIcon?.displayName || 'icon', ...props }),
    IconButton: ({ 'aria-label': ariaLabel, icon, onClick }) =>
      React.createElement('button', { 'aria-label': ariaLabel, onClick }, icon),
    Tooltip: ({ children }) => children,
    Slider: ({ children, onChange, value }) =>
      React.createElement(
        'div',
        null,
        React.createElement('input', {
          type: 'range',
          value,
          onChange: (e) => onChange?.(Number(e.target.value)),
        }),
        children
      ),
    SliderTrack: passthrough('div'),
    SliderFilledTrack: passthrough('div'),
    SliderThumb: passthrough('div'),
  };
});

jest.mock('react-icons/fa', () => ({
  FaHome: () => null,
  FaCamera: () => null,
  FaMoon: () => null,
  FaSun: () => null,
  FaSearchMinus: () => null,
  FaSearchPlus: () => null,
}));

jest.mock('../../assets/spoopy/house.webp',         () => 'house.webp',       { virtual: true });
jest.mock('../../assets/spoopy/pumpkin.webp',       () => 'pumpkin.webp',     { virtual: true });
jest.mock('../../assets/spoopy/grave.webp',         () => 'grave.webp',       { virtual: true });
jest.mock('../../assets/spoopy/ghost.webp',         () => 'ghost.webp',       { virtual: true });
jest.mock('../../assets/spoopy/black_cat.webp',     () => 'black_cat.webp',   { virtual: true });
jest.mock('../../assets/spoopy/bag_of_sweets.webp', () => 'bag_of_sweets.webp', { virtual: true });
jest.mock('../../assets/spoopy/pagedecor/flashlight.png', () => 'flashlight.png', { virtual: true });
jest.mock('../../assets/spoopy/pagedecor/lightbeam.png', () => 'lightbeam.png', { virtual: true });
jest.mock('../../assets/spoopy/pagedecor/skeleton-dance.gif', () => 'skeleton.gif', { virtual: true });
jest.mock('react-icons/gi', () => ({
  GiPumpkin: () => null,
  GiTombstone: () => null,
  GiGhost: () => null,
  GiHollowCat: () => null,
  GiSpookyHouse: () => null,
}));

import SpoopyBoard, { centerSpoopyBoardHorizontally } from './SpoopyBoard';

function firePointer(node, type, { pointerId, clientX, clientY, button = 0, pointerType }) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button,
    clientX,
    clientY,
  });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  if (pointerType) Object.defineProperty(event, 'pointerType', { value: pointerType });
  fireEvent(node, event);
}

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
  test('centers an overflowing board viewport horizontally', () => {
    const stage = { scrollWidth: 1200, clientWidth: 400, scrollLeft: 0 };
    centerSpoopyBoardHorizontally(stage);
    expect(stage.scrollLeft).toBe(400);
  });

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

  test('does not capture an ordinary tile tap as a board drag', () => {
    const handler = jest.fn();
    render(<SpoopyBoard board={boardFixture} teamState={teamState} onTileClick={handler} />);
    const tile = screen.getByLabelText(/trick or treat.*unlocked/i);
    const stage = screen.getByTestId('spoopy-board-stage');
    stage.setPointerCapture = jest.fn();
    stage.releasePointerCapture = jest.fn();

    firePointer(tile, 'pointerdown', { pointerId: 7, clientX: 100, clientY: 100 });
    firePointer(tile, 'pointerup', { pointerId: 7, clientX: 100, clientY: 100 });
    fireEvent.click(tile);

    expect(stage.setPointerCapture).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith('t-r0-c0');
  });

  test('captures only after movement crosses the drag threshold', () => {
    render(<SpoopyBoard board={boardFixture} teamState={teamState} onTileClick={() => {}} />);
    const tile = screen.getByLabelText(/trick or treat.*unlocked/i);
    const stage = screen.getByTestId('spoopy-board-stage');
    stage.setPointerCapture = jest.fn();
    stage.releasePointerCapture = jest.fn();

    firePointer(tile, 'pointerdown', { pointerId: 8, clientX: 100, clientY: 100 });
    firePointer(stage, 'pointermove', { pointerId: 8, clientX: 110, clientY: 100 });

    expect(stage.setPointerCapture).toHaveBeenCalledWith(8);
  });

  test('leaves touch panning to the native scroll container', () => {
    render(<SpoopyBoard board={boardFixture} teamState={teamState} onTileClick={() => {}} />);
    const stage = screen.getByTestId('spoopy-board-stage');
    stage.setPointerCapture = jest.fn();

    firePointer(stage, 'pointerdown', {
      pointerId: 9,
      pointerType: 'touch',
      clientX: 100,
      clientY: 100,
    });
    firePointer(stage, 'pointermove', {
      pointerId: 9,
      pointerType: 'touch',
      clientX: 140,
      clientY: 140,
    });

    expect(stage.setPointerCapture).not.toHaveBeenCalled();
    expect(stage.scrollLeft).toBe(0);
    expect(stage.scrollTop).toBe(0);
  });

  test('locked-tile click is a no-op', () => {
    const handler = jest.fn();
    render(<SpoopyBoard board={boardFixture} teamState={teamState} onTileClick={handler} />);
    fireEvent.click(screen.getByLabelText(/pumpkin.*locked/i));
    expect(handler).not.toHaveBeenCalled();
  });

  test('the flashlight toggles the beam and skeleton together', async () => {
    const { container } = render(<SpoopyBoard board={boardFixture} teamState={teamState} />);

    expect(screen.queryByAltText('flashlight beam')).not.toBeInTheDocument();
    expect(screen.queryByAltText('skeleton dancing')).not.toBeInTheDocument();

    fireEvent.click(container.querySelector('[aria-label="turn flashlight on"]'));

    expect(await screen.findByAltText('flashlight beam')).toBeInTheDocument();
    expect(screen.getByAltText('skeleton dancing')).toBeInTheDocument();
    expect(mockPlaySpoopySound).toHaveBeenLastCalledWith('flashlightClick');

    fireEvent.click(container.querySelector('[aria-label="turn flashlight off"]'));

    expect(screen.queryByAltText('flashlight beam')).not.toBeInTheDocument();
    expect(screen.queryByAltText('skeleton dancing')).not.toBeInTheDocument();
    expect(mockPlaySpoopySound).toHaveBeenCalledTimes(2);
  });

  test('renders gracefully with an empty board', () => {
    const empty = { dimensions: { rows: 0, cols: 0 }, tiles: [] };
    render(<SpoopyBoard board={empty} />);
    // Just proving no crash — nothing to assert visible-wise.
    expect(true).toBe(true);
  });
});
