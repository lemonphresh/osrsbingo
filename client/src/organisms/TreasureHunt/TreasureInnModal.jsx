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
  Tooltip,
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
import { useMutation } from '@apollo/client';
import { PURCHASE_INN_REWARD } from '../../graphql/mutations';
import { GET_TREASURE_TEAM } from '../../graphql/queries';

// Mirrors the icon logic from BuffInventory / NodeDetailModal
const getBuffIcon = (buffType = '') => {
  if (buffType.includes('kill_reduction')) return '⚔️';
  if (buffType.includes('xp_reduction')) return '📚';
  if (buffType.includes('item_reduction')) return '📦';
  if (buffType.includes('universal')) return '✨';
  return '🎁';
};

const getBuffTierColor = (buffType = '') => {
  if (buffType.includes('major')) return 'purple';
  if (buffType.includes('moderate')) return 'blue';
  if (buffType.includes('minor')) return 'green';
  if (buffType.includes('universal')) return 'yellow';
  return 'gray';
};

export default function InnModal({
  isOpen,
  onClose,
  node,
  team,
  eventId,
  onPurchaseComplete,
  currentUser,
}) {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [selectedReward, setSelectedReward] = useState(null);

  const [purchaseReward, { loading: purchasing }] = useMutation(PURCHASE_INN_REWARD, {
    refetchQueries: [
      {
        query: GET_TREASURE_TEAM,
        variables: { eventId, teamId: team.teamId },
      },
    ],
    awaitRefetchQueries: true,
    onCompleted: () => {
      toast({
        title: 'Purchase successful!',
        description: 'Rewards have been added to your team',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setSelectedReward(null);
      if (onPurchaseComplete) onPurchaseComplete();
      setTimeout(() => onClose(), 500);
    },
    onError: (error) => {
      console.error('Purchase error:', error);
      toast({
        title: 'Purchase failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setSelectedReward(null);
    },
  });

  const colors = {
    dark: {
      yellow: { base: '#F4D35E' },
      green: { base: '#43AA8B' },
      purple: { base: '#7D5FFF' },
      textColor: '#F7FAFC',
      cardBg: '#2D3748',
      buffBg: 'whiteAlpha.100',
    },
    light: {
      yellow: { base: '#F4D35E' },
      green: { base: '#43AA8B' },
      purple: { base: '#7D5FFF' },
      textColor: '#171923',
      cardBg: 'white',
      buffBg: 'blackAlpha.50',
    },
  };

  const currentColors = colors[colorMode];

  if (!node || node.nodeType !== 'INN' || !team) return null;

  const isTeamMember =
    currentUser?.discordUserId &&
    team?.members?.some(
      (m) => m.discordUserId?.toString() === currentUser.discordUserId?.toString()
    );

  const formatGP = (gp) => (gp / 1000000).toFixed(1) + 'M';

  const hasAlreadyPurchased = team.innTransactions?.some((t) => t.nodeId === node.nodeId);
  const availableRewards = node.availableRewards || [];

  const canAfford = (keyCost) =>
    keyCost.every((cost) => {
      if (cost.color === 'any') {
        return team.keysHeld.reduce((sum, k) => sum + k.quantity, 0) >= cost.quantity;
      }
      const teamKey = team.keysHeld.find((k) => k.color === cost.color);
      return teamKey && teamKey.quantity >= cost.quantity;
    });

  const handlePurchase = async (rewardId) => {
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
      await purchaseReward({ variables: { eventId, teamId: team.teamId, rewardId } });
    } catch (error) {
      console.error('Purchase exception:', error);
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

            {!isTeamMember && (
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle>View Only</AlertTitle>
                  <AlertDescription fontSize="sm">
                    Link your Discord ID on your{' '}
                    <Text
                      as="a"
                      href={`/user/${currentUser?.id}`}
                      color="blue.500"
                      textDecoration="underline"
                    >
                      profile
                    </Text>{' '}
                    to make purchases.
                  </AlertDescription>
                </Box>
              </Alert>
            )}

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

            {/* Keys display */}
            <Box bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'} p={3} borderRadius="md">
              <Heading size="xs" mb={2} color={currentColors.textColor}>
                Your Team's Keys
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

            {/* Reward options */}
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
                    const isDisabled = !isTeamMember || !affordable || hasAlreadyPurchased;
                    const hasBuff = reward.buffs && reward.buffs.length > 0;

                    return (
                      <Box
                        key={reward.reward_id}
                        p={4}
                        borderWidth={2}
                        borderColor={
                          hasBuff && affordable && !hasAlreadyPurchased && isTeamMember
                            ? currentColors.purple.base
                            : affordable && !hasAlreadyPurchased && isTeamMember
                            ? currentColors.green.base
                            : 'gray.500'
                        }
                        borderRadius="md"
                        bg={colorMode === 'dark' ? 'gray.700' : 'gray.50'}
                        opacity={isDisabled ? 0.6 : 1}
                        position="relative"
                      >
                        {/* "Bonus Buff" badge in top-right corner */}
                        {hasBuff && (
                          <Badge
                            colorScheme="purple"
                            position="absolute"
                            top={2}
                            right={2}
                            fontSize="xs"
                          >
                            ✨ Bonus Buff
                          </Badge>
                        )}

                        <HStack justify="space-between" align="start">
                          <VStack align="start" spacing={2} flex={1}>
                            {/* Key cost */}
                            <HStack>
                              <Text fontWeight="semibold" color={currentColors.textColor}>
                                Trade:
                              </Text>
                              {reward.key_cost.map((cost, idx) => (
                                <Badge
                                  key={idx}
                                  colorScheme={cost.color === 'any' ? 'gray' : cost.color}
                                >
                                  {cost.quantity}x {cost.color}
                                </Badge>
                              ))}
                            </HStack>

                            {/* GP payout */}
                            <HStack>
                              <Text fontSize="sm" color={currentColors.textColor}>
                                →
                              </Text>
                              <Text
                                fontWeight="semibold"
                                color={currentColors.green.base}
                                fontSize="lg"
                              >
                                {formatGP(reward.payout)} GP
                              </Text>
                            </HStack>

                            {/* Buff reward — shown if present */}
                            {hasBuff && (
                              <Box
                                mt={1}
                                p={2}
                                bg={currentColors.buffBg}
                                borderRadius="md"
                                borderWidth={1}
                                borderColor={colorMode === 'dark' ? 'purple.600' : 'purple.200'}
                                w="full"
                              >
                                {reward.buffs.map((buff, idx) => (
                                  <HStack key={idx} spacing={2}>
                                    <Text fontSize="sm">{getBuffIcon(buff.buffType)}</Text>
                                    <Text
                                      fontSize="sm"
                                      fontWeight="semibold"
                                      color={currentColors.textColor}
                                    >
                                      {buff.buffName || buff.buffType}
                                    </Text>
                                    <Tooltip
                                      label="Reduces a future objective requirement when applied to a node"
                                      placement="top"
                                    >
                                      <Badge
                                        colorScheme={getBuffTierColor(buff.buffType)}
                                        fontSize="xs"
                                        cursor="help"
                                      >
                                        <HStack spacing={1}>
                                          <StarIcon boxSize={2} />
                                          <Text>Buff</Text>
                                        </HStack>
                                      </Badge>
                                    </Tooltip>
                                  </HStack>
                                ))}
                              </Box>
                            )}

                            {/* Status hints */}
                            {!isTeamMember && (
                              <Text fontSize="xs" color="orange.500">
                                Discord ID not linked
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
                            colorScheme={hasBuff ? 'purple' : 'green'}
                            size="sm"
                            isDisabled={isDisabled}
                            isLoading={purchasing && selectedReward === reward.reward_id}
                            onClick={() => {
                              setSelectedReward(reward.reward_id);
                              handlePurchase(reward.reward_id);
                            }}
                            mt={hasBuff ? 6 : 0} // offset to avoid "Bonus Buff" badge overlap
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
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
