import { Box } from '@chakra-ui/react';

export default function HPBar({ current, max, color }) {
  const pct = Math.max(0, Math.min(1, current / Math.max(1, max)));
  const barColor = pct > 0.5 ? color : pct > 0.25 ? '#e0a020' : '#e05050';
  return (
    <Box w="full" bg="#111" borderRadius={6} h="14px" overflow="hidden" border="1px solid #333">
      <Box
        w={`${pct * 100}%`}
        h="full"
        bg={barColor}
        borderRadius={6}
        transition="width 0.4s ease"
        boxShadow={`0 0 8px ${barColor}88`}
      />
    </Box>
  );
}
