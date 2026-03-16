import React, { useState } from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  Input,
  InputGroup,
  InputLeftElement,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Progress,
  Spinner,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, ExternalLinkIcon, SearchIcon } from '@chakra-ui/icons';
import { useQuery, useSubscription } from '@apollo/client';
import { OBJECTIVE_TYPES, applyTeamBuffToNode } from '../../utils/treasureHuntHelpers';
import NodeNoteEditor from './NodeNoteEditor';
import NodeProgressEditor from './NodeProgressEditor';
import AcceptableDropsList, { getAcceptableDropsForNode } from './AcceptableDropsList';
import theme from '../../theme';
import { NODE_PROGRESS_UPDATED_SUB } from '../../graphql/mutations';
import { GET_NODE_SUBMISSIONS } from '../../graphql/queries';

// ── Per-item component so each can independently lazy-fetch when opened ──────

const NodeSubmissionItem = ({
  nodeId,
  teamId,
  // For active (incomplete) nodes, full submission data comes from the parent query.
  // For completed nodes, this will be [] until the accordion is opened.
  prefetchedSubmissions,
  // Counts for the accordion header (used for completed-node summaries)
  pendingCount: summaryPendingCount,
  approvedCount: summaryApprovedCount,
  isCompleted,
  isOpen,
  event,
  currentColors,
  colorMode,
  isEventAdmin,
  isEventRef,
  setSubmissionToDeny,
  onDenialModalOpen,
  setNodeToComplete,
  onOpenCompleteDialog,
  handleReviewSubmission,
  progressOverrides,
  onProgressChange,
  confirmingKey,
  setConfirmingKey,
}) => {
  const itemKey = `${nodeId}_${teamId}`;

  // Lazy-fetch full submissions when a completed-node accordion is opened
  const { data: lazyData, loading: lazyLoading } = useQuery(GET_NODE_SUBMISSIONS, {
    variables: { nodeId, teamId },
    skip: !isCompleted || !isOpen,
  });

  const submissions = isCompleted
    ? lazyData?.getNodeSubmissions || []
    : prefetchedSubmissions;

  const pendingSubmissions = submissions.filter((s) => s.status === 'PENDING_REVIEW');
  const approvedSubmissions = submissions.filter((s) => s.status === 'APPROVED');
  const deniedSubmissions = submissions.filter((s) => s.status === 'DENIED');

  // For the accordion header badges, use loaded data when available, else summary counts
  const headerPendingCount = isCompleted && !isOpen
    ? summaryPendingCount
    : pendingSubmissions.length;
  const headerApprovedCount = isCompleted && !isOpen
    ? summaryApprovedCount
    : approvedSubmissions.length;

  const node = event.nodes?.find((n) => n.nodeId === nodeId);
  const nodeTitle = node ? node.title : nodeId;
  const nodeType = node ? node.nodeType : 'STANDARD';
  const team = event.teams?.find((t) => t.teamId === teamId);
  const effectiveNode = applyTeamBuffToNode(node, team?.nodeBuffs);
  const teamName = team?.teamName || submissions[0]?.team?.teamName || 'Unknown Team';

  const progress = progressOverrides[itemKey] ?? (team?.nodeProgress?.[nodeId] ?? 0);
  const qty = effectiveNode?.objective?.quantity ?? node?.objective?.quantity ?? 0;
  const pct = qty > 0 ? Math.min(100, Math.round((progress / qty) * 100)) : 0;

  return (
    <AccordionItem
      border="1px solid"
      borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
      borderRadius="md"
      mb={2}
      bg={currentColors.cardBg}
      opacity={isCompleted ? 0.75 : 1}
    >
      <h2>
        <AccordionButton
          _hover={{ bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50' }}
          py={4}
          flexDirection="column"
          alignItems="stretch"
        >
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align={{ base: 'stretch', md: 'start' }}
            w="100%"
            gap={3}
          >
            <VStack align="start" spacing={1} flex={1} minW={0}>
              <HStack flexWrap="nowrap" minW={0}>
                <AccordionIcon flexShrink={0} color={currentColors.textColor} />
                <Text
                  fontWeight="semibold"
                  fontSize={{ base: 'md', sm: 'lg' }}
                  color={currentColors.textColor}
                  noOfLines={1}
                  minW={0}
                  flex={1}
                >
                  {nodeType === 'INN' ? '🏠 ' : ''}
                  {nodeTitle}
                </Text>
                <Badge
                  bg={
                    nodeType === 'INN'
                      ? theme.colors.yellow.base
                      : nodeType === 'START'
                      ? currentColors.purple.base
                      : currentColors.turquoise.base
                  }
                  color="white"
                >
                  {nodeType}
                </Badge>
                {isCompleted && <Badge colorScheme="green">✅ COMPLETED</Badge>}
              </HStack>
              <HStack ml={6} flexWrap="wrap">
                <Badge bg={currentColors.purple.base} color="white">
                  {teamName}
                </Badge>
                {headerPendingCount > 0 && (
                  <Badge colorScheme="orange">{headerPendingCount} pending</Badge>
                )}
                {headerApprovedCount > 0 && (
                  <Badge colorScheme="green">{headerApprovedCount} approved</Badge>
                )}
                {deniedSubmissions.length > 0 && (
                  <Badge colorScheme="red">{deniedSubmissions.length} denied</Badge>
                )}
              </HStack>
              <Text ml={6} fontSize="xs" color="gray.500">
                Node ID: {nodeId}
              </Text>
            </VStack>

            {/* "Complete This Node" button — only for active (non-completed) nodes with approved subs */}
            {!isCompleted && approvedSubmissions.length > 0 && (
              <VStack
                spacing={1}
                align={{ base: 'stretch', md: 'end' }}
                onClick={(e) => e.stopPropagation()}
              >
                {confirmingKey === itemKey ? (
                  <>
                    <Text
                      fontSize="xs"
                      color="orange.400"
                      fontWeight="semibold"
                      textAlign={{ base: 'left', md: 'right' }}
                    >
                      Are you sure?
                    </Text>
                    <HStack>
                      <Button
                        size="sm"
                        colorScheme="green"
                        leftIcon={<CheckIcon />}
                        onClick={() => {
                          setConfirmingKey(null);
                          setNodeToComplete({
                            nodeId,
                            teamId,
                            nodeTitle,
                            teamName,
                          });
                          onOpenCompleteDialog();
                        }}
                      >
                        Confirm
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmingKey(null)}>
                        Cancel
                      </Button>
                    </HStack>
                  </>
                ) : (
                  <>
                    <Text
                      fontSize="xs"
                      textAlign={{ base: 'center', md: 'right' }}
                      color="gray.500"
                    >
                      Once objective met &amp; submissions approved:
                    </Text>
                    <Button
                      size={{ base: 'xs', md: 'sm' }}
                      colorScheme="green"
                      leftIcon={<CheckIcon />}
                      w="fit-content"
                      m={{ base: '0 auto', md: 0 }}
                      onClick={() => setConfirmingKey(itemKey)}
                    >
                      Complete This Node
                    </Button>
                    <Text fontSize="xs" color="gray.500">
                      Grant rewards
                    </Text>
                  </>
                )}
              </VStack>
            )}
          </Flex>

          {qty > 0 && progress > 0 && (
            <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}>
              {progress.toLocaleString()} / {qty.toLocaleString()} ({pct}%)
            </Text>
          )}

          {!isCompleted && effectiveNode?.objective?.quantity && progress > 0 && (
            <Progress
              value={Math.min(100, Math.round((progress / effectiveNode.objective.quantity) * 100))}
              size="xs"
              colorScheme={isCompleted ? 'gray' : 'green'}
              borderRadius="none"
              mt={2}
              mx={-4}
              mb={-4}
              bg={colorMode === 'dark' ? 'gray.700' : 'gray.200'}
            />
          )}
        </AccordionButton>
      </h2>

      <AccordionPanel pb={4}>
        {isCompleted && lazyLoading ? (
          <Flex justify="center" py={4}>
            <Spinner size="sm" />
          </Flex>
        ) : (
          <VStack align="stretch" spacing={3}>
            {effectiveNode?.objective && (
              <Box
                p={2}
                bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
                borderRadius="md"
              >
                <Text fontSize="xs" fontWeight="semibold" color={currentColors.textColor}>
                  Objective:
                </Text>
                <Text fontSize="xs" color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}>
                  {OBJECTIVE_TYPES[effectiveNode.objective.type]}:{' '}
                  {effectiveNode.objective.quantity?.toLocaleString()}{' '}
                  {effectiveNode.objective.target}
                </Text>
                {effectiveNode.objective.appliedBuff && (
                  <Badge colorScheme="blue" fontSize="xs" mt={1}>
                    ✨ Buff Applied: -
                    {(effectiveNode.objective.appliedBuff.reduction * 100).toFixed(0)}%
                  </Badge>
                )}
              </Box>
            )}

            {effectiveNode?.objective?.type === 'item_collection' &&
              (() => {
                const drops = getAcceptableDropsForNode(effectiveNode.objective);
                return drops?.length > 0 ? (
                  <AcceptableDropsList
                    drops={drops}
                    colorMode={colorMode}
                    currentColors={currentColors}
                  />
                ) : null;
              })()}

            {isCompleted && (
              <Box p={2} bg={currentColors.green.base} color="white" borderRadius="md">
                <Text fontSize="xs" fontWeight="semibold">
                  ℹ️ This node is already completed. Submissions can still be reviewed for
                  record-keeping.
                </Text>
              </Box>
            )}

            {submissions.length === 0 && !lazyLoading && (
              <Text fontSize="xs" color="gray.500" textAlign="center" py={2}>
                No submissions found for this node.
              </Text>
            )}

            <VStack align="stretch" spacing={2}>
              {[...submissions]
                .sort((a, b) => {
                  const order = { PENDING_REVIEW: 0, APPROVED: 1, DENIED: 2 };
                  return order[a.status] - order[b.status];
                })
                .map((submission) => (
                  <Box
                    key={submission.submissionId}
                    p={3}
                    bg={
                      submission.status === 'APPROVED'
                        ? colorMode === 'dark'
                          ? 'green.900'
                          : 'green.50'
                        : submission.status === 'DENIED'
                        ? colorMode === 'dark'
                          ? 'red.900'
                          : 'red.50'
                        : colorMode === 'dark'
                        ? '#1A202C'
                        : '#F7FAFC'
                    }
                    borderRadius="md"
                    borderWidth={submission.status === 'APPROVED' ? 2 : 1}
                    borderColor={
                      submission.status === 'APPROVED'
                        ? currentColors.green.base
                        : submission.status === 'DENIED'
                        ? currentColors.red
                        : 'transparent'
                    }
                  >
                    <Flex
                      direction={{ base: 'column', sm: 'row' }}
                      justify="space-between"
                      align={{ base: 'stretch', sm: 'start' }}
                      mb={2}
                      gap={2}
                    >
                      <VStack align="start" spacing={0} flex={1} minW={0}>
                        <HStack flexWrap="wrap">
                          <Text
                            fontSize="sm"
                            fontWeight="semibold"
                            color={currentColors.textColor}
                          >
                            {submission.submittedByUsername}
                          </Text>
                          <Text
                            fontSize="xs"
                            color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}
                          >
                            ID: {submission.submittedBy}
                          </Text>
                          {submission.status !== 'PENDING_REVIEW' && (
                            <Badge
                              colorScheme={submission.status === 'APPROVED' ? 'green' : 'red'}
                              fontSize="xs"
                            >
                              {submission.status}
                            </Badge>
                          )}
                        </HStack>
                        <Text
                          fontSize="xs"
                          color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                        >
                          {new Date(submission.submittedAt).toLocaleString()}
                        </Text>
                        {submission.reviewedAt && (
                          <Text
                            fontSize="xs"
                            color={colorMode === 'dark' ? 'gray.500' : 'gray.600'}
                          >
                            {submission.status === 'APPROVED' ? 'Approved' : 'Reviewed'} by{' '}
                            {submission.reviewedBy} •{' '}
                            {new Date(submission.reviewedAt).toLocaleString()}
                          </Text>
                        )}
                      </VStack>
                    </Flex>
                    <HStack justify="space-between">
                      <Button
                        leftIcon={<ExternalLinkIcon />}
                        size="sm"
                        variant="outline"
                        as="a"
                        href={submission.proofUrl}
                        target="_blank"
                        color={currentColors.textColor}
                      >
                        View Proof
                      </Button>
                      {submission.status === 'PENDING_REVIEW' && (
                        <HStack>
                          <Tooltip label="Deny Submission">
                            <IconButton
                              icon={<CloseIcon />}
                              colorScheme="red"
                              size="sm"
                              onClick={() => {
                                setSubmissionToDeny(submission);
                                onDenialModalOpen();
                              }}
                            />
                          </Tooltip>
                          <Tooltip label="Approve Submission">
                            <IconButton
                              icon={<CheckIcon />}
                              colorScheme="green"
                              size="sm"
                              onClick={() =>
                                handleReviewSubmission(submission.submissionId, true)
                              }
                            />
                          </Tooltip>
                        </HStack>
                      )}
                    </HStack>
                  </Box>
                ))}
            </VStack>

            {effectiveNode?.objective?.quantity && (
              <NodeProgressEditor
                eventId={event.eventId}
                teamId={teamId}
                nodeId={nodeId}
                objectiveQuantity={effectiveNode.objective.quantity}
                objectiveType={effectiveNode.objective.type}
                currentProgress={team?.nodeProgress?.[nodeId] ?? 0}
                isAdmin={isEventAdmin || isEventRef}
                onProgressChange={(val) => onProgressChange(itemKey, val)}
              />
            )}

            <NodeNoteEditor
              eventId={event.eventId}
              teamId={teamId}
              nodeId={nodeId}
              initialComments={team?.nodeNotes?.[nodeId] || []}
              isAdmin={isEventAdmin}
            />
          </VStack>
        )}
      </AccordionPanel>
    </AccordionItem>
  );
};

// ── Main SubmissionsTab ───────────────────────────────────────────────────────

const SubmissionsTab = ({
  allSubmissions,
  completedNodeSummaries = [],
  event,
  currentColors,
  colorMode,
  isEventAdmin,
  isEventRef,
  setSubmissionToDeny,
  onDenialModalOpen,
  setNodeToComplete,
  onOpenCompleteDialog,
  handleReviewSubmission,
}) => {
  const [confirmingKey, setConfirmingKey] = useState(null);
  const [progressOverrides, setProgressOverrides] = useState({});
  const [openKeys, setOpenKeys] = useState(new Set());
  const [showAllCompleted, setShowAllCompleted] = useState(false);
  const [search, setSearch] = useState('');

  const COMPLETED_PAGE_SIZE = 5;

  useSubscription(NODE_PROGRESS_UPDATED_SUB, {
    variables: { eventId: event.eventId },
    onData: ({ data }) => {
      const update = data.data?.nodeProgressUpdated;
      if (!update) return;
      const key = `${update.nodeId}_${update.teamId}`;
      setProgressOverrides((prev) => ({ ...prev, [key]: update.value }));
    },
  });

  const handleProgressChange = (key, val) => {
    setProgressOverrides((prev) => ({ ...prev, [key]: val }));
  };

  // Build active groups from allSubmissions (incomplete nodes only)
  const groupedSubmissions = {};
  allSubmissions.forEach((s) => {
    const key = `${s.nodeId}_${s.team?.teamId}`;
    if (!groupedSubmissions[key]) groupedSubmissions[key] = [];
    groupedSubmissions[key].push(s);
  });

  const activeGroups = Object.entries(groupedSubmissions)
    .filter(([, subs]) => subs.some((s) => s.status === 'PENDING_REVIEW' || s.status === 'APPROVED'))
    .sort((a, b) => {
      const latestA = Math.max(...a[1].map((s) => new Date(s.submittedAt || 0).getTime()));
      const latestB = Math.max(...b[1].map((s) => new Date(s.submittedAt || 0).getTime()));
      return latestB - latestA;
    })
    .map(([key, subs]) => ({
      key,
      nodeId: subs[0].nodeId,
      teamId: subs[0].team?.teamId,
      prefetchedSubmissions: subs,
      isCompleted: false,
      pendingCount: subs.filter((s) => s.status === 'PENDING_REVIEW').length,
      approvedCount: subs.filter((s) => s.status === 'APPROVED').length,
    }));

  // Build completed-node entries from the lightweight summaries
  const completedGroups = completedNodeSummaries.map((summary) => ({
    key: `${summary.nodeId}_${summary.teamId}`,
    nodeId: summary.nodeId,
    teamId: summary.teamId,
    prefetchedSubmissions: [],
    isCompleted: true,
    pendingCount: summary.pendingCount,
    approvedCount: summary.approvedCount,
  }));

  const nodeTitle = (nodeId) =>
    (event.nodes?.find((n) => n.nodeId === nodeId)?.title || nodeId).toLowerCase();

  const q = search.trim().toLowerCase();
  const filteredActiveGroups = q
    ? activeGroups.filter((g) => nodeTitle(g.nodeId).includes(q))
    : activeGroups;
  const filteredCompletedGroups = q
    ? completedGroups.filter((g) => nodeTitle(g.nodeId).includes(q))
    : completedGroups;

  const visibleCompletedGroups = showAllCompleted
    ? filteredCompletedGroups
    : filteredCompletedGroups.slice(0, COMPLETED_PAGE_SIZE);

  const allItems = [...filteredActiveGroups, ...visibleCompletedGroups];

  // Key-based open tracking so indices don't go stale when active groups shift in
  const controlledIndices = allItems.reduce((acc, item, i) => {
    if (openKeys.has(item.key)) acc.push(i);
    return acc;
  }, []);

  const handleAccordionChange = (newIndices) => {
    setOpenKeys(new Set(newIndices.map((i) => allItems[i]?.key).filter(Boolean)));
  };

  return (
    <VStack spacing={4} align="stretch">
      <Box bg={currentColors.turquoise.base} color="white" p={3} borderRadius="md">
        <Text fontWeight="semibold" fontSize="sm" mb={1}>
          📋 Submission Review Workflow
        </Text>
        <Text fontSize="xs">
          1. Review and approve/deny individual submissions below
          <br />
          2. Track progress toward node objectives
          <br />
          3. When cumulative goal is met, complete the node to grant rewards and unlock next nodes
        </Text>
      </Box>

      {(activeGroups.length + completedGroups.length) > 0 && (
        <InputGroup size="sm">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Filter by node name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            bg={colorMode === 'dark' ? 'gray.700' : 'white'}
            borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
            color={currentColors.textColor}
          />
        </InputGroup>
      )}

      {allItems.length === 0 ? (
        <Text color={currentColors.white} textAlign="center" py={8}>
          {q ? `No submissions matching "${search}"` : 'No pending submissions'}
        </Text>
      ) : (
        <>
        <Accordion allowMultiple index={controlledIndices} onChange={handleAccordionChange}>
          {allItems.map((item, i) => (
            <NodeSubmissionItem
              key={item.key}
              nodeId={item.nodeId}
              teamId={item.teamId}
              prefetchedSubmissions={item.prefetchedSubmissions}
              pendingCount={item.pendingCount}
              approvedCount={item.approvedCount}
              isCompleted={item.isCompleted}
              isOpen={openKeys.has(item.key)}
              event={event}
              currentColors={currentColors}
              colorMode={colorMode}
              isEventAdmin={isEventAdmin}
              isEventRef={isEventRef}
              setSubmissionToDeny={setSubmissionToDeny}
              onDenialModalOpen={onDenialModalOpen}
              setNodeToComplete={setNodeToComplete}
              onOpenCompleteDialog={onOpenCompleteDialog}
              handleReviewSubmission={handleReviewSubmission}
              progressOverrides={progressOverrides}
              onProgressChange={handleProgressChange}
              confirmingKey={confirmingKey}
              setConfirmingKey={setConfirmingKey}
            />
          ))}
        </Accordion>
        {filteredCompletedGroups.length > COMPLETED_PAGE_SIZE && (
          <Button
            size="sm"
            variant="ghost"
            color={colorMode === 'dark' ? 'gray.400' : 'gray.500'}
            onClick={() => setShowAllCompleted((v) => !v)}
            w="100%"
          >
            {showAllCompleted
              ? 'Show fewer completed nodes'
              : `Show ${filteredCompletedGroups.length - COMPLETED_PAGE_SIZE} more completed nodes`}
          </Button>
        )}
        </>
      )}
    </VStack>
  );
};

export default SubmissionsTab;
