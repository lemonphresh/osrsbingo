import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Spinner,
  Center,
  Tooltip,
  Button,
  Divider,
} from '@chakra-ui/react';
import { GET_CLAN_WARS_WAR_CHEST } from '../../graphql/clanWarsOperations';

const RARITY_BORDER = {
  common: '#888',
  uncommon: '#2ecc71',
  rare: '#3498db',
  epic: '#9b59b6',
};

const RARITY_COLOR = {
  common: 'gray',
  uncommon: 'green',
  rare: 'blue',
  epic: 'purple',
};

const SLOT_EMOJI = {
  weapon: '⚔️',
  helm: '🪖',
  chest: '🛡️',
  legs: '🩲',
  gloves: '🧤',
  boots: '👢',
  shield: '🛡',
  ring: '💍',
  amulet: '📿',
  cape: '🧣',
  consumable: '🧪',
};

// Named sections for "view all" grouping
const SECTIONS = [
  { id: 'weapons', label: 'Weapons', slots: ['weapon'] },
  { id: 'armour', label: 'Armour', slots: ['helm', 'chest', 'legs', 'gloves', 'boots', 'shield'] },
  { id: 'accessories', label: 'Accessories', slots: ['ring', 'amulet', 'cape'] },
  { id: 'consumables', label: 'Consumables', slots: ['consumable'] },
];

const RARITIES = ['common', 'uncommon', 'rare', 'epic'];

// ---------------------------------------------------------------------------

function ItemTile({ item }) {
  const border = RARITY_BORDER[item.rarity] ?? '#888';
  const snap = item.itemSnapshot ?? {};
  const stats = snap.stats ?? {};

  return (
    <Tooltip
      label={
        <VStack align="flex-start" spacing={1} fontSize="xs" p={1}>
          <Text fontWeight="bold">{item.name}</Text>
          <Text color="gray.400">
            {item.slot} · {item.rarity}
          </Text>
          {stats.attack > 0 && <Text color="red.300">ATK +{stats.attack}</Text>}
          {stats.defense > 0 && <Text color="blue.300">DEF +{stats.defense}</Text>}
          {stats.speed > 0 && <Text color="green.300">SPD +{stats.speed}</Text>}
          {stats.crit > 0 && <Text color="yellow.300">CRIT +{stats.crit}%</Text>}
          {stats.hp > 0 && <Text color="pink.300">HP +{stats.hp}</Text>}
          {snap.special && (
            <Text color="purple.300">
              ✨ {snap.special.label}: {snap.special.description}
            </Text>
          )}
          {snap.consumableEffect && (
            <Text color="blue.300">🧪 {snap.consumableEffect.description}</Text>
          )}
        </VStack>
      }
      hasArrow
      placement="top"
      bg="gray.900"
      color="white"
      border="1px solid"
      borderColor="gray.600"
      borderRadius="md"
    >
      <Box
        w="52px"
        h="52px"
        borderRadius="md"
        border="2px solid"
        borderColor={border}
        bg="gray.800"
        display="flex"
        flexDir="column"
        alignItems="center"
        justifyContent="center"
        cursor="default"
        boxShadow={`0 0 6px ${border}44`}
        position="relative"
      >
        <Text fontSize="xl">{SLOT_EMOJI[item.slot] ?? '📦'}</Text>
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
          <Box
            position="absolute"
            inset={0}
            bg="blackAlpha.600"
            borderRadius="md"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="xs" color="gray.300">
              used
            </Text>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}

function SectionGroup({ label, items }) {
  if (items.length === 0) return null;
  return (
    <Box>
      <HStack mb={2} spacing={2}>
        <Text
          fontSize="xs"
          fontWeight="semibold"
          color="gray.400"
          textTransform="uppercase"
          letterSpacing="wider"
        >
          {label}
        </Text>
        <Text fontSize="xs" color="gray.600">
          ({items.length})
        </Text>
      </HStack>
      <HStack flexWrap="wrap" spacing={1}>
        {items.map((item) => (
          <ItemTile key={item.itemId} item={item} />
        ))}
      </HStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------

export default function WarChestPanel({ team, hidden = false }) {
  const [slotFilter, setSlotFilter] = useState('all');
  const [rarityFilter, setRarityFilter] = useState('all');

  const { data, loading } = useQuery(GET_CLAN_WARS_WAR_CHEST, {
    variables: { teamId: team.teamId },
    fetchPolicy: 'cache-and-network',
  });

  const allItems = data?.getClanWarsWarChest ?? [];

  // Apply filters
  const filtered = allItems.filter((item) => {
    if (rarityFilter !== 'all' && item.rarity !== rarityFilter) return false;
    if (slotFilter === 'all') return true;
    const section = SECTIONS.find((s) => s.id === slotFilter);
    return section ? section.slots.includes(item.slot) : true;
  });

  const filterBtn = (active, label, onClick, scheme = 'gray') => (
    <Button
      key={label}
      size="xs"
      color="white"
      _hover={{ bg: active ? `${scheme}.600` : 'gray.600' }}
      variant={active ? 'solid' : 'outline'}
      colorScheme={active ? (scheme === 'gray' ? 'purple' : scheme) : 'gray'}
      onClick={onClick}
    >
      {label}
    </Button>
  );

  return (
    <Box bg="gray.700" border="1px solid" borderColor="gray.600" borderRadius="lg" p={4}>
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="bold" fontSize="sm" color="white">
          {team.teamName}
        </Text>
        <Badge colorScheme="purple" fontSize="xs">
          {allItems.length} items
        </Badge>
      </HStack>

      <Divider borderColor="gray.600" mb={2} />

      {loading && (
        <Center h="80px">
          <Spinner size="sm" color="purple.400" />
        </Center>
      )}

      {!loading && allItems.length === 0 && (
        <Text fontSize="xs" color="gray.500">
          {hidden ? 'War chest hidden during gathering phase.' : 'No items yet.'}
        </Text>
      )}

      {!loading && hidden && allItems.length > 0 && (
        <Text fontSize="xs" color="gray.500" fontStyle="italic">
          🔒 War chest contents hidden until post-battle reveal.
        </Text>
      )}

      {!loading && !hidden && allItems.length > 0 && (
        <VStack align="stretch">
          {/* Slot category filter */}
          <HStack flexWrap="wrap" gap={1}>
            {filterBtn(slotFilter === 'all', 'All', () => setSlotFilter('all'))}
            {SECTIONS.map((s) =>
              filterBtn(slotFilter === s.id, s.label, () => setSlotFilter(s.id))
            )}
          </HStack>
          <Divider borderColor="gray.600" my={1} />

          {/* Rarity filter */}
          <HStack flexWrap="wrap" gap={1}>
            {filterBtn(rarityFilter === 'all', 'All Rarities', () => setRarityFilter('all'))}
            {RARITIES.map((r) =>
              filterBtn(rarityFilter === r, r, () => setRarityFilter(r), RARITY_COLOR[r])
            )}
          </HStack>
          <Divider borderColor="gray.600" my={1} />

          {/* Items — grouped by named section in "all" mode, flat otherwise */}
          {slotFilter === 'all' ? (
            <VStack align="stretch" spacing={4}>
              {SECTIONS.map((section) => {
                const sectionItems = filtered.filter((i) => section.slots.includes(i.slot));
                return <SectionGroup key={section.id} label={section.label} items={sectionItems} />;
              })}
              {filtered.length === 0 && (
                <Text fontSize="xs" color="gray.500">
                  No items match this filter.
                </Text>
              )}
            </VStack>
          ) : (
            <VStack align="stretch" spacing={2}>
              {filtered.length === 0 ? (
                <Text fontSize="xs" color="gray.500">
                  No items match this filter.
                </Text>
              ) : (
                <HStack flexWrap="wrap" spacing={1}>
                  {filtered.map((item) => (
                    <ItemTile key={item.itemId} item={item} />
                  ))}
                </HStack>
              )}
            </VStack>
          )}
        </VStack>
      )}
    </Box>
  );
}
