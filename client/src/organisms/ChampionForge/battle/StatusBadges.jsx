import { HStack, Badge } from '@chakra-ui/react';

export default function StatusBadges({ effects, defendActive }) {
  return (
    <HStack flexWrap="wrap" spacing={1}>
      {(effects ?? []).map((e, i) => (
        <Badge key={i} colorScheme="red" fontSize="10px" variant="subtle">
          {e.type === 'bleed'
            ? `🩸 bleed ${e.turns}t`
            : e.type === 'blind'
            ? '👁 blind'
            : e.type === 'fortress'
            ? `🏰 fortress ${e.turns}t`
            : e.type}
        </Badge>
      ))}
      {defendActive && (
        <Badge colorScheme="blue" fontSize="10px">
          🛡️ defending
        </Badge>
      )}
    </HStack>
  );
}
