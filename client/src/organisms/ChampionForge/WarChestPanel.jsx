import React from 'react';
import { useQuery } from '@apollo/client';
import {
  Box, VStack, HStack, Text, Badge, SimpleGrid, Spinner, Center, Tooltip,
  useColorMode,
} from '@chakra-ui/react';
import { GET_CLAN_WARS_WAR_CHEST } from '../../graphql/clanWarsOperations';

const RARITY_COLORS = { common: 'gray', uncommon: 'green', rare: 'blue', epic: 'purple' };
const RARITY_BORDER = {
  common:   '#888',
  uncommon: '#2ecc71',
  rare:     '#3498db',
  epic:     '#9b59b6',
};

const SLOT_EMOJI = {
  weapon: '⚔️', helm: '🪖', chest: '🛡️', legs: '🩲', gloves: '🧤', boots: '👢',
  shield: '🛡', ring: '💍', amulet: '📿', cape: '🧣', consumable: '🧪',
};

function ItemTile({ item }) {
  const { colorMode } = useColorMode();
  const border = RARITY_BORDER[item.rarity] ?? '#888';
  const snap = item.itemSnapshot ?? {};
  const stats = snap.stats ?? {};

  return (
    <Tooltip
      label={
        <VStack align="flex-start" spacing={1} fontSize="xs" p={1}>
          <Text fontWeight="bold">{item.name}</Text>
          <Text color="gray.300">{item.slot} · {item.rarity}</Text>
          {stats.attack  > 0 && <Text>ATK +{stats.attack}</Text>}
          {stats.defense > 0 && <Text>DEF +{stats.defense}</Text>}
          {stats.speed   > 0 && <Text>SPD +{stats.speed}</Text>}
          {stats.crit    > 0 && <Text>CRIT +{stats.crit}%</Text>}
          {stats.hp      > 0 && <Text>HP +{stats.hp}</Text>}
          {snap.special && <Text color="purple.300">✨ {snap.special.label}: {snap.special.description}</Text>}
          {snap.consumableEffect && <Text color="blue.300">🧪 {snap.consumableEffect.description}</Text>}
        </VStack>
      }
      hasArrow
      placement="top"
    >
      <Box
        w="52px"
        h="52px"
        borderRadius="md"
        border="2px solid"
        borderColor={border}
        bg={colorMode === 'dark' ? 'gray.800' : 'gray.100'}
        display="flex"
        flexDir="column"
        alignItems="center"
        justifyContent="center"
        cursor="default"
        boxShadow={`0 0 6px ${border}44`}
        position="relative"
      >
        <Text fontSize="xl">{SLOT_EMOJI[item.slot] ?? '📦'}</Text>
        {/* Rarity pip */}
        <Box
          position="absolute"
          bottom="2px"
          right="2px"
          w="6px"
          h="6px"
          borderRadius="full"
          bg={border}
        />
        {item.isUsed && (
          <Box position="absolute" inset={0} bg="blackAlpha.600" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
            <Text fontSize="xs" color="gray.300">used</Text>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}

function SlotGroup({ slot, items }) {
  const { colorMode } = useColorMode();
  return (
    <Box>
      <HStack mb={1} spacing={1}>
        <Text fontSize="xs" color="gray.500" textTransform="capitalize">{slot}</Text>
        <Text fontSize="xs" color="gray.600">({items.length})</Text>
      </HStack>
      <HStack flexWrap="wrap" spacing={1}>
        {items.map((item) => <ItemTile key={item.itemId} item={item} />)}
      </HStack>
    </Box>
  );
}

export default function WarChestPanel({ team, hidden = false }) {
  const { colorMode } = useColorMode();
  const { data, loading } = useQuery(GET_CLAN_WARS_WAR_CHEST, {
    variables: { teamId: team.teamId },
    fetchPolicy: 'cache-and-network',
  });

  const items = data?.getClanWarsWarChest ?? [];
  const bg = colorMode === 'dark' ? 'gray.750' : 'gray.50';

  // Group items by slot
  const bySlot = items.reduce((acc, item) => {
    if (!acc[item.slot]) acc[item.slot] = [];
    acc[item.slot].push(item);
    return acc;
  }, {});

  const slots = Object.keys(bySlot).sort();

  return (
    <Box bg={bg} border="1px solid" borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'} borderRadius="lg" p={4}>
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="bold" fontSize="sm">{team.teamName}</Text>
        <Badge colorScheme="purple" fontSize="xs">{items.length} items</Badge>
      </HStack>

      {loading && (
        <Center h="80px">
          <Spinner size="sm" color="purple.400" />
        </Center>
      )}

      {!loading && items.length === 0 && (
        <Text fontSize="xs" color="gray.500">
          {hidden ? 'War chest hidden during gathering phase.' : 'No items yet.'}
        </Text>
      )}

      {!loading && !hidden && items.length > 0 && (
        <VStack align="stretch" spacing={3}>
          {slots.map((slot) => (
            <SlotGroup key={slot} slot={slot} items={bySlot[slot]} />
          ))}
        </VStack>
      )}

      {!loading && hidden && items.length > 0 && (
        <Text fontSize="xs" color="gray.500" fontStyle="italic">
          🔒 War chest contents hidden until post-battle reveal.
        </Text>
      )}
    </Box>
  );
}
