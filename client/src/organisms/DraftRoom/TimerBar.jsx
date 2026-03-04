import { useEffect, useState } from 'react';
import { Box, Text } from '@chakra-ui/react';

/**
 * Client-side countdown display.
 * Server enforces the actual auto-pick; this is visual feedback only.
 */
export default function TimerBar({ startedAt, totalSeconds }) {
  const [remaining, setRemaining] = useState(totalSeconds);

  useEffect(() => {
    if (!startedAt) {
      setRemaining(totalSeconds);
      return;
    }

    const tick = () => {
      const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
      setRemaining(Math.max(0, Math.ceil(totalSeconds - elapsed)));
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [startedAt, totalSeconds]);

  const pct = Math.min(1, remaining / totalSeconds);
  const color = pct > 0.5 ? 'green.400' : pct > 0.25 ? 'yellow.400' : 'red.400';
  const label = remaining <= 0 ? "Time's up!" : `${remaining}s`;

  return (
    <Box w="100%">
      <Box
        h="6px"
        bg="gray.600"
        borderRadius="full"
        overflow="hidden"
        mb={1}
      >
        <Box
          h="100%"
          w={`${pct * 100}%`}
          bg={color}
          transition="width 0.5s linear, background 0.3s"
          borderRadius="full"
        />
      </Box>
      <Text fontSize="xs" color={color} textAlign="right" fontWeight="bold">
        {label}
      </Text>
    </Box>
  );
}
