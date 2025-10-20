import React, { useState } from 'react';
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
  Badge,
  Button,
  Divider,
  useColorMode,
  useToast,
  SimpleGrid,
  Heading,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { useMutation } from '@apollo/client';
import { PURCHASE_INN_REWARD } from '../graphql/mutations';

export default function InnModal({ isOpen, onClose, node, team, eventId, onPurchaseComplete }) {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [selectedReward, setSelectedReward] = useState(null);

  const [purchaseReward, { loading: purchasing }] = useMutation(PURCHASE_INN_REWARD);

  const colors = {
    dark: {
      yellow: { base: '#F4D35E' },
      green: { base: '#43AA8B' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
    },
    light: {
      yellow: { base: '#F4D35E' },
      green: { base: '#43AA8B' },
      textColor: '#171923',
      cardBg: 'white',
    },
  };

  const currentColors = colors[colorMode];

  if (!node || node.nodeType !== 'INN' || !team) return null;

  const formatGP = (gp) => {
    return (gp / 1000000).toFixed(1) + 'M';
  };

  const availableRewards = node.availableRewards || [];

  // Check if team can afford a reward
  const canAfford = (keyCost) => {
    return keyCost.every((cost) => {
      if (cost.color === 'any') {
        const totalKeys = team.keysHeld.reduce((sum, k) => sum + k.quantity, 0);
        return totalKeys >= cost.quantity;
      }
      const teamKey = team.keysHeld.find((k) => k.color === cost.color);
      return teamKey && teamKey.quantity >= cost.quantity;
    });
  };

  const handlePurchase = async (rewardId) => {
    try {
      await purchaseReward({
        variables: {
          eventId,
          teamId: team.teamId,
          rewardId,
        },
      });

      toast({
        title: 'Purchase successful!',
        description: 'Reward has been added to your pot',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setSelectedReward(null);
      onPurchaseComplete && onPurchaseComplete();
      onClose();
    } catch (error) {
      toast({
        title: 'Purchase failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  console.log('InnModal Debug:', {
    nodeTitle: node.title,
    availableRewards: node.availableRewards,
    teamKeys: team.keysHeld,
    buffHistory: team.buffHistory,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg}>
        <ModalHeader color={currentColors.textColor}>
          <HStack>
            <Text>🏠 {node.title}</Text>
            <Badge colorScheme="yellow">INN</Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            <Text color={currentColors.textColor}>{node.description}</Text>

            <Divider />

            {/* Team's Current Keys */}
            <Box bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'} p={3} borderRadius="md">
              <Heading size="xs" mb={2} color={currentColors.textColor}>
                Your Keys
              </Heading>
              {team.keysHeld && team.keysHeld.length > 0 ? (
                <HStack spacing={2} flexWrap="wrap">
                  {team.keysHeld.map((key) => (
                    <Badge key={key.color} colorScheme={key.color} fontSize="md">
                      {key.quantity}x {key.color}
                    </Badge>
                  ))}
                </HStack>
              ) : (
                <Text fontSize="sm" color="gray.500">
                  No keys available
                </Text>
              )}
            </Box>

            <Divider />

            {/* Available Rewards */}
            <Box>
              <Heading size="sm" mb={3} color={currentColors.textColor}>
                Available Trades
              </Heading>

              {availableRewards.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  No rewards available at this Inn
                </Text>
              ) : (
                <VStack spacing={3} align="stretch">
                  {availableRewards.map((reward) => {
                    const affordable = canAfford(reward.key_cost);

                    return (
                      <Box
                        key={reward.reward_id}
                        p={4}
                        borderWidth={2}
                        borderColor={affordable ? currentColors.green.base : 'gray.500'}
                        borderRadius="md"
                        bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
                        opacity={affordable ? 1 : 0.6}
                      >
                        <HStack justify="space-between" align="start">
                          <VStack align="start" spacing={2} flex={1}>
                            <HStack>
                              <Text fontWeight="bold" color={currentColors.textColor}>
                                Trade:
                              </Text>
                              {reward.key_cost.map((cost, idx) => (
                                <Badge key={idx} colorScheme={cost.color}>
                                  {cost.quantity}x {cost.color}
                                </Badge>
                              ))}
                            </HStack>

                            <HStack>
                              <Text fontSize="sm" color={currentColors.textColor}>
                                →
                              </Text>
                              <Text fontWeight="bold" color={currentColors.green.base}>
                                {formatGP(reward.payout)} GP
                              </Text>
                            </HStack>

                            {!affordable && (
                              <Text fontSize="xs" color="red.500">
                                Insufficient keys
                              </Text>
                            )}
                          </VStack>

                          <Button
                            colorScheme="green"
                            size="sm"
                            isDisabled={!affordable}
                            isLoading={purchasing && selectedReward === reward.reward_id}
                            onClick={() => {
                              setSelectedReward(reward.reward_id);
                              handlePurchase(reward.reward_id);
                            }}
                          >
                            Trade
                          </Button>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </Box>

            {/* Transaction History */}
            {team.innTransactions && team.innTransactions.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Heading size="xs" mb={2} color={currentColors.textColor}>
                    Recent Transactions
                  </Heading>
                  <VStack spacing={1} align="stretch">
                    {team.innTransactions
                      .filter((t) => t.nodeId === node.nodeId)
                      .slice(-3)
                      .reverse()
                      .map((transaction, idx) => (
                        <Text key={idx} fontSize="xs" color="gray.500">
                          Traded{' '}
                          {transaction.keysSpent.map((k) => `${k.quantity}x ${k.color}`).join(', ')}{' '}
                          → {formatGP(transaction.payout)} GP
                        </Text>
                      ))}
                  </VStack>
                </Box>
              </>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
