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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Heading,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { useMutation } from '@apollo/client';
import { PURCHASE_INN_REWARD } from '../../graphql/mutations';

export default function InnModal({
  isOpen,
  onClose,
  node,
  team,
  eventId,
  onPurchaseComplete,
  currentUser, // NEW: Add current user prop
}) {
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

  const isTeamMember =
    currentUser?.discordUserId &&
    team?.members?.some((m) => m.toString() === currentUser.discordUserId.toString());

  const formatGP = (gp) => {
    return (gp / 1000000).toFixed(1) + 'M';
  };

  // Check if team has already purchased from this Inn
  const hasAlreadyPurchased = team.innTransactions?.some((t) => t.nodeId === node.nodeId);

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
    // NEW: Check team membership before allowing purchase
    if (!isTeamMember) {
      toast({
        title: 'Not Authorized',
        description: 'You must be a member of this team to make purchases',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

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

            {/* NEW: Not a Team Member Alert */}
            {!isTeamMember && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle>View Only</AlertTitle>
                  <AlertDescription fontSize="sm">
                    You are not a member of this team. Link your Discord account to make purchases.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

            {/* Already Purchased Alert */}
            {hasAlreadyPurchased && (
              <Alert status="success" borderRadius="md">
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle>Already Purchased!</AlertTitle>
                  <AlertDescription fontSize="sm">
                    You've already made a purchase from this Inn. Each Inn can only be visited once
                    for rewards.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

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
                Shopkeep
              </Heading>

              {availableRewards.length === 0 ? (
                <Text fontSize="sm" color="gray.500">
                  No rewards available at this Inn
                </Text>
              ) : (
                <VStack spacing={3} align="stretch">
                  {availableRewards.map((reward) => {
                    const affordable = canAfford(reward.key_cost);
                    // NEW: Disable if not team member OR already purchased OR can't afford
                    const isDisabled = !isTeamMember || !affordable || hasAlreadyPurchased;

                    return (
                      <Box
                        key={reward.reward_id}
                        p={4}
                        borderWidth={2}
                        borderColor={
                          affordable && !hasAlreadyPurchased && isTeamMember
                            ? currentColors.green.base
                            : 'gray.500'
                        }
                        borderRadius="md"
                        bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
                        opacity={isDisabled ? 0.6 : 1}
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

                            {!isTeamMember && (
                              <Text fontSize="xs" color="orange.500">
                                Not a team member
                              </Text>
                            )}
                            {isTeamMember && !affordable && !hasAlreadyPurchased && (
                              <Text fontSize="xs" color="red.500">
                                Insufficient keys
                              </Text>
                            )}
                            {hasAlreadyPurchased && (
                              <Text fontSize="xs" color="green.500">
                                Already purchased from this Inn
                              </Text>
                            )}
                          </VStack>

                          <Button
                            colorScheme="green"
                            size="sm"
                            isDisabled={isDisabled}
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
                    {hasAlreadyPurchased ? 'Your Transaction' : 'Recent Transactions'}
                  </Heading>
                  <VStack spacing={1} align="stretch">
                    {team.innTransactions
                      .filter((t) => t.nodeId === node.nodeId)
                      .slice(-3)
                      .reverse()
                      .map((transaction, idx) => (
                        <Box
                          key={idx}
                          p={2}
                          bg={colorMode === 'dark' ? 'green.900' : 'green.50'}
                          borderRadius="md"
                          borderWidth={1}
                          borderColor="green.500"
                        >
                          <HStack justify="space-between">
                            <Text fontSize="sm" color={currentColors.textColor}>
                              <CheckIcon color="green.500" mr={2} />
                              Traded{' '}
                              {transaction.keysSpent
                                .map((k) => `${k.quantity}x ${k.color}`)
                                .join(', ')}
                            </Text>
                            <Text fontWeight="bold" color={currentColors.green.base}>
                              +{formatGP(transaction.payout)} GP
                            </Text>
                          </HStack>
                        </Box>
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
