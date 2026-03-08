import React, { useState } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import {
  Box, VStack, HStack, Text, Button, Badge, Tabs, TabList, Tab, TabPanels, TabPanel,
  Link, Select, SimpleGrid, Spinner, Center, Input,
} from '@chakra-ui/react';
import {
  GET_CLAN_WARS_SUBMISSIONS,
  REVIEW_CLAN_WARS_SUBMISSION,
  CLAN_WARS_SUBMISSION_ADDED, CLAN_WARS_SUBMISSION_REVIEWED,
  UPDATE_CLAN_WARS_EVENT_STATUS,
} from '../../graphql/clanWarsOperations';
import { useAuth } from '../../providers/AuthProvider';
import { useToastContext } from '../../providers/ToastProvider';
import { useThemeColors } from '../../hooks/useThemeColors';
import AdminEventPanel from './AdminEventPanel';
import WarChestPanel from './WarChestPanel';

const RARITY_COLORS = { common: 'gray', uncommon: 'green', rare: 'blue', epic: 'purple' };
const PVMER_SLOTS = ['weapon', 'helm', 'chest', 'legs', 'gloves', 'boots'];

function SubmissionCard({ submission, isAdmin, onReview }) {
  const { colors } = useThemeColors();
  const [rewardSlot, setRewardSlot] = useState('weapon');
  const [denialReason, setDenialReason] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPending = submission.status === 'PENDING';

  const handleReview = async (approved) => {
    setLoading(true);
    try {
      await onReview({
        submissionId: submission.submissionId,
        approved,
        rewardSlot: approved && submission.role === 'PVMER' ? rewardSlot : undefined,
        denialReason: !approved ? denialReason : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box bg={colors.cardBg} border="1px solid" borderColor="gray.600" borderRadius="md" p={4}>
      <HStack justify="space-between" mb={2}>
        <VStack align="flex-start" spacing={0}>
          <HStack>
            <Badge colorScheme={submission.status === 'APPROVED' ? 'green' : submission.status === 'DENIED' ? 'red' : 'yellow'}>
              {submission.status}
            </Badge>
            <Badge colorScheme={submission.role === 'PVMER' ? 'orange' : 'teal'} fontSize="xs">{submission.role}</Badge>
            <Badge colorScheme={submission.difficulty === 'hard' ? 'red' : submission.difficulty === 'medium' ? 'yellow' : 'green'} fontSize="xs">
              {submission.difficulty}
            </Badge>
          </HStack>
          <Text fontWeight="medium" fontSize="sm" mt={1}>{submission.taskLabel ?? submission.taskId}</Text>
          <Text fontSize="xs" color="gray.500">
            {submission.submittedUsername ?? submission.submittedBy} ·{' '}
            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : ''}
          </Text>
        </VStack>

        {submission.proofUrl && (
          <Link href={submission.proofUrl} isExternal>
            <Button size="xs" colorScheme="blue" variant="outline">View Proof</Button>
          </Link>
        )}
      </HStack>

      {submission.status === 'APPROVED' && submission.rewardItem && (
        <HStack mt={2} p={2} bg={colors.background} borderRadius="md">
          <Text fontSize="xs">Rewarded:</Text>
          <Badge colorScheme={RARITY_COLORS[submission.rewardItem.rarity]}>{submission.rewardItem.rarity}</Badge>
          <Text fontSize="xs" fontWeight="medium">{submission.rewardItem.name}</Text>
          <Text fontSize="xs" color="gray.500">({submission.rewardItem.slot})</Text>
        </HStack>
      )}

      {submission.status === 'DENIED' && submission.reviewNote && (
        <Text fontSize="xs" color="red.400" mt={2}>Denied: {submission.reviewNote}</Text>
      )}

      {isAdmin && isPending && (
        <VStack align="stretch" spacing={2} mt={3} pt={3} borderTop="1px solid" borderColor="gray.600">
          {submission.role === 'PVMER' && (
            <HStack>
              <Text fontSize="xs" color="gray.500">Reward Slot:</Text>
              <Select size="xs" value={rewardSlot} onChange={(e) => setRewardSlot(e.target.value)} w="auto">
                {PVMER_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </HStack>
          )}
          <HStack spacing={2}>
            <Button size="sm" colorScheme="green" isLoading={loading} onClick={() => handleReview(true)} flex={1}>
              ✓ Approve
            </Button>
            <Button size="sm" colorScheme="red" variant="outline" isLoading={loading} onClick={() => setExpanded(!expanded)} flex={1}>
              ✗ Deny
            </Button>
          </HStack>
          {expanded && (
            <VStack align="stretch" spacing={2}>
              <Input size="sm" placeholder="Denial reason (shown to player)" value={denialReason} onChange={(e) => setDenialReason(e.target.value)} />
              <Button size="sm" colorScheme="red" isLoading={loading} onClick={() => handleReview(false)}>
                Confirm Denial
              </Button>
            </VStack>
          )}
        </VStack>
      )}
    </Box>
  );
}

export default function GatheringPhase({ event, isAdmin, refetch }) {
  const { user } = useAuth();
  const { showToast } = useToastContext();
  const [statusFilter, setStatusFilter] = useState('PENDING');

  const { data: subsData, refetch: refetchSubs } = useQuery(GET_CLAN_WARS_SUBMISSIONS, {
    variables: { eventId: event.eventId, status: statusFilter || undefined },
    fetchPolicy: 'cache-and-network',
  });

  const [reviewSubmission] = useMutation(REVIEW_CLAN_WARS_SUBMISSION, {
    onCompleted: () => { refetchSubs(); showToast('Submission reviewed', 'success'); },
    onError: (err) => showToast(err.message, 'error'),
  });

  const [advancePhase] = useMutation(UPDATE_CLAN_WARS_EVENT_STATUS, { onCompleted: refetch });

  useSubscription(CLAN_WARS_SUBMISSION_ADDED, {
    variables: { eventId: event.eventId },
    onData: () => { refetchSubs(); showToast('New submission!', 'info'); },
  });
  useSubscription(CLAN_WARS_SUBMISSION_REVIEWED, {
    variables: { eventId: event.eventId },
    onData: () => refetchSubs(),
  });

  const submissions = subsData?.getClanWarsSubmissions ?? [];

  const handleReview = async ({ submissionId, approved, rewardSlot, denialReason }) => {
    await reviewSubmission({
      variables: {
        submissionId,
        approved,
        reviewerId: String(user?.id ?? user?.discordUserId ?? 'admin'),
        rewardSlot: rewardSlot ?? null,
        denialReason: denialReason ?? null,
      },
    });
  };

  const pendingCount = submissions.filter((s) => s.status === 'PENDING').length;

  const gatheringEnd = event.gatheringEnd ? new Date(event.gatheringEnd) : null;
  const now = new Date();
  const hoursLeft = gatheringEnd ? Math.max(0, (gatheringEnd - now) / 1000 / 3600) : null;

  return (
    <VStack align="stretch" spacing={6}>
      {/* Phase Header */}
      <Box p={5} bg="green.900" borderRadius="lg">
        <HStack justify="space-between" flexWrap="wrap" gap={3}>
          <VStack align="flex-start" spacing={1}>
            <Text fontSize="xl" fontWeight="bold" color="green.200">
              ⚔️ Gathering Phase — {event.eventName}
            </Text>
            <Text fontSize="sm" color="green.300">
              Players submit tasks via <code>!cwsubmit &lt;task_id&gt; &lt;proof_url&gt;</code> in Discord
            </Text>
            {hoursLeft !== null && (
              <Text fontSize="xs" color="green.400">
                {hoursLeft < 1 ? 'Less than 1 hour remaining' : `~${hoursLeft.toFixed(0)}h remaining`}
              </Text>
            )}
          </VStack>
          <VStack align="flex-end" spacing={1}>
            <Badge colorScheme="yellow" fontSize="sm" px={3} py={1}>{pendingCount} pending</Badge>
            {isAdmin && (
              <Button size="sm" colorScheme="blue" onClick={() => {
                if (window.confirm('Move to Outfitting Phase?')) {
                  advancePhase({ variables: { eventId: event.eventId, status: 'OUTFITTING' } });
                }
              }}>
                → Start Outfitting
              </Button>
            )}
          </VStack>
        </HStack>
      </Box>

      <Tabs colorScheme="purple" variant="soft-rounded">
        <TabList>
          <Tab fontSize="sm">Submissions</Tab>
          <Tab fontSize="sm">War Chests</Tab>
          {isAdmin && <Tab fontSize="sm">Admin</Tab>}
        </TabList>

        <TabPanels>
          {/* Submissions */}
          <TabPanel px={0}>
            <HStack mb={4} spacing={2}>
              <Text fontSize="sm" color="gray.500">Filter:</Text>
              {['PENDING', 'APPROVED', 'DENIED', ''].map((s) => (
                <Button
                  key={s}
                  size="xs"
                  colorScheme={statusFilter === s ? 'purple' : 'gray'}
                  variant={statusFilter === s ? 'solid' : 'outline'}
                  onClick={() => setStatusFilter(s)}
                >
                  {s || 'All'}
                </Button>
              ))}
            </HStack>

            {submissions.length === 0 ? (
              <Center h="200px">
                <Text color="gray.500">No submissions {statusFilter ? `(${statusFilter})` : ''} yet.</Text>
              </Center>
            ) : (
              <VStack align="stretch" spacing={3}>
                {submissions.map((sub) => (
                  <SubmissionCard
                    key={sub.submissionId}
                    submission={sub}
                    isAdmin={isAdmin}
                    onReview={handleReview}
                  />
                ))}
              </VStack>
            )}
          </TabPanel>

          {/* War Chests */}
          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {(event.teams ?? []).map((team) => (
                <WarChestPanel key={team.teamId} team={team} hidden={true} />
              ))}
            </SimpleGrid>
          </TabPanel>

          {/* Admin */}
          {isAdmin && (
            <TabPanel px={0}>
              <AdminEventPanel event={event} isAdmin={isAdmin} refetch={refetch} />
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </VStack>
  );
}
