import { useEffect, useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { HUD, HUD_FONT_MONO } from '../../atoms/hudTheme';

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
  // Full → cyan, mid → amber, nearly out → danger red. Reads as fuel
  // depletion on the HUD surface.
  const barColor = pct > 0.5 ? HUD.cyan : pct > 0.25 ? HUD.amber : '#ff5a5a';
  const glowColor = pct > 0.5 ? HUD.cyanGlow : 'rgba(255, 184, 77, 0.25)';
  const label = remaining <= 0 ? "Time's up!" : `${remaining}s`;

  return (
    <Box w="100%">
      <Box
        h="4px"
        bg={HUD.bgRecessed}
        borderRadius="1px"
        overflow="hidden"
        mb={1.5}
        border="1px solid"
        borderColor={HUD.border}
      >
        <Box
          h="100%"
          w={`${pct * 100}%`}
          bg={barColor}
          boxShadow={pct > 0.25 ? `0 0 10px ${glowColor}` : 'none'}
          transition="width 0.5s linear, background 0.3s, box-shadow 0.3s"
        />
      </Box>
      <Text
        fontFamily={HUD_FONT_MONO}
        fontSize="10px"
        color={barColor}
        textAlign="right"
        fontWeight="500"
        textTransform="uppercase"
        letterSpacing="0.15em"
      >
        {label}
      </Text>
    </Box>
  );
}
