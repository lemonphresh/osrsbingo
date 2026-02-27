// File: src/organisms/TreasureHunt/PlayerSubmissionsPanel.jsx
import React, { useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Collapse,
  useDisclosure,
  IconButton,
  Tooltip,
  Link,
  Spinner,
  useColorMode,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, TimeIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { FaClipboardList, FaClock, FaCheck, FaTimes } from 'react-icons/fa';

const PlayerSubmissionsPanel = ({ submissions = [], nodes = [], teamId, loading = false }) => {
  const { colorMode } = useColorMode();
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });

  const colors = {
    dark: {
      bg: 'gray.800',
      cardBg: 'gray.700',
      text: 'white',
      subtext: 'gray.300',
      success: 'green.400',
      warning: 'orange.400',
      error: 'red.400',
      pending: 'yellow.400',
      border: 'gray.600',
    },
    light: {
      bg: 'white',
      cardBg: 'gray.50',
      text: 'gray.800',
      subtext: 'gray.600',
      success: 'green.500',
      warning: 'orange.500',
      error: 'red.500',
      pending: 'yellow.500',
      border: 'gray.200',
    },
  };

  const c = colors[colorMode];

  // Filter submissions for this team and sort by date
  const teamSubmissions = useMemo(() => {
    return submissions
      .filter((s) => s.teamId === teamId || s.team?.teamId === teamId)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 10); // Show last 10
  }, [submissions, teamId]);

  // Count by status
  const counts = useMemo(() => {
    const pending = teamSubmissions.filter((s) => s.status === 'PENDING_REVIEW').length;
    const approved = teamSubmissions.filter((s) => s.status === 'APPROVED').length;
    const denied = teamSubmissions.filter((s) => s.status === 'DENIED').length;
    return { pending, approved, denied, total: teamSubmissions.length };
  }, [teamSubmissions]);

  // Get node title by ID
  const getNodeTitle = (nodeId) => {
    const node = nodes.find((n) => n.nodeId === nodeId);
    return node?.title || nodeId;
  };

  // Format relative time
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return {
          color: c.pending,
          bg: colorMode === 'dark' ? 'yellow.900' : 'yellow.50',
          icon: FaClock,
          label: 'Pending',
          description: 'Awaiting admin review',
        };
      case 'APPROVED':
        return {
          color: c.success,
          bg: colorMode === 'dark' ? 'green.900' : 'green.50',
          icon: FaCheck,
          label: 'Approved',
          description: 'Submission accepted',
        };
      case 'DENIED':
        return {
          color: c.error,
          bg: colorMode === 'dark' ? 'red.900' : 'red.50',
          icon: FaTimes,
          label: 'Denied',
          description: 'Submission rejected',
        };
      default:
        return {
          color: c.subtext,
          bg: c.cardBg,
          icon: TimeIcon,
          label: status,
          description: '',
        };
    }
  };

  // Don't render if no submissions
  if (!loading && teamSubmissions.length === 0) {
    return null;
  }

  return (
    <Box
      bg={c.cardBg}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={counts.pending > 0 ? c.pending : c.border}
      overflow="hidden"
      maxW="600px"
      margin="0 auto"
      w="100%"
    >
      {/* Header */}
      <HStack
        p={3}
        bg={counts.pending > 0 ? (colorMode === 'dark' ? 'yellow.900' : 'yellow.50') : c.bg}
        justify="space-between"
        cursor="pointer"
        onClick={onToggle}
        _hover={{ opacity: 0.9 }}
      >
        <HStack spacing={3}>
          <Icon
            as={FaClipboardList}
            color={counts.pending > 0 ? c.pending : c.subtext}
            boxSize={5}
          />
          <VStack align="start" spacing={0}>
            <Text fontWeight="semibold" fontSize="sm" color={c.text}>
              This Team's Submissions
            </Text>
            <HStack spacing={2} fontSize="xs">
              {counts.pending > 0 && (
                <Badge colorScheme="yellow" variant="solid">
                  {counts.pending} pending
                </Badge>
              )}
              {counts.approved > 0 && (
                <Badge colorScheme="green" variant="subtle">
                  {counts.approved} approved
                </Badge>
              )}
              {counts.denied > 0 && (
                <Badge colorScheme="red" variant="subtle">
                  {counts.denied} denied
                </Badge>
              )}
            </HStack>
          </VStack>
        </HStack>

        <IconButton
          icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          size="sm"
          variant="ghost"
          aria-label={isOpen ? 'Collapse' : 'Expand'}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
        />
      </HStack>

      {/* Content */}
      <Collapse in={isOpen} animateOpacity>
        <VStack
          css={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#4A5568',
              borderRadius: '10px',
              '&:hover': {
                background: '#718096',
              },
            },
            scrollbarWidth: 'thin',
            scrollbarColor: '#4A5568 transparent',
          }}
          p={3}
          spacing={2}
          align="stretch"
          maxH="300px"
          overflowY="auto"
        >
          {loading ? (
            <HStack justify="center" py={4}>
              <Spinner size="sm" />
              <Text fontSize="sm" color={c.subtext}>
                Loading submissions...
              </Text>
            </HStack>
          ) : (
            teamSubmissions.map((submission) => {
              const statusConfig = getStatusConfig(submission.status);
              const nodeTitle = getNodeTitle(submission.nodeId);

              return (
                <Box
                  key={submission.submissionId}
                  p={3}
                  bg={statusConfig.bg}
                  borderRadius="md"
                  borderLeft="3px solid"
                  borderLeftColor={statusConfig.color}
                >
                  <HStack justify="space-between" align="start">
                    <HStack spacing={3} flex={1}>
                      <Icon as={statusConfig.icon} color={statusConfig.color} boxSize={4} />
                      <VStack align="start" spacing={0} flex={1}>
                        <HStack>
                          <Text fontSize="sm" fontWeight="medium" color={c.text} noOfLines={1}>
                            {nodeTitle}
                          </Text>
                          <Badge
                            colorScheme={
                              submission.status === 'PENDING_REVIEW'
                                ? 'yellow'
                                : submission.status === 'APPROVED'
                                ? 'green'
                                : 'red'
                            }
                            fontSize="xs"
                          >
                            {statusConfig.label}
                          </Badge>
                        </HStack>
                        <HStack spacing={2} fontSize="xs" color={c.subtext}>
                          <Text>{formatTimeAgo(submission.submittedAt)}</Text>
                          {submission.submittedByUsername && (
                            <>
                              <Text>•</Text>
                              <Text>by {submission.submittedByUsername}</Text>
                            </>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>

                    {/* Proof link */}
                    {submission.proofUrl && (
                      <Tooltip label="View proof" hasArrow>
                        <Link href={submission.proofUrl} isExternal>
                          <IconButton
                            icon={<ExternalLinkIcon />}
                            size="xs"
                            variant="ghost"
                            aria-label="View proof"
                          />
                        </Link>
                      </Tooltip>
                    )}
                  </HStack>

                  {/* Show denial reason if denied */}
                  {submission.status === 'DENIED' && submission.denialReason && (
                    <Box
                      mt={2}
                      p={2}
                      bg={colorMode === 'dark' ? 'red.800' : 'red.100'}
                      borderRadius="sm"
                    >
                      <Text fontSize="xs" color={c.error}>
                        <strong>Reason:</strong> {submission.denialReason}
                      </Text>
                    </Box>
                  )}

                  {/* Pending message */}
                  {submission.status === 'PENDING_REVIEW' && (
                    <Text fontSize="xs" color={c.subtext} mt={1}>
                      ⏳ An admin will review this soon
                    </Text>
                  )}
                </Box>
              );
            })
          )}

          {/* Empty state - shouldn't show due to early return, but just in case */}
          {!loading && teamSubmissions.length === 0 && (
            <Box py={4} textAlign="center">
              <Text fontSize="sm" color={c.subtext}>
                No submissions yet
              </Text>
              <Text fontSize="xs" color={c.subtext} mt={1}>
                Submit completions via Discord using <code>!submit</code>
              </Text>
            </Box>
          )}
        </VStack>
      </Collapse>
    </Box>
  );
};

export default PlayerSubmissionsPanel;
