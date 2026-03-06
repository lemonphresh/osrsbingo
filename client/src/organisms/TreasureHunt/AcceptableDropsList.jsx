import React from 'react';
import { Badge, Box, HStack, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';
import { COLLECTIBLE_ITEMS, SOLO_BOSSES, RAIDS, MINIGAMES } from '../../utils/objectiveCollections';

export function getAcceptableDropsForSource(sourceId, sourceType = 'bosses') {
  const sourceKey = `${sourceType}:${sourceId}`;
  return Object.values(COLLECTIBLE_ITEMS).filter((item) => {
    if (!item.sources || item.sources.length === 0) return false;
    return item.sources.includes(sourceKey);
  });
}

export function getAcceptableDropsForNode(objective) {
  if (!objective || objective.type !== 'item_collection' || !objective.contentId) return null;
  const { contentId } = objective;
  if (SOLO_BOSSES[contentId]) return getAcceptableDropsForSource(contentId, 'bosses');
  if (RAIDS[contentId]) return getAcceptableDropsForSource(contentId, 'raids');
  if (MINIGAMES[contentId]) return getAcceptableDropsForSource(contentId, 'minigames');
  return null;
}

export default function AcceptableDropsList({ drops, colorMode, currentColors }) {
  if (!drops || drops.length === 0) return null;

  const pets = drops.filter((d) => d.tags?.includes('pet'));
  const uniques = drops.filter((d) => d.tags?.includes('unique'));
  const jars = drops.filter((d) => d.tags?.includes('jar'));
  const consumables = drops.filter((d) => d.tags?.includes('consumable'));
  const other = drops.filter(
    (d) =>
      !d.tags?.includes('pet') &&
      !d.tags?.includes('unique') &&
      !d.tags?.includes('jar') &&
      !d.tags?.includes('consumable')
  );

  const renderDropGroup = (items, label, colorScheme) => {
    if (items.length === 0) return null;
    return (
      <Box>
        <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>
          {label}
        </Text>
        <Wrap spacing={1}>
          {items.map((item) => (
            <WrapItem key={item.id}>
              <Badge colorScheme={colorScheme} variant="subtle" fontSize="xs" px={2} py={0.5}>
                {item.name}
              </Badge>
            </WrapItem>
          ))}
        </Wrap>
      </Box>
    );
  };

  return (
    <Box
      p={3}
      bg={colorMode === 'dark' ? 'green.900' : 'green.50'}
      borderRadius="md"
      borderWidth={1}
      borderColor={colorMode === 'dark' ? 'green.700' : 'green.200'}
    >
      <HStack mb={2}>
        <Text fontSize="sm" fontWeight="semibold" color={currentColors.textColor}>
          ✅ Acceptable Drops
        </Text>
        <Badge colorScheme="green" fontSize="xs">
          {drops.length} items
        </Badge>
      </HStack>
      <Text fontSize="xs" color="gray.500" mb={3}>
        Submit any of these items to complete this objective:
      </Text>
      <VStack align="stretch" spacing={2}>
        {renderDropGroup(uniques, 'Unique Items', 'purple')}
        {renderDropGroup(pets, 'Pets', 'pink')}
        {renderDropGroup(jars, 'Jars', 'orange')}
        {renderDropGroup(consumables, 'Consumables', 'green')}
        {renderDropGroup(other, 'Other', 'gray')}
      </VStack>
    </Box>
  );
}
