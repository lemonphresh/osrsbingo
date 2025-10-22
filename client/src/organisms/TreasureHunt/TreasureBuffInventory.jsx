import React from 'react';
import { Box, VStack, HStack, Text, Badge, Tooltip, Icon } from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';

const BuffInventory = ({ buffs = [], colorMode = 'dark' }) => {
  const colors = {
    dark: { cardBg: '#2D3748', textColor: '#F7FAFC' },
    light: { cardBg: 'white', textColor: '#171923' },
  };
  const currentColors = colors[colorMode];

  const getBuffColor = (reduction) => {
    if (reduction >= 0.75) return 'purple';
    if (reduction >= 0.5) return 'blue';
    return 'green';
  };

  const getBuffIcon = (buffType) => {
    if (buffType.includes('kill_reduction')) return '⚔️';
    if (buffType.includes('xp_reduction')) return '📚';
    if (buffType.includes('item_reduction')) return '📦';
    if (buffType.includes('universal')) return '✨';
    if (buffType.includes('multi_use')) return '🔄';
    return '🎁';
  };

  if (!buffs || buffs.length === 0) {
    return (
      <Box bg={currentColors.cardBg} p={4} borderRadius="md" borderWidth={1}>
        <Text fontSize="sm" color="gray.500" textAlign="center">
          No available buffs. Complete nodes to earn buffs!
        </Text>
      </Box>
    );
  }

  return (
    <VStack maxW="600px" m="0 auto" spacing={2} align="stretch">
      {buffs.map((buff) => (
        <Box
          key={buff.buffId}
          bg={currentColors.cardBg}
          p={3}
          borderRadius="md"
          borderWidth={2}
          borderColor={`${getBuffColor(buff.reduction)}.400`}
          position="relative"
        >
          <HStack justify="space-between" align="start">
            <HStack spacing={2} flex={1}>
              <Text fontSize="2xl">{getBuffIcon(buff.buffType)}</Text>
              <VStack align="start" spacing={0}>
                <HStack>
                  <Text fontWeight="bold" color={currentColors.textColor}>
                    {buff.buffName}
                  </Text>
                  <Badge colorScheme={getBuffColor(buff.reduction)} fontSize="xs">
                    -{(buff.reduction * 100).toFixed(0)}%
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  {buff.description}
                </Text>
                {buff.usesRemaining > 1 && (
                  <Badge colorScheme="orange" fontSize="xs" mt={1}>
                    {buff.usesRemaining} uses remaining
                  </Badge>
                )}
              </VStack>
            </HStack>
            <Tooltip label={`Can be used on: ${buff.objectiveTypes.join(', ')}`} placement="top">
              <Icon as={InfoIcon} color="gray.400" boxSize={4} />
            </Tooltip>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
};

export default BuffInventory;
