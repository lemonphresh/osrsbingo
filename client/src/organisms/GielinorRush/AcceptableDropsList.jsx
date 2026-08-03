import React from 'react';
import { Badge, Box, HStack, Text, VStack, Wrap, WrapItem } from '@chakra-ui/react';

function makeDropItems(contentId, drops) {
  return (drops ?? []).map((name) => ({ id: `${contentId}__${name}`, name, tags: [] }));
}

export function getAcceptableDropsForSource(sourceId, sourceType = 'bosses', registryData = {}) {
  const { soloBosses, raids, minigames } = registryData;
  if (sourceType === 'bosses') return makeDropItems(sourceId, soloBosses?.[sourceId]?.drops);
  if (sourceType === 'raids') return makeDropItems(sourceId, raids?.[sourceId]?.drops);
  if (sourceType === 'minigames') return makeDropItems(sourceId, minigames?.[sourceId]?.drops);
  return [];
}

export function getAcceptableDropsForNode(objective, registryData = {}) {
  if (!objective || objective.type !== 'item_collection' || !objective.contentId) return null;
  const { contentId } = objective;
  const { soloBosses, raids, minigames } = registryData;
  if (soloBosses?.[contentId]) return getAcceptableDropsForSource(contentId, 'bosses', registryData);
  if (raids?.[contentId]) return getAcceptableDropsForSource(contentId, 'raids', registryData);
  if (minigames?.[contentId]) return getAcceptableDropsForSource(contentId, 'minigames', registryData);
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
