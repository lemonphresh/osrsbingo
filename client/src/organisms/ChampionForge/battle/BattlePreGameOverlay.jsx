import { Box, Text } from '@chakra-ui/react';

export default function BattlePreGameOverlay({ countdown }) {
  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0,0,0,0.88)"
      display="flex"
      flexDir="column"
      alignItems="center"
      justifyContent="center"
      zIndex={20}
      borderRadius="xl"
    >
      <Text fontSize="xs" color="gray.400" textTransform="uppercase" letterSpacing={4} mb={6}>
        ⚔️ Battle starting in
      </Text>
      <Box
        w="140px"
        h="140px"
        borderRadius="full"
        bg="#c9a84c11"
        border="3px solid #c9a84c"
        boxShadow="0 0 60px #c9a84c55, inset 0 0 30px #c9a84c11"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="80px"
        fontWeight="bold"
        color="#c9a84c"
        fontFamily="mono"
        transition="all 0.8s"
      >
        {countdown}
      </Box>
      <Text fontSize="xs" color="gray.500" mt={6}>
        Get ready, Captains!
      </Text>
    </Box>
  );
}
