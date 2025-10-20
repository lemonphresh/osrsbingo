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

export default function NodeDetailModal({ isOpen, onClose, node }) {
  const { colorMode } = useColorMode();

  const colors = {
    dark: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
    },
    light: {
      purple: { base: '#7D5FFF', light: '#b3a6ff' },
      green: { base: '#43AA8B' },
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
              <VStack align="start" spacing={1}>
                <Text fontWeight="bold" color={currentColors.green.base}>
                  {formatGP(node.rewards?.gp || 0)} GP
                </Text>
                {node.rewards?.keys && node.rewards.keys.length > 0 && (
                  <HStack>
                    <Text fontSize="sm" color={currentColors.textColor}>
                      Keys:
                    </Text>
                    {node.rewards.keys.map((key, idx) => (
                      <Badge key={idx} colorScheme={key.color}>
                        {key.quantity} {key.color}
                      </Badge>
                    ))}
                  </HStack>
                )}
              </VStack>
            </Box>

            {node.status === 'completed' && (
              <Badge alignSelf="center" colorScheme="green" fontSize="lg" px={4} py={2}>
                Completed ✓
              </Badge>
            )}

            {node.status === 'available' && (
              <Text
                fontSize="sm"
                color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                textAlign="center"
              >
                Submit completion via Discord bot: <code>!submit {node.nodeId} [proof_link]</code>
              </Text>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
