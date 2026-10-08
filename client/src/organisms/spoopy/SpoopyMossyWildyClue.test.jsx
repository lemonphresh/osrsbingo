import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import SpoopyMossyWildyClue from './SpoopyMossyWildyClue';
import { getMossyWildyLocationName } from './spoopyMossyWildyLocations';

test('maps clue numbers to the ref-facing answer key', () => {
  expect(getMossyWildyLocationName(1)).toBe('Venenatis cave (level 36)');
  expect(getMossyWildyLocationName(12)).toBe('Lava Dragon Isle by the eggs (level 38)');
  expect(getMossyWildyLocationName(null)).toBeNull();
});

test('renders the assigned wilderness clue without revealing its answer', () => {
  render(
    <ChakraProvider>
      <SpoopyMossyWildyClue locationNumber={4} />
    </ChakraProvider>,
  );

  expect(screen.getByRole('img', { name: /wilderness location clue/i })).toBeInTheDocument();
  expect(screen.getByText(/identify this location/i)).toBeInTheDocument();
  expect(screen.queryByText(/rogue's castle/i)).not.toBeInTheDocument();
});

test('renders nothing when no clue is assigned', () => {
  render(
    <ChakraProvider>
      <SpoopyMossyWildyClue locationNumber={null} />
    </ChakraProvider>,
  );

  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});
