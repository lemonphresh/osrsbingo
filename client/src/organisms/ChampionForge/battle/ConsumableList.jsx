import { VStack, Text, Button } from '@chakra-ui/react';

export default function ConsumableList({ consumableIds, items, onUse, disabled }) {
  return (
    <VStack align="stretch" spacing={1}>
      {consumableIds.map((id) => {
        const item = items.find((i) => i.itemId === id);
        if (!item) return null;
        return (
          <Button
            key={id}
            size="xs"
            colorScheme="blue"
            variant="outline"
            isDisabled={disabled}
            onClick={() => onUse(id)}
            justifyContent="flex-start"
          >
            🧪 {item.name}
          </Button>
        );
      })}
      {consumableIds.length === 0 && (
        <Text fontSize="xs" color="gray.500">
          No consumables remaining.
        </Text>
      )}
    </VStack>
  );
}
