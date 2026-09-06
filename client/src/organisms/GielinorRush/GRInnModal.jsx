import React, { useState, useEffect } from 'react';
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
  IconButton,
  useColorMode,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Heading,
  Tooltip,
  Collapse,
} from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';
import { StarIcon } from '@chakra-ui/icons';
import { useMutation } from '@apollo/client';
import { PURCHASE_INN_REWARD } from '../../graphql/mutations';
import { GET_GR_TEAM } from '../../graphql/queries';

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
  isPreEvent = false,
}) {
  const { colorMode } = useColorMode();
  const toast = useToast();
  const [selectedReward, setSelectedReward] = useState(null);
  const [justPurchased, setJustPurchased] = useState(false);
  // Per-reward user-chosen key selection for "any" costs: { [rewardId]: { [color]: quantity } }
  const [keyPicks, setKeyPicks] = useState({});

  useEffect(() => {
    if (isOpen) {
      setJustPurchased(false);
      setKeyPicks({});
    }
  }, [isOpen]);

  const [purchaseReward, { loading: purchasing }] = useMutation(PURCHASE_INN_REWARD, {
    refetchQueries: [
      {
        query: GET_GR_TEAM,
        variables: { eventId, teamId: team.teamId },
      },
    ],
    awaitRefetchQueries: true,
    onCompleted: () => {
      setJustPurchased(true);
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

  // Exact-color demand is set aside first, then whatever's left must cover the
  // aggregated "any" total. Prevents rewards like "2 red + 1 any" from looking
  // affordable when the team only has exactly 2 red keys.
  const canAfford = (keyCost) => {
    const exactDemand = {};
    let anyTotal = 0;
    for (const cost of keyCost) {
      if (cost.color === 'any') anyTotal += cost.quantity;
      else exactDemand[cost.color] = (exactDemand[cost.color] || 0) + cost.quantity;
    }
    for (const [color, needed] of Object.entries(exactDemand)) {
      const teamKey = (team.keysHeld || []).find((k) => k.color === color);
      if (!teamKey || teamKey.quantity < needed) return false;
    }
    if (anyTotal > 0) {
      const availableForAny = (team.keysHeld || []).reduce(
        (sum, k) => sum + Math.max(0, k.quantity - (exactDemand[k.color] || 0)),
        0
      );
      if (availableForAny < anyTotal) return false;
    }
    return true;
  };

  // How many "any" keys a reward requires (0 if the reward has no "any" cost)
  const getAnyKeysRequired = (reward) =>
    (reward.key_cost || [])
      .filter((c) => c.color === 'any')
      .reduce((sum, c) => sum + c.quantity, 0);

  // Keys the team still has after exact-color costs are earmarked for this reward
  const getAvailableForAny = (reward) => {
    const exactDemand = {};
    (reward.key_cost || []).forEach((c) => {
      if (c.color !== 'any') exactDemand[c.color] = (exactDemand[c.color] || 0) + c.quantity;
    });
    return (team.keysHeld || [])
      .map((k) => ({ color: k.color, quantity: Math.max(0, k.quantity - (exactDemand[k.color] || 0)) }))
      .filter((k) => k.quantity > 0);
  };

  const getPickTotal = (rewardId) =>
    Object.values(keyPicks[rewardId] || {}).reduce((sum, q) => sum + q, 0);

  const setPick = (rewardId, color, quantity) => {
    setKeyPicks((prev) => ({
      ...prev,
      [rewardId]: { ...(prev[rewardId] || {}), [color]: quantity },
    }));
  };

  const handlePurchase = async (rewardId, keySelection) => {
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
          keySelection: keySelection && keySelection.length > 0 ? keySelection : undefined,
        },
      });
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

            {hasAlreadyPurchased && !justPurchased && (
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
                    const hasBuff = reward.buffs && reward.buffs.length > 0;
                    const anyRequired = getAnyKeysRequired(reward);
                    const availableForAny = anyRequired > 0 ? getAvailableForAny(reward) : [];
                    const needsPicker = anyRequired > 0 && availableForAny.length > 1;
                    const pickTotal = getPickTotal(reward.reward_id);
                    const pickComplete = !needsPicker || pickTotal === anyRequired;
                    // The card is "usable" if the gamer can meaningfully interact with it (pickers, etc.).
                    // Only truly-blocked states (not a member, can't afford, already bought) dim the card.
                    const cardBlocked = !isTeamMember || !affordable || hasAlreadyPurchased;
                    const isDisabled = cardBlocked || !pickComplete;
                    const buildSelection = () => {
                      if (anyRequired === 0) return [];
                      if (needsPicker) {
                        return Object.entries(keyPicks[reward.reward_id] || {})
                          .filter(([, q]) => q > 0)
                          .map(([color, quantity]) => ({ color, quantity }));
                      }
                      // Only one eligible color — send explicit selection so the server
                      // doesn't have to guess.
                      if (availableForAny.length === 1) {
                        return [{ color: availableForAny[0].color, quantity: anyRequired }];
                      }
                      return [];
                    };

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
                        opacity={cardBlocked ? 0.6 : 1}
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

                            {/* Any-key picker: shown when reward needs "any" keys and team has
                                more than one eligible color. */}
                            <Collapse
                              in={needsPicker && isTeamMember && !hasAlreadyPurchased && affordable}
                              animateOpacity
                              style={{ width: '100%' }}
                            >
                              <Box
                                mt={1}
                                p={2}
                                bg={colorMode === 'dark' ? 'blackAlpha.300' : 'blackAlpha.50'}
                                borderRadius="md"
                                borderWidth={1}
                                borderColor={
                                  pickComplete
                                    ? currentColors.green.base
                                    : colorMode === 'dark'
                                    ? 'gray.600'
                                    : 'gray.300'
                                }
                              >
                                <HStack justify="space-between" mb={2}>
                                  <Text
                                    fontSize="xs"
                                    fontWeight="semibold"
                                    color={currentColors.textColor}
                                  >
                                    Pick keys to spend
                                  </Text>
                                  <Text
                                    fontSize="xs"
                                    color={
                                      pickComplete ? currentColors.green.base : 'orange.400'
                                    }
                                  >
                                    {pickTotal} / {anyRequired}
                                  </Text>
                                </HStack>
                                <VStack spacing={1} align="stretch">
                                  {availableForAny.map((k) => {
                                    const current = keyPicks[reward.reward_id]?.[k.color] || 0;
                                    const remainingForOthers = anyRequired - pickTotal + current;
                                    const max = Math.min(k.quantity, remainingForOthers);
                                    return (
                                      <HStack key={k.color} justify="space-between">
                                        <Badge colorScheme={k.color}>{k.color}</Badge>
                                        <HStack spacing={1}>
                                          <IconButton
                                            aria-label={`Remove ${k.color} key`}
                                            icon={<MinusIcon />}
                                            size="xs"
                                            colorScheme="purple"
                                            variant="solid"
                                            isDisabled={current <= 0}
                                            onClick={() =>
                                              setPick(reward.reward_id, k.color, current - 1)
                                            }
                                          />
                                          <Text
                                            fontSize="sm"
                                            minW="2ch"
                                            textAlign="center"
                                            color={currentColors.textColor}
                                          >
                                            {current}
                                          </Text>
                                          <IconButton
                                            aria-label={`Add ${k.color} key`}
                                            icon={<AddIcon />}
                                            size="xs"
                                            colorScheme="purple"
                                            variant="solid"
                                            isDisabled={current >= max}
                                            onClick={() =>
                                              setPick(reward.reward_id, k.color, current + 1)
                                            }
                                          />
                                          <Text fontSize="xs" color="gray.500">
                                            /{k.quantity}
                                          </Text>
                                        </HStack>
                                      </HStack>
                                    );
                                  })}
                                </VStack>
                              </Box>
                            </Collapse>

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
                            {isTeamMember &&
                              affordable &&
                              !hasAlreadyPurchased &&
                              needsPicker &&
                              !pickComplete && (
                                <Text fontSize="xs" color="orange.500">
                                  Pick {anyRequired - pickTotal} more key
                                  {anyRequired - pickTotal === 1 ? '' : 's'} to trade
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
                            isDisabled={isDisabled || isPreEvent}
                            isLoading={purchasing && selectedReward === reward.reward_id}
                            onClick={() => {
                              setSelectedReward(reward.reward_id);
                              handlePurchase(reward.reward_id, buildSelection());
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
