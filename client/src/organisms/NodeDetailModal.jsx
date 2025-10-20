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
  Box,
  Heading,
  Badge,
  Button,
  Divider,
  useColorMode,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon } from '@chakra-ui/icons';

export default function NodeDetailModal({
  isOpen,
  onClose,
  node,
  adminMode = false,
  onAdminComplete,
  onAdminUncomplete,
}) {
  const { colorMode } = useColorMode();

  const colors = {
    dark: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
      red: { base: '#FF4B5C' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
    },
    light: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
      red: { base: '#FF4B5C' },
      textColor: '#171923',
      cardBg: 'white',
    },
  };

  const currentColors = colors[colorMode];

  if (!node) return null;

  const formatGP = (gp) => {
    return (gp / 1000000).toFixed(1) + 'M';
  };

  const getObjectiveText = (objective) => {
    if (!objective) return null;

    switch (objective.type) {
      case 'kills':
        return `Kill ${objective.quantity} ${objective.target}`;
      case 'xp_gain':
        return `Gain ${objective.quantity.toLocaleString()} XP in ${objective.target}`;
      case 'item_collection':
        return `Collect ${objective.quantity} ${objective.target}`;
      case 'boss_kc':
        return `Defeat ${objective.target} ${objective.quantity} times`;
      case 'minigame':
        return `Complete ${objective.quantity} ${objective.target} runs`;
      case 'clue_scrolls':
        return `Complete ${objective.quantity} ${objective.target} clue scrolls`;
      default:
        return 'Complete the objective';
    }
  };

  const getBuffIcon = (buffType) => {
    if (buffType.includes('kill_reduction')) return '⚔️';
    if (buffType.includes('xp_reduction')) return '📚';
    if (buffType.includes('item_reduction')) return '📦';
    if (buffType.includes('universal')) return '✨';
    if (buffType.includes('multi_use')) return '🔄';
    return '🎁';
  };

  const getBuffTierColor = (tier) => {
    if (tier === 'major') return 'purple';
    if (tier === 'moderate') return 'blue';
    if (tier === 'minor') return 'green';
    if (tier === 'universal') return 'yellow';
    return 'gray';
  };

  const isCompleted = node.status === 'completed';
  const isAvailable = node.status === 'available';
  const isLocked = node.status === 'locked';

  // Only show buff rewards if node is available or completed (not locked)
  const showBuffRewards =
    (!isLocked && node.rewards?.buffs && node.rewards.buffs?.length > 0) || adminMode;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg}>
        <ModalHeader color={currentColors.textColor}>{node.title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            <Text color={currentColors.textColor}>{node.description}</Text>

            <Divider />

            {node.objective && (
              <Box>
                <Heading size="sm" mb={2} color={currentColors.textColor}>
                  Objective
                </Heading>
                <Text color={currentColors.textColor}>{getObjectiveText(node.objective)}</Text>
              </Box>
            )}

            <Box>
              <Heading size="sm" mb={2} color={currentColors.textColor}>
                Rewards
              </Heading>
              <VStack align="start" spacing={2}>
                <Text fontWeight="bold" color={currentColors.green.base}>
                  {formatGP(node.rewards?.gp || 0)} GP
                </Text>
                {node.rewards?.keys && node.rewards.keys?.length > 0 && (
                  <HStack>
                    <Text fontSize="sm" color={currentColors.textColor}>
                      Keys:
                    </Text>
                    {node.rewards.keys?.map((key, idx) => (
                      <Badge key={idx} colorScheme={key.color}>
                        {key.quantity} {key.color}
                      </Badge>
                    ))}
                  </HStack>
                )}

                {showBuffRewards && (
                  <Box w="full" mt={2}>
                    <HStack mb={2}>
                      <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor}>
                        Buff Rewards:
                      </Text>
                      {node.rewards?.buffs?.length ? (
                        <Badge colorScheme="purple" fontSize="xs">
                          {node.rewards?.buffs?.length} buff
                          {node.rewards?.buffs?.length > 1 ? 's' : ''}
                        </Badge>
                      ) : (
                        <Text>N/A</Text>
                      )}
                    </HStack>
                    <VStack align="stretch" spacing={2}>
                      {node.rewards?.buffs?.map((buff, idx) => (
                        <Box
                          key={idx}
                          p={3}
                          bg={colorMode === 'dark' ? 'purple.900' : 'purple.50'}
                          borderRadius="md"
                          borderWidth={1}
                          borderColor={`${getBuffTierColor(buff.tier)}.400`}
                        >
                          <HStack justify="space-between">
                            <HStack>
                              <Text fontSize="lg">{getBuffIcon(buff.buffType)}</Text>
                              <VStack align="start" spacing={0}>
                                <Text
                                  fontSize="sm"
                                  fontWeight="bold"
                                  color={currentColors.textColor}
                                >
                                  {buff.buffType
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  Reduces objective requirements
                                </Text>
                              </VStack>
                            </HStack>
                            <Badge colorScheme={getBuffTierColor(buff.tier)} fontSize="xs">
                              {buff.tier.toUpperCase()}
                            </Badge>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </Box>

            {isCompleted && !adminMode && (
              <Badge alignSelf="center" colorScheme="green" fontSize="lg" px={4} py={2}>
                Completed ✓
              </Badge>
            )}

            {isAvailable && !adminMode && (
              <Text
                fontSize="sm"
                color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                textAlign="center"
              >
                Submit completion via Discord bot: <code>!submit {node.nodeId} [proof_link]</code>
              </Text>
            )}

            {adminMode && (
              <>
                <Divider />
                <Box
                  bg={currentColors.purple.light}
                  bgOpacity={0.1}
                  p={4}
                  borderRadius="md"
                  borderWidth={1}
                  borderColor={currentColors.purple.light}
                >
                  <HStack mb={3}>
                    <Text fontWeight="bold" fontSize="sm" color={currentColors.textColor}>
                      🛡️ Admin Controls
                    </Text>
                    <Badge colorScheme="purple" fontSize="xs">
                      {node.status?.toUpperCase()}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color={currentColors.textColor} mb={3}>
                    {isCompleted
                      ? 'Un-completing this node will remove rewards (GP, keys & buffs) and re-lock any nodes that were unlocked by it.'
                      : 'Completing this node will grant rewards (GP, keys & buffs) and unlock any connected nodes.'}
                  </Text>
                  <HStack spacing={2}>
                    {!isCompleted ? (
                      <Button
                        colorScheme="green"
                        leftIcon={<CheckIcon />}
                        onClick={() => {
                          onAdminComplete && onAdminComplete(node.nodeId);
                          onClose();
                        }}
                        size="sm"
                        flex={1}
                      >
                        Mark as Completed
                      </Button>
                    ) : (
                      <Button
                        colorScheme="red"
                        leftIcon={<CloseIcon />}
                        onClick={() => {
                          onAdminUncomplete && onAdminUncomplete(node.nodeId);
                          onClose();
                        }}
                        size="sm"
                        flex={1}
                      >
                        Un-complete Node
                      </Button>
                    )}
                    <Button variant="outline" onClick={onClose} size="sm" flex={1}>
                      Cancel
                    </Button>
                  </HStack>
                </Box>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
