import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  useColorMode,
} from '@chakra-ui/react';
import { QuestionIcon } from '@chakra-ui/icons';
import { OBJECTIVE_TYPES } from '../../utils/treasureHuntHelpers';

/**
 * Modal that displays all available nodes where a buff can be applied
 * Clicking on a node opens the NodeDetailModal
 */
const BuffApplicationListModal = ({
  isOpen,
  onClose,
  selectedBuff,
  availableNodes,
  onSelectNode,
}) => {
  const { colorMode } = useColorMode();

  const colors = {
    dark: {
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
      hoverBg: '#4A5568',
      green: { base: '#43AA8B' },
      orange: '#FF914D',
      red: '#FF4B5C',
    },
    light: {
      textColor: '#171923',
      cardBg: 'white',
      hoverBg: '#EDF2F7',
      green: { base: '#43AA8B' },
      orange: '#FF914D',
      red: '#FF4B5C',
    },
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

  const getDifficultyColor = (tier) => {
    if (tier === 5) return currentColors.red;
    if (tier === 3) return currentColors.orange;
    if (tier === 1) return currentColors.green.base;
    return 'gray';
  };

  const getDifficultyBadge = (tier) => {
    if (tier === 5) return { label: 'Hard', scheme: 'red' };
    if (tier === 3) return { label: 'Medium', scheme: 'orange' };
    if (tier === 1) return { label: 'Easy', scheme: 'green' };
    return { label: 'Unknown', scheme: 'gray' };
  };

  const formatObjectiveAmount = (node) => {
    if (!node?.objective) return '—';
    const quantity = node.objective.quantity;
    if (quantity >= 1000000) return `${(quantity / 1000000).toFixed(1)}M`;
    if (quantity >= 1000) return `${(quantity / 1000).toFixed(0)}k`;
    return quantity.toLocaleString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg}>
        <ModalHeader color={currentColors.textColor}>
          {selectedBuff ? (
            <HStack>
              <Text fontSize="2xl">{getBuffIcon(selectedBuff.buffType)}</Text>
              <VStack align="start" spacing={0}>
                <Text>{selectedBuff.buffName}</Text>
                <HStack>
                  <Badge colorScheme={getBuffColor(selectedBuff.reduction)} fontSize="xs">
                    -{(selectedBuff.reduction * 100).toFixed(0)}% Reduction
                  </Badge>
                  {selectedBuff.usesRemaining > 1 && (
                    <Badge colorScheme="orange" fontSize="xs">
                      {selectedBuff.usesRemaining} uses left
                    </Badge>
                  )}
                </HStack>
              </VStack>
            </HStack>
          ) : (
            'Apply Buff'
          )}
        </ModalHeader>
        <ModalCloseButton color={currentColors.textColor} />
        <ModalBody pb={6}>
          {availableNodes.length === 0 ? (
            <Box
              p={6}
              borderRadius="md"
              bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
              textAlign="center"
            >
              <Text color="gray.500" fontSize="lg" mb={2}>
                No Available Tasks
              </Text>
              <Text color="gray.400" fontSize="sm">
                There are no available nodes where this buff can be applied right now. Keep grinding
                and unlocking nodes to find more opportunities!
              </Text>
              {selectedBuff && (
                <Text color="gray.400" fontSize="xs" mt={2}>
                  This buff works on:{' '}
                  {selectedBuff.objectiveTypes?.map((type) => OBJECTIVE_TYPES[type]).join(', ') ||
                    'specific objectives'}
                </Text>
              )}
            </Box>
          ) : (
            <>
              <Text fontSize="sm" color="gray.500" mb={4}>
                Click on any node below to view details and apply the buff.
              </Text>
              <VStack spacing={3} align="stretch">
                {availableNodes.map((node) => {
                  const diffBadge = getDifficultyBadge(node.difficultyTier);
                  const hasBuffApplied = !!node.objective?.appliedBuff;

                  return (
                    <Box
                      key={node.nodeId}
                      p={4}
                      borderRadius="md"
                      borderWidth={2}
                      borderColor={getDifficultyColor(node.difficultyTier)}
                      bg={currentColors.cardBg}
                      cursor="pointer"
                      opacity={hasBuffApplied ? 0.6 : 1}
                      onClick={() => {
                        if (!hasBuffApplied) {
                          onClose(); // close first
                          onSelectNode(node); // then open next modal
                        }
                      }}
                      _hover={
                        !hasBuffApplied
                          ? {
                              bg: currentColors.hoverBg,
                              transform: 'translateY(-2px)',
                              shadow: 'lg',
                            }
                          : {}
                      }
                      transition="all 0.2s"
                      position="relative"
                    >
                      <HStack justify="space-between" align="start">
                        <HStack spacing={3} flex={1}>
                          <QuestionIcon color={currentColors.orange} boxSize={5} />
                          <VStack align="start" spacing={1} flex={1}>
                            <HStack flexWrap="wrap">
                              <Text fontWeight="semibold" color={currentColors.textColor}>
                                {node.title}
                              </Text>
                              <Badge colorScheme={diffBadge.scheme} fontSize="xs">
                                {diffBadge.label}
                              </Badge>
                              {hasBuffApplied && (
                                <Badge colorScheme="blue" fontSize="xs">
                                  Buff Already Applied
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="sm" color="gray.500">
                              {node.mapLocation}
                            </Text>
                            {node.objective && (
                              <HStack spacing={2} mt={1}>
                                <Text fontSize="xs" color="gray.400">
                                  {node.objective.target}
                                </Text>
                                <Badge colorScheme="gray" fontSize="xs">
                                  {formatObjectiveAmount(node)}
                                </Badge>
                              </HStack>
                            )}
                            {hasBuffApplied && node.objective?.appliedBuff && (
                              <Badge colorScheme="blue" fontSize="xs" mt={1}>
                                {node.objective.appliedBuff.buffName} active (-
                                {(node.objective.appliedBuff.reduction * 100).toFixed(0)}%)
                              </Badge>
                            )}
                          </VStack>
                        </HStack>
                        {!hasBuffApplied && (
                          <VStack align="end" spacing={1}>
                            <Text fontSize="xs" color="gray.500">
                              Click to apply
                            </Text>
                            <Text fontSize="xl">→</Text>
                          </VStack>
                        )}
                      </HStack>
                    </Box>
                  );
                })}
              </VStack>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BuffApplicationListModal;
