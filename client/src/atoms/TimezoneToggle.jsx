import React from 'react';
import { HStack, Text, Button, ButtonGroup } from '@chakra-ui/react';
import { useTimezone } from '../hooks/useTimezone';

export default function TimezoneToggle({ colorScheme = 'purple' }) {
  const { utc, toggle } = useTimezone();
  return (
    <HStack spacing={1} align="center" flexShrink={0}>
      <Text fontSize="xx-small" color="gray.500" textTransform="uppercase" letterSpacing="wider">
        tz:
      </Text>
      <ButtonGroup size="xs" isAttached>
        <Button
          colorScheme={colorScheme}
          variant={utc ? 'ghost' : 'solid'}
          h="16px"
          minW="34px"
          fontSize="9px"
          px={1}
          onClick={() => utc && toggle()}
        >
          Local
        </Button>
        <Button
          colorScheme={colorScheme}
          variant={utc ? 'solid' : 'ghost'}
          h="16px"
          minW="28px"
          fontSize="9px"
          px={1}
          onClick={() => !utc && toggle()}
        >
          UTC
        </Button>
      </ButtonGroup>
    </HStack>
  );
}
