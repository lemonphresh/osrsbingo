import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Chakra mock — pass-through primitives, keep only what SpoopyTile uses.
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

// react-icons/fa + gi mocks
jest.mock('react-icons/fa', () => ({
  FaHome: () => null,
}));
jest.mock('react-icons/gi', () => ({
  GiPumpkin: () => null,
  GiTombstone: () => null,
  GiGhost: () => null,
  GiHollowCat: () => null,
  GiCandyCanes: () => null,
}));

import SpoopyTile from './SpoopyTile';

describe('SpoopyTile', () => {
  test('renders with a tile type', () => {
    render(<SpoopyTile tileType="house" tileId="t-1" status="unlocked" />);
    expect(screen.getByLabelText(/trick or treat/i)).toBeInTheDocument();
  });

  test('locked tiles are not clickable and do not fire onClick', () => {
    const handler = jest.fn();
    render(<SpoopyTile tileType="pumpkin" tileId="p-1" status="locked" onClick={handler} />);
    const tile = screen.getByLabelText(/pumpkin.*locked/i);
    fireEvent.click(tile);
    expect(handler).not.toHaveBeenCalled();
  });

  test('unlocked tiles fire onClick', () => {
    const handler = jest.fn();
    render(<SpoopyTile tileType="ghost" tileId="g-1" status="unlocked" onClick={handler} />);
    fireEvent.click(screen.getByLabelText(/ghost.*unlocked/i));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('complete tiles show the check overlay', () => {
    const { container } = render(<SpoopyTile tileType="grave" tileId="gr-1" status="complete" />);
    expect(container.textContent).toContain('✓');
  });

  test('submitted tiles show the pending overlay', () => {
    const { container } = render(<SpoopyTile tileType="grave" tileId="gr-2" status="submitted" />);
    expect(container.textContent).toContain('…');
  });

  test('unknown tile types fall back gracefully to house metadata', () => {
    render(<SpoopyTile tileType="mystery" tileId="x-1" status="unlocked" />);
    expect(screen.getByLabelText(/trick or treat/i)).toBeInTheDocument();
  });

  test('accepts a custom aria label', () => {
    render(
      <SpoopyTile tileType="candybag" tileId="c-1" status="unlocked" ariaLabel="the haunted house" />,
    );
    expect(screen.getByLabelText('the haunted house')).toBeInTheDocument();
  });

  test('renders an assetSrc image when provided (real PNGs)', () => {
    const { container } = render(
      <SpoopyTile
        tileType="house"
        tileId="h-1"
        status="unlocked"
        assetSrc="/assets/spoopy/house.png"
      />,
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('/assets/spoopy/house.png');
  });
});
