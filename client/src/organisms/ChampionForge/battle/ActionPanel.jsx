import { useState } from 'react';
import { Box, HStack, VStack, Text, Button } from '@chakra-ui/react';
import ConsumableList from './ConsumableList';

export default function ActionPanel({ mySpecials, specialUsed, myConsumableIds, allItems, acting, onAction }) {
  const [activeTab, setActiveTab] = useState('attack');

  return (
    <Box bg="gray.800" border="1px solid" borderColor="gray.600" borderRadius="lg" p={4} mb={4}>
      <HStack mb={3} spacing={2}>
        {['attack', 'defend', 'special', 'item'].map((t) => (
          <Button
            key={t}
            size="xs"
            variant={activeTab === t ? 'solid' : 'outline'}
            colorScheme="purple"
            onClick={() => setActiveTab(t)}
          >
            {t === 'attack' ? '⚔️' : t === 'defend' ? '🛡️' : t === 'special' ? '✨' : '🧪'} {t}
          </Button>
        ))}
      </HStack>

      {activeTab === 'attack' && (
        <VStack align="stretch">
          <Text fontSize="xs" color="gray.400" mb={1}>
            Deal damage to the enemy champion.
          </Text>
          <Button colorScheme="red" onClick={() => onAction('ATTACK')} isLoading={acting}>
            ⚔️ Attack
          </Button>
        </VStack>
      )}
      {activeTab === 'defend' && (
        <VStack align="stretch">
          <Text fontSize="xs" color="gray.400" mb={1}>
            Reduce incoming damage by 60% until the next hit lands.
          </Text>
          <Button colorScheme="blue" onClick={() => onAction('DEFEND')} isLoading={acting}>
            🛡️ Defend
          </Button>
        </VStack>
      )}
      {activeTab === 'special' && (
        <VStack align="stretch">
          {specialUsed ? (
            <Text fontSize="sm" color="gray.500">
              Special ability already used this battle.
            </Text>
          ) : mySpecials.length === 0 ? (
            <Text fontSize="sm" color="gray.500">
              No special abilities equipped.
            </Text>
          ) : (
            <>
              <Text fontSize="xs" color="gray.400" mb={1}>
                One-time use — cannot be undone.
              </Text>
              <Button colorScheme="purple" onClick={() => onAction('SPECIAL')} isLoading={acting}>
                ✨ {mySpecials[0]}
              </Button>
            </>
          )}
        </VStack>
      )}
      {activeTab === 'item' && (
        <ConsumableList
          consumableIds={myConsumableIds}
          items={allItems ?? []}
          onUse={(itemId) => onAction('USE_ITEM', itemId)}
          disabled={acting}
        />
      )}
    </Box>
  );
}
