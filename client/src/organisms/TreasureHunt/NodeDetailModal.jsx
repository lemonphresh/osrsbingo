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
  Image,
  useDisclosure,
  IconButton,
  useToast,
  Code,
  Icon,
  Wrap,
  WrapItem,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import Casket from '../../assets/casket.png';
import { CheckIcon, CloseIcon, CopyIcon } from '@chakra-ui/icons';
import ProgressiveStartTutorial from './ProgressiveStartTutorial';
import { FaDiscord } from 'react-icons/fa';
import { useThemeColors } from '../../hooks/useThemeColors';
import { COLLECTIBLE_ITEMS, SOLO_BOSSES, RAIDS, MINIGAMES } from '../../utils/objectiveCollections';
import { useMemo } from 'react';

// Helper to get all acceptable drops for a boss/raid
function getAcceptableDropsForSource(sourceId, sourceType = 'bosses') {
  const sourceKey = `${sourceType}:${sourceId}`;

  return Object.values(COLLECTIBLE_ITEMS).filter((item) => {
    if (!item.sources || item.sources.length === 0) return false;
    return item.sources.includes(sourceKey);
  });
}

// Component to display acceptable drops
function AcceptableDropsList({ drops, colorMode, currentColors }) {
  if (!drops || drops.length === 0) return null;

  // Group drops by tag type for better organization
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
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={1}>
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
        <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor}>
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

export default function NodeDetailModal({
  isOpen,
  onClose,
  node,
  team,
  adminMode = false,
  onAdminComplete,
  onAdminUncomplete,
  onApplyBuff,
  appliedBuff: appliedBuffProp,
  currentUser,
  onVisitInn,
  event, // Add event prop to access contentSelections
}) {
  const { colors: currentColors, colorMode } = useThemeColors();
  const { isOpen: showTutorial, onClose: closeTutorial } = useDisclosure({ defaultIsOpen: true });
  const toast = useToast();
  const appliedBuff = appliedBuffProp ?? node?.objective?.appliedBuff ?? null;

  // Calculate acceptable drops for item_collection objectives
  const acceptableDrops = useMemo(() => {
    if (!node?.objective) return null;

    const { type, contentId } = node.objective;

    // Only show drops for item_collection objectives that target a boss/raid/minigame
    if (type === 'item_collection' && contentId) {
      // Check if it's a boss
      if (SOLO_BOSSES[contentId]) {
        return getAcceptableDropsForSource(contentId, 'bosses');
      }
      // Check if it's a raid
      if (RAIDS[contentId]) {
        return getAcceptableDropsForSource(contentId, 'raids');
      }
      // Check if it's a minigame
      if (MINIGAMES[contentId]) {
        return getAcceptableDropsForSource(contentId, 'minigames');
      }
    }

    // For boss_kc objectives, we could optionally show what drops they COULD get
    // but per your request, we only show the boss name for KC tasks
    // Uncomment below if you want to show potential drops for KC tasks too:
    /*
    if (type === 'boss_kc' && contentId) {
      if (SOLO_BOSSES[contentId]) {
        return getAcceptableDropsForSource(contentId, 'bosses');
      }
      if (RAIDS[contentId]) {
        return getAcceptableDropsForSource(contentId, 'raids');
      }
    }
    */

    return null;
  }, [node?.objective]);

  if (!node) return null;

  const isStartNode = node?.nodeType === 'START';
  const isInnNode = node?.nodeType === 'INN';
  const isFirstNode = team?.completedNodes?.length === 0;
  const shouldShowTutorial = isStartNode && isFirstNode && !adminMode && showTutorial;

  // Check if user has seen tutorial before
  const hasSeenTutorial =
    typeof window !== 'undefined' &&
    localStorage.getItem('treasureHunt_startTutorial_completed') === 'true';

  const isTeamMember =
    currentUser?.discordUserId && team?.members?.includes(currentUser.discordUserId);

  const formatGP = (gp) => {
    return (gp / 1000000).toFixed(1) + 'M';
  };

  const getObjectiveText = (objective) => {
    if (!objective) return null;

    switch (objective.type) {
      case 'xp_gain':
        return `Gain ${objective.quantity.toLocaleString()} XP in ${objective.target}`;
      case 'item_collection':
        return `Collect ${objective.quantity} ${objective.target.trim()}${
          objective.quantity > 1 ? 's' : ''
        }`;
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

  const showBuffRewards =
    (!isLocked && node.rewards?.buffs && node.rewards.buffs?.length > 0) || adminMode;

  const canApplyBuffs =
    isAvailable &&
    isTeamMember &&
    !appliedBuff &&
    team?.activeBuffs?.some((buff) => buff.objectiveTypes?.includes(node.objective?.type));

  const canVisitInn = isInnNode && isAvailable && isTeamMember && !adminMode;

  const handleCloseTutorial = () => {
    closeTutorial();
  };

  const handleCopySubmitCommand = () => {
    navigator.clipboard.writeText(`!submit ${node.nodeId}`);
    toast({
      title: 'Copied!',
      description: 'Command copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  // Check if this is an item collection task
  const isItemCollectionTask = node.objective?.type === 'item_collection';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent bg={currentColors.cardBg} maxH="90vh">
        <ModalHeader color={currentColors.textColor}>
          <HStack>
            <Text>{node.title}</Text>
            {isStartNode && (
              <Badge colorScheme="purple" fontSize="sm">
                START
              </Badge>
            )}
            {isInnNode && (
              <Badge colorScheme="yellow" fontSize="sm">
                INN
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack align="stretch" spacing={4}>
            {/* Show Progressive Tutorial for START node on first visit */}
            {shouldShowTutorial && !hasSeenTutorial && (
              <>
                <ProgressiveStartTutorial
                  nodeId={node.nodeId}
                  colorMode={colorMode}
                  onComplete={handleCloseTutorial}
                />
                <Divider />
              </>
            )}

            {/* Show compact reminder if they've seen it before */}
            {isStartNode && isFirstNode && hasSeenTutorial && (
              <>
                <ProgressiveStartTutorial
                  nodeId={node.nodeId}
                  colorMode={colorMode}
                  compact={true}
                  onComplete={() => {}}
                />
                <Divider />
              </>
            )}

            {node.description && (
              <>
                <Text
                  w="100%"
                  p={2}
                  borderRadius="md"
                  bg="gray.100"
                  m="0!important"
                  color={currentColors.textColor}
                >
                  {node.description}
                </Text>

                <Divider />
              </>
            )}

            {node.objective && (
              <Box>
                <Heading size="sm" mb={2} color={currentColors.textColor}>
                  Objective
                </Heading>
                <Text color={currentColors.textColor}>{getObjectiveText(node.objective)}</Text>

                {/* Show objective type badge */}
                <HStack mt={2}>
                  <Badge
                    colorScheme={
                      node.objective.type === 'boss_kc'
                        ? 'red'
                        : node.objective.type === 'item_collection'
                        ? 'green'
                        : node.objective.type === 'xp_gain'
                        ? 'blue'
                        : 'purple'
                    }
                    fontSize="xs"
                  >
                    {node.objective.type === 'boss_kc' && '⚔️ Boss KC'}
                    {node.objective.type === 'item_collection' && '📦 Item Collection'}
                    {node.objective.type === 'xp_gain' && '📊 XP Gain'}
                    {node.objective.type === 'minigame' && '🎮 Minigame'}
                    {node.objective.type === 'clue_scrolls' && '📜 Clue Scrolls'}
                  </Badge>
                </HStack>
              </Box>
            )}

            {/* Show acceptable drops for item collection tasks */}
            {isItemCollectionTask && acceptableDrops && acceptableDrops.length > 0 && (
              <AcceptableDropsList
                drops={acceptableDrops}
                colorMode={colorMode}
                currentColors={currentColors}
              />
            )}

            {!isFirstNode && !isInnNode && (
              <Box>
                <HStack
                  bg="orange.100"
                  p={2}
                  borderRadius="md"
                  transition="all 0.3s ease"
                  animation="pulseGlow 2s infinite alternate"
                  sx={{
                    '@keyframes pulseGlow': {
                      from: { boxShadow: `0 0 8px 2px #e3c0ffff` },
                      to: { boxShadow: `0 0 16px 4px #cf9efdff` },
                    },
                  }}
                  align="center"
                  mb={2}
                >
                  <VStack>
                    <Heading size="sm" color={currentColors.textColor}>
                      Rewards
                    </Heading>
                    <Image h="32px" src={Casket} />
                  </VStack>
                  <VStack ml={2} align="start" spacing={2}>
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
                                  {buff.tier?.toUpperCase()}
                                </Badge>
                              </HStack>
                            </Box>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                </HStack>
              </Box>
            )}

            {isCompleted && !adminMode && (
              <Badge alignSelf="center" colorScheme="green" fontSize="lg" px={4} py={2}>
                Completed ✔
              </Badge>
            )}

            {appliedBuff && (
              <Box>
                <Text fontSize="sm" fontWeight="bold" color={currentColors.textColor}>
                  Buff Applied:
                </Text>
                <Badge colorScheme="blue" fontSize="xs" mt={1}>
                  ✨ {appliedBuff.buffName} (-{(appliedBuff.reduction * 100).toFixed(0)}
                  %)
                </Badge>
              </Box>
            )}

            {canApplyBuffs && (
              <Button
                colorScheme="purple"
                size="md"
                onClick={() => {
                  onApplyBuff && onApplyBuff(node);
                  onClose();
                }}
                leftIcon={<Text>✨</Text>}
              >
                Apply Buff to Reduce Requirement
              </Button>
            )}

            {node.nodeType === 'INN' &&
              (canVisitInn ? (
                <VStack align="center" spacing={1}>
                  <Button
                    colorScheme="green"
                    size="lg"
                    onClick={() => {
                      onClose();
                      onVisitInn?.();
                    }}
                    leftIcon={<Text fontSize="xl">🏠</Text>}
                  >
                    Visit Inn
                  </Button>
                  <Text fontSize="xs" color="gray.500" textAlign="center">
                    Rest at the inn to recover and prepare for your next adventure! This will unlock
                    the shop and additional nodes.
                  </Text>
                </VStack>
              ) : (
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
                      to visit the inn and see what's in stock.
                    </AlertDescription>
                  </Box>
                </Alert>
              ))}

            {/* Discord Submit Instructions - Show for available nodes when not in admin mode */}
            {!adminMode && isAvailable && !isInnNode && (
              <Box
                p={3}
                bg={colorMode === 'dark' ? 'blue.900' : 'blue.50'}
                borderRadius="md"
                borderWidth={1}
                borderColor={colorMode === 'dark' ? 'blue.700' : 'blue.200'}
              >
                <HStack align="center" w="100%" justify="center" mb={2} spacing={2}>
                  <Icon as={FaDiscord} boxSize="16px" />
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    color={currentColors.textColor}
                    textAlign="center"
                  >
                    Submit {isInnNode ? 'visit to inn' : 'completion'} via Discord bot:
                  </Text>
                </HStack>
                <VStack spacing={2} align="stretch">
                  <HStack justify="center" spacing={2}>
                    <Code
                      fontSize="xs"
                      bg={colorMode === 'dark' ? 'whiteAlpha.200' : 'green.100'}
                      px={2}
                      py={1}
                    >
                      !submit {node.nodeId} link_to_screenshot
                    </Code>
                    <IconButton
                      icon={<CopyIcon />}
                      size="xs"
                      colorScheme="green"
                      aria-label="Copy command"
                      onClick={handleCopySubmitCommand}
                    />
                  </HStack>
                  <Text fontSize="xs" color="gray.500" textAlign="center">
                    or attach an image file to your message.{' '}
                    {isInnNode && ' Since this is an inn, show me your favorite cat!'}
                  </Text>
                </VStack>
              </Box>
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
