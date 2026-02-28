import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Box,
  Button,
  HStack,
  IconButton,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { CheckIcon, CloseIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { OBJECTIVE_TYPES } from '../../utils/treasureHuntHelpers';
import NodeNoteEditor from './NodeNoteEditor';
import theme from '../../theme';

const SubmissionsTab = ({
  allSubmissions,
  event,
  currentColors,
  colorMode,
  isEventAdmin,
  setSubmissionToDeny,
  onDenialModalOpen,
  setNodeToComplete,
  onOpenCompleteDialog,
  handleReviewSubmission,
}) => {
  const groupedSubmissions = {};
  allSubmissions.forEach((s) => {
    const key = `${s.nodeId}_${s.team?.teamId}`;
    if (!groupedSubmissions[key]) groupedSubmissions[key] = [];
    groupedSubmissions[key].push(s);
  });

  const relevantGroups = Object.entries(groupedSubmissions).filter(([, subs]) =>
    subs.some((s) => s.status === 'PENDING_REVIEW' || s.status === 'APPROVED')
  );

  const sortedGroups = [...relevantGroups].sort((a, b) => {
    const [, subsA] = a;
    const [, subsB] = b;
    const nodeIdA = subsA[0].nodeId;
    const teamA = event.teams?.find((t) => t.teamId === subsA[0].team?.teamId);
    const isCompletedA = teamA?.completedNodes?.includes(nodeIdA);
    const nodeIdB = subsB[0].nodeId;
    const teamB = event.teams?.find((t) => t.teamId === subsB[0].team?.teamId);
    const isCompletedB = teamB?.completedNodes?.includes(nodeIdB);
    if (isCompletedA !== isCompletedB) return isCompletedA ? 1 : -1;
    const pendA = subsA.filter((s) => s.status === 'PENDING_REVIEW').length;
    const pendB = subsB.filter((s) => s.status === 'PENDING_REVIEW').length;
    if (pendA !== pendB) return pendB - pendA;
    const latestA = Math.max(...subsA.map((s) => new Date(s.submittedAt || 0).getTime()));
    const latestB = Math.max(...subsB.map((s) => new Date(s.submittedAt || 0).getTime()));
    return latestB - latestA;
  });

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

      {sortedGroups.length === 0 ? (
        <Text color={currentColors.white} textAlign="center" py={8}>
          No pending submissions
        </Text>
      ) : (
        <Accordion allowMultiple>
          {sortedGroups.map(([key, submissions]) => {
            const nodeId = submissions[0].nodeId;
            const node = event.nodes?.find((n) => n.nodeId === nodeId);
            const nodeTitle = node ? node.title : nodeId;
            const nodeType = node ? node.nodeType : 'STANDARD';
            const teamId = submissions[0].team?.teamId;
            const team = event.teams?.find((t) => t.teamId === teamId);
            const isCompleted = team?.completedNodes?.includes(nodeId);
            const pendingSubmissions = submissions.filter((s) => s.status === 'PENDING_REVIEW');
            const approvedSubmissions = submissions.filter((s) => s.status === 'APPROVED');
            const deniedSubmissions = submissions.filter((s) => s.status === 'DENIED');

            return (
              <AccordionItem
                key={key}
                border="1px solid"
                borderColor={colorMode === 'dark' ? 'gray.600' : 'gray.200'}
                borderRadius="md"
                mb={2}
                bg={currentColors.cardBg}
                opacity={isCompleted ? 0.75 : 1}
              >
                <h2>
                  <AccordionButton
                    _hover={{
                      bg: colorMode === 'dark' ? 'whiteAlpha.50' : 'blackAlpha.50',
                    }}
                    py={4}
                  >
                    <HStack justify="space-between" align="start" flex={1}>
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack>
                          <AccordionIcon color={currentColors.textColor} />
                          <Text fontWeight="semibold" fontSize="lg" color={currentColors.textColor}>
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
                        <HStack ml={6}>
                          <Badge bg={currentColors.purple.base} color="white">
                            {submissions[0].team?.teamName || 'Unknown Team'}
                          </Badge>
                          {pendingSubmissions.length > 0 && (
                            <Badge colorScheme="orange">{pendingSubmissions.length} pending</Badge>
                          )}
                          {approvedSubmissions.length > 0 && (
                            <Badge colorScheme="green">{approvedSubmissions.length} approved</Badge>
                          )}
                          {deniedSubmissions.length > 0 && (
                            <Badge colorScheme="red">{deniedSubmissions.length} denied</Badge>
                          )}
                        </HStack>
                        <Text ml={6} fontSize="xs" color="gray.500">
                          Node ID: {nodeId}
                        </Text>
                      </VStack>

                      {!isCompleted && approvedSubmissions.length > 0 && (
                        <VStack
                          spacing={1}
                          align="end"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Text
                            fontSize="14px"
                            lineHeight="16px"
                            textAlign="right"
                            color="gray.700"
                            mb="4px"
                          >
                            Once the objective is completed <br />
                            and submissions approved:
                          </Text>
                          <Button
                            size="sm"
                            colorScheme="green"
                            leftIcon={<CheckIcon />}
                            onClick={() => {
                              setNodeToComplete({
                                nodeId,
                                teamId,
                                nodeTitle,
                                teamName: submissions[0].team?.teamName || team?.teamName,
                              });
                              onOpenCompleteDialog();
                            }}
                          >
                            Complete This Node
                          </Button>
                          <Text fontSize="xs" color="gray.500">
                            Grant rewards
                          </Text>
                        </VStack>
                      )}
                    </HStack>
                  </AccordionButton>
                </h2>

                <AccordionPanel pb={4}>
                  <VStack align="stretch" spacing={3}>
                    {node?.objective && (
                      <Box
                        p={2}
                        bg={colorMode === 'dark' ? 'whiteAlpha.100' : 'blackAlpha.50'}
                        borderRadius="md"
                      >
                        <Text
                          fontSize="xs"
                          fontWeight="semibold"
                          color={currentColors.textColor}
                        >
                          Objective:
                        </Text>
                        <Text
                          fontSize="xs"
                          color={colorMode === 'dark' ? 'gray.400' : 'gray.600'}
                        >
                          {OBJECTIVE_TYPES[node.objective.type]}: {node.objective.quantity}{' '}
                          {node.objective.target}
                        </Text>
                        {node.objective.appliedBuff && (
                          <Badge colorScheme="blue" fontSize="xs" mt={1}>
                            ✨ Buff Applied: -
                            {(node.objective.appliedBuff.reduction * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </Box>
                    )}

                    {isCompleted && (
                      <Box
                        p={2}
                        bg={currentColors.green.base}
                        color="white"
                        borderRadius="md"
                      >
                        <Text fontSize="xs" fontWeight="semibold">
                          ℹ️ This node is already completed. Submissions can still be reviewed for
                          record-keeping.
                        </Text>
                      </Box>
                    )}

                    <VStack align="stretch" spacing={2}>
                      {submissions
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
                            <HStack justify="space-between" mb={2}>
                              <VStack align="start" spacing={0}>
                                <HStack>
                                  <Text
                                    fontSize="sm"
                                    fontWeight="semibold"
                                    color={currentColors.textColor}
                                  >
                                    Submitted by {submission.submittedByUsername} (ID:{' '}
                                    {submission.submittedBy})
                                  </Text>
                                  {submission.status !== 'PENDING_REVIEW' && (
                                    <Badge
                                      colorScheme={
                                        submission.status === 'APPROVED' ? 'green' : 'red'
                                      }
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
                                    Reviewed: {new Date(submission.reviewedAt).toLocaleString()}
                                  </Text>
                                )}
                              </VStack>
                            </HStack>
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

                    {/* Admin / Ref Notes */}
                    <NodeNoteEditor
                      eventId={event.eventId}
                      teamId={teamId}
                      nodeId={nodeId}
                      initialComments={team?.nodeNotes?.[nodeId] || []}
                      isAdmin={isEventAdmin}
                    />
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </VStack>
  );
};

export default SubmissionsTab;
