import React from 'react';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  HStack,
  Icon,
  Text,
  VStack,
} from '@chakra-ui/react';
import { CheckCircleIcon, LockIcon, QuestionIcon } from '@chakra-ui/icons';
import { RedactedText } from '../../molecules/TreasureHunt/RedactedTreasureInfo';
import { OBJECTIVE_TYPES, formatGP } from '../../utils/treasureHuntHelpers';
import theme from '../../theme';

const AllNodesAccordion = ({
  nodes,
  team,
  event,
  adminMode,
  getNodeStatus,
  isLocationGroupCompleted,
  getCompletedNodeInGroup,
  getNodeBorderColor,
  getNodeBadge,
  handleNodeClick,
  handleOpenBuffModal,
  currentColors,
  colorMode,
}) => (
  <Accordion allowToggle>
    <AccordionItem border="none">
      <AccordionButton
        alignItems="center"
        p={3}
        borderRadius="10px"
        bg="whiteAlpha.100"
        _hover={{ bg: 'transparent' }}
        justifyContent="space-between"
      >
        <Text fontWeight="semibold" mb={0}>
          All Nodes
        </Text>
        <HStack spacing={2}>
          <Text fontSize="xs" color="gray.400">
            Expand to see all {nodes.length} nodes
          </Text>
          <AccordionIcon color="gray.400" />
        </HStack>
      </AccordionButton>
      <AccordionPanel px={0} pb={4}>
        <VStack spacing={3} align="stretch">
          {nodes
            .slice()
            .sort((a, b) => {
              const statusA = getNodeStatus(a);
              const statusB = getNodeStatus(b);
              const isInnA = a.nodeType === 'INN';
              const isInnB = b.nodeType === 'INN';
              const hasTxA = team.innTransactions?.some((t) => t.nodeId === a.nodeId);
              const hasTxB = team.innTransactions?.some((t) => t.nodeId === b.nodeId);
              const isAvailableInnA = isInnA && statusA === 'available';
              const isCompletedInnNoTxA = isInnA && statusA === 'completed' && !hasTxA;
              const isCompletedInnNoTxB = isInnB && statusB === 'completed' && !hasTxB;
              const hasBuffAppliedA = statusA === 'available' && !!a.objective?.appliedBuff;
              const hasBuffAppliedB = statusB === 'available' && !!b.objective?.appliedBuff;
              const order = (status, isAvailableInn, isCompletedInnNoTx, hasBuffApplied) => {
                if (isAvailableInn) return 0;
                if (isCompletedInnNoTx) return 1;
                if (hasBuffApplied) return 2;
                if (status === 'available') return 3;
                if (status === 'completed') return 4;
                return 5;
              };
              const orderA = order(statusA, isAvailableInnA, isCompletedInnNoTxA, hasBuffAppliedA);
              const orderB = order(statusB, isCompletedInnNoTxB, isCompletedInnNoTxB, hasBuffAppliedB);
              return orderA - orderB;
            })
            .map((node) => {
              const status = getNodeStatus(node);
              const isLocked = status === 'locked' && !adminMode;
              const isInn = node.nodeType === 'INN';
              const isCompletedInn = isInn && status === 'completed';
              const hasTransaction = team.innTransactions?.some((t) => t.nodeId === node.nodeId);
              const groupCompleted = isLocationGroupCompleted(node, team, event);
              const completedNodeInGroup = groupCompleted
                ? getCompletedNodeInGroup(node, team, event)
                : null;
              const isOtherDifficultyCompleted =
                groupCompleted && !team.completedNodes?.includes(node.nodeId);
              const isLocationLocked = isOtherDifficultyCompleted && status !== 'completed';
              const hasAffordableRewards =
                isCompletedInn &&
                !hasTransaction &&
                node.availableRewards?.some((reward) =>
                  reward.key_cost.every((cost) => {
                    if (cost.color === 'any') {
                      const totalKeys =
                        team.keysHeld?.reduce((sum, k) => sum + k.quantity, 0) || 0;
                      return totalKeys >= cost.quantity;
                    }
                    const teamKey = team.keysHeld?.find((k) => k.color === cost.color);
                    return teamKey && teamKey.quantity >= cost.quantity;
                  })
                );
              const isAvailableWithBuffs =
                status === 'available' &&
                team.activeBuffs?.length > 0 &&
                node.objective &&
                team.activeBuffs.some(
                  (buff) =>
                    buff.objectiveTypes.includes(node.objective.type) &&
                    !(
                      node.objective.type === 'item_collection' &&
                      node.objective.quantity <= 3
                    )
                );
              const hasBuffApplied = !!node.objective?.appliedBuff;

              return (
                <Card
                  key={node.nodeId}
                  bg={
                    (status === 'completed' && isInn && hasTransaction) ||
                    (status === 'completed' && !isInn)
                      ? 'whiteAlpha.800'
                      : currentColors.cardBg
                  }
                  borderWidth={3}
                  borderColor={
                    isLocationLocked ? 'orange.500' : getNodeBorderColor(status, node)
                  }
                  cursor={isLocked || isLocationLocked ? 'not-allowed' : 'pointer'}
                  opacity={isLocked || isLocationLocked ? 0.7 : 1}
                  onClick={() => !isLocationLocked && handleNodeClick(node)}
                  _hover={
                    !isLocked && !isLocationLocked && (status !== 'locked' || adminMode)
                      ? { shadow: 'lg', transform: 'translateY(-2px)' }
                      : {}
                  }
                  transition="all 0.2s"
                  position="relative"
                >
                  <CardBody>
                    <HStack justify="space-between" align="start">
                      <HStack spacing={4} flex={1}>
                        {status === 'completed' && !isLocationLocked && (
                          <CheckCircleIcon color={currentColors.green.base} boxSize={6} />
                        )}
                        {(isLocked || isLocationLocked) && (
                          <LockIcon color="gray.400" boxSize={6} />
                        )}
                        {status === 'available' && (
                          <QuestionIcon color={currentColors.orange} boxSize={6} />
                        )}

                        <VStack align="start" spacing={2} flex={1}>
                          <HStack flexWrap="wrap">
                            {isLocked || isLocationLocked ? (
                              <>
                                {isLocationLocked ? (
                                  <>
                                    <Text
                                      fontWeight="semibold"
                                      fontSize="lg"
                                      color={currentColors.textColor}
                                    >
                                      {node.title}
                                    </Text>
                                    <Badge
                                      bg="orange.500"
                                      color="white"
                                      px={2}
                                      borderRadius="md"
                                    >
                                      LOCATION COMPLETED
                                    </Badge>
                                  </>
                                ) : (
                                  <>
                                    <RedactedText length="long" />
                                    <Badge
                                      bg={getNodeBorderColor(status, node)}
                                      color="white"
                                      px={2}
                                      borderRadius="md"
                                    >
                                      LOCKED
                                    </Badge>
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                <Text
                                  fontWeight="semibold"
                                  fontSize="lg"
                                  color={currentColors.textColor}
                                >
                                  {isInn ? '🏠 ' : ''}
                                  {node.title}
                                </Text>
                                <Badge
                                  bg={getNodeBorderColor(status, node)}
                                  color="white"
                                  px={2}
                                  borderRadius="md"
                                >
                                  {node.nodeType === 'STANDARD'
                                    ? getNodeBadge(node).toUpperCase()
                                    : node.nodeType}
                                </Badge>
                                {status !== 'completed' && node.rewards?.buffs?.length > 0 && (
                                  <Badge colorScheme="purple" fontSize="xs">
                                    🎁 Earn a Buff
                                  </Badge>
                                )}
                                {hasAffordableRewards && !adminMode && (
                                  <Badge colorScheme="yellow" fontSize="xs">
                                    💰 Rewards available - Click to trade
                                  </Badge>
                                )}
                                {isCompletedInn && hasTransaction && !adminMode && (
                                  <Badge colorScheme="green" fontSize="xs">
                                    ✅ Already purchased from this Inn
                                  </Badge>
                                )}
                                {hasBuffApplied && (
                                  <Badge colorScheme="green" fontSize="xs">
                                    💪 Buff Applied
                                  </Badge>
                                )}
                                {isCompletedInn &&
                                  !hasTransaction &&
                                  !hasAffordableRewards &&
                                  !adminMode && (
                                    <Badge colorScheme="gray" fontSize="xs">
                                      🙈 Not enough keys for trades
                                    </Badge>
                                  )}
                                {isAvailableWithBuffs && (
                                  <Badge colorScheme="blue" fontSize="xs">
                                    ✨ Can Apply A Buff
                                  </Badge>
                                )}
                                {adminMode && (
                                  <Badge
                                    colorScheme={status === 'completed' ? 'red' : 'green'}
                                    fontSize="xs"
                                  >
                                    Click to view
                                  </Badge>
                                )}
                              </>
                            )}
                          </HStack>

                          {isLocationLocked ? (
                            <VStack align="start" spacing={1} w="full">
                              <Text fontSize="sm" color="orange.500">
                                Your team completed:{' '}
                                <strong>{completedNodeInGroup?.title}</strong>
                              </Text>
                              <Text fontSize="xs" color={theme.colors.gray[500]}>
                                Only one difficulty per location can be completed
                              </Text>
                            </VStack>
                          ) : isLocked ? (
                            <VStack align="start" spacing={1} w="full">
                              <RedactedText length="full" />
                              <RedactedText length="long" />
                            </VStack>
                          ) : (
                            <VStack align="start" spacing={2} w="full">
                              <Text fontSize="sm" color={theme.colors.gray[600]}>
                                {node.description}
                              </Text>
                              {node.objective && status === 'available' && (
                                <Box
                                  w="full"
                                  p={2}
                                  bg={colorMode === 'dark' ? 'gray.700' : 'gray.100'}
                                  borderRadius="md"
                                >
                                  <Text
                                    fontSize="xs"
                                    fontWeight="semibold"
                                    color={currentColors.textColor}
                                  >
                                    Objective:
                                  </Text>
                                  <Text fontSize="sm" color={currentColors.textColor}>
                                    {OBJECTIVE_TYPES[node.objective.type]}:{' '}
                                    {node.objective.quantity} {node.objective.target}
                                  </Text>
                                  {node.objective?.appliedBuff && (
                                    <Badge colorScheme="blue" fontSize="xs" mt={1}>
                                      ✨ {node.objective.appliedBuff.buffName} applied (-
                                      {(node.objective.appliedBuff.reduction * 100).toFixed(0)}
                                      %)
                                    </Badge>
                                  )}
                                </Box>
                              )}
                              {isAvailableWithBuffs &&
                                adminMode &&
                                !node.objective?.appliedBuff && (
                                  <Button
                                    size="sm"
                                    colorScheme="blue"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenBuffModal(node);
                                    }}
                                    leftIcon={<Text>✨</Text>}
                                    w="full"
                                  >
                                    Apply Buff to Reduce Requirement
                                  </Button>
                                )}
                            </VStack>
                          )}
                        </VStack>
                      </HStack>

                      {(isLocked || isLocationLocked) && (
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          right={0}
                          bottom={0}
                          bg={
                            isLocationLocked
                              ? 'rgba(255, 140, 0, 0.1)'
                              : colorMode === 'dark'
                              ? 'rgba(0,0,0,0.3)'
                              : 'rgba(255,255,255,0.3)'
                          }
                          backdropFilter={isLocationLocked ? undefined : 'blur(2px)'}
                          borderRadius="md"
                          pointerEvents="none"
                        />
                      )}

                      {isLocked ? (
                        <VStack align="end" spacing={1}>
                          <RedactedText length="short" />
                          <HStack spacing={1}>
                            <RedactedText length="short" />
                          </HStack>
                        </VStack>
                      ) : (
                        node.rewards &&
                        !isInn &&
                        (adminMode || status === 'completed') && (
                          <VStack align="end" spacing={1}>
                            <Text fontWeight="semibold" color={currentColors.green.base}>
                              {formatGP(node.rewards.gp)}
                            </Text>
                            {node.rewards.keys?.length > 0 && (
                              <HStack spacing={1} flexWrap="wrap" justify="flex-end">
                                {node.rewards.keys.map((key, idx) => (
                                  <Badge key={idx} colorScheme={key.color} size="sm">
                                    {key.quantity} {key.color}
                                  </Badge>
                                ))}
                              </HStack>
                            )}
                          </VStack>
                        )
                      )}
                    </HStack>

                    {isLocked && (
                      <Box
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        bg={
                          colorMode === 'dark' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'
                        }
                        backdropFilter={isLocationLocked ? undefined : 'blur(2px)'}
                        borderRadius="md"
                        pointerEvents="none"
                      />
                    )}
                  </CardBody>
                </Card>
              );
            })}
        </VStack>
      </AccordionPanel>
    </AccordionItem>
  </Accordion>
);

export default AllNodesAccordion;
