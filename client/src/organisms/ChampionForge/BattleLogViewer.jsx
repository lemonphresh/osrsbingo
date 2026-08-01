import { Box, HStack, VStack, Text, Button } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';

export default function BattleLogViewer({ battle, onClose }) {
  const snap = battle.championSnapshots ?? {};
  const team1Name = snap.champion1?.teamName ?? 'Team 1';
  const team2Name = snap.champion2?.teamName ?? 'Team 2';
  const winnerName = battle.winnerId === battle.team1Id ? team1Name : team2Name;
  const entries = battle.battleLog ?? [];

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <VStack align="flex-start" spacing={0}>
          <Text fontWeight="bold" color="gray.200">
            {team1Name} vs {team2Name}
          </Text>
          <Text fontSize="sm" color="yellow.400">
            🏆 {winnerName} won
          </Text>
        </VStack>
        <Button
          size="sm"
          variant="ghost"
          color="gray.400"
          leftIcon={<ArrowBackIcon />}
          onClick={onClose}
        >
          Back to Bracket
        </Button>
      </HStack>
      <Box
        bg="gray.900"
        border="1px solid"
        borderColor="gray.700"
        borderRadius="lg"
        p={3}
        maxH="520px"
        overflowY="auto"
        fontFamily="mono"
        fontSize="12px"
      >
        {entries.length === 0 && <Text color="gray.600">No log entries.</Text>}
        {entries.map((e, i) => (
          <Text
            key={i}
            mb={1}
            color={
              e.action === 'SPECIAL'
                ? '#ce93d8'
                : e.action === 'USE_ITEM'
                ? '#ffe082'
                : e.action === 'BATTLE_START' || e.action === 'BATTLE_END'
                ? '#555'
                : '#ccc'
            }
          >
            {e.narrative}
          </Text>
        ))}
      </Box>
    </VStack>
  );
}
