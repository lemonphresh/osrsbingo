import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  Badge,
  Link,
  Select,
  Input,
  Tooltip,
  Checkbox,
} from '@chakra-ui/react';
import { fmtTs } from '../../hooks/useTimezone';
import { useToastContext } from '../../providers/ToastProvider';
import { CHANGE_SUBMISSION_REWARD_SLOT } from '../../graphql/clanWarsOperations';
import { DIFFICULTY_COLOR } from './gatheringConstants';

const PVMER_SLOTS = ['weapon', 'helm', 'chest', 'legs', 'misc'];
const PVMER_SLOT_LABELS = {
  weapon: 'Weapon',
  helm: 'Helm',
  chest: 'Chest',
  legs: 'Legs',
  misc: 'Misc — randomly rolls gloves, boots, or trinket',
};

// hideTaskInfo=true when rendered inside a task group (header already has task info)
export default function SubmissionCard({
  submission,
  isAdmin,
  onReview,
  onUndoApproval,
  onSlotChanged,
  tasks,
  hideTaskInfo = false,
  utc = false,
}) {
  const { showToast } = useToastContext();
  const [rewardSlot, setRewardSlot] = useState('weapon');
  const [denialReason, setDenialReason] = useState('');
  const [denyExpanded, setDenyExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [undoLoading, setUndoLoading] = useState(false);
  const [confirmingApprove, setConfirmingApprove] = useState(false);
  const [noReward, setNoReward] = useState(false);
  const [editingSlot, setEditingSlot] = useState(false);
  const [editSlotValue, setEditSlotValue] = useState(submission.rewardSlot ?? 'weapon');
  const [slotSaving, setSlotSaving] = useState(false);
  const [savedSlot, setSavedSlot] = useState(null);

  const [changeRewardSlotMutation] = useMutation(CHANGE_SUBMISSION_REWARD_SLOT, {
    onError: (err) => showToast(err.message, 'error'),
  });

  const isPending = submission.status === 'PENDING';
  const taskMeta = tasks?.find((t) => t.taskId === submission.taskId);

  const handleSaveSlot = async () => {
    setSlotSaving(true);
    try {
      await changeRewardSlotMutation({
        variables: { submissionId: submission.submissionId, rewardSlot: editSlotValue },
      });
      showToast('Reward slot updated', 'success');
      setSavedSlot(editSlotValue);
      setEditingSlot(false);
      onSlotChanged?.();
    } finally {
      setSlotSaving(false);
    }
  };

  const handleReview = async (approved) => {
    setLoading(true);
    try {
      await onReview({
        submissionId: submission.submissionId,
        approved,
        rewardSlot: approved
          ? noReward
            ? 'none'
            : submission.role === 'PVMER'
            ? rewardSlot
            : undefined
          : undefined,
        denialReason: !approved ? denialReason : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const statusColor =
    submission.status === 'APPROVED' ? 'green' : submission.status === 'DENIED' ? 'red' : 'yellow';

  return (
    <Box
      bg="gray.700"
      border="1px solid"
      borderColor={
        submission.status === 'APPROVED'
          ? 'green.700'
          : submission.status === 'DENIED'
          ? 'red.900'
          : 'gray.600'
      }
      borderRadius="md"
      p={3}
    >
      <HStack justify="space-between" mb={hideTaskInfo ? 1 : 2}>
        <VStack align="flex-start" spacing={0}>
          <HStack flexWrap="wrap" gap={1}>
            <Badge colorScheme={statusColor} mb={1} fontSize="xs">
              {submission.status}
            </Badge>
            {!hideTaskInfo && (
              <>
                <Badge colorScheme={submission.role === 'PVMER' ? 'orange' : 'teal'} fontSize="xs">
                  {submission.role}
                </Badge>
                <Badge
                  colorScheme={DIFFICULTY_COLOR[submission.difficulty] ?? 'gray'}
                  fontSize="xs"
                >
                  {submission.difficulty}
                </Badge>
              </>
            )}
          </HStack>
          {!hideTaskInfo && (
            <>
              <Text fontWeight="medium" fontSize="sm" mt={1} color="white">
                {submission.taskLabel ?? submission.taskId}
              </Text>
              {taskMeta?.description && (
                <Text fontSize="xs" color="gray.400" mt={0.5}>
                  {taskMeta.description}
                </Text>
              )}
            </>
          )}
          <Text fontSize="xs" color="gray.500" mt={hideTaskInfo ? 0 : 1}>
            {submission.submittedUsername ?? submission.submittedBy} ·{' '}
            {fmtTs(submission.submittedAt, utc)}
          </Text>
        </VStack>

        {submission.screenshot && (
          <Link href={submission.screenshot} isExternal flexShrink={0}>
            <Button size="xs" colorScheme="blue" variant="outline">
              View Screenshot
            </Button>
          </Link>
        )}
      </HStack>

      {submission.status === 'APPROVED' && (
        <Box mt={2} p={2} bg="gray.800" borderRadius="md">
          {submission.rewardItem ? (
            <HStack flexWrap="wrap" gap={1}>
              <Text fontSize="xs" color="gray.400">
                To Be Rewarded:
              </Text>
              <Badge
                colorScheme={
                  submission.rewardItem.rarity === 'epic'
                    ? 'purple'
                    : submission.rewardItem.rarity === 'rare'
                    ? 'blue'
                    : submission.rewardItem.rarity === 'uncommon'
                    ? 'green'
                    : 'gray'
                }
              >
                {submission.rewardItem.rarity}
              </Badge>
              <Text fontSize="xs" fontWeight="medium" color="white">
                {submission.rewardItem.name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                ({savedSlot ?? submission.rewardItem.slot})
              </Text>
            </HStack>
          ) : (savedSlot ?? submission.rewardSlot) === 'none' ? (
            <Text fontSize="xs" color="gray.500">No reward assigned.</Text>
          ) : savedSlot ?? submission.rewardSlot ? (
            <Text fontSize="xs" color="gray.400">
              Reward slot:{' '}
              <Text as="span" color="white">
                {savedSlot ?? submission.rewardSlot}
              </Text>
            </Text>
          ) : null}

          {isAdmin && submission.role === 'PVMER' && (
            <Box mt={2}>
              {editingSlot ? (
                <HStack spacing={2}>
                  <Select
                    size="xs"
                    value={editSlotValue}
                    onChange={(e) => setEditSlotValue(e.target.value)}
                    w="auto"
                    bg="gray.700"
                    borderColor="gray.600"
                    color="white"
                  >
                    {PVMER_SLOTS.map((s) => (
                      <option key={s} value={s} style={{ background: '#2D3748', color: '#E2E8F0' }}>
                        {PVMER_SLOT_LABELS[s] ?? s}
                      </option>
                    ))}
                  </Select>
                  <Button
                    size="xs"
                    colorScheme="blue"
                    isLoading={slotSaving}
                    onClick={handleSaveSlot}
                  >
                    Save
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    color="gray.400"
                    onClick={() => setEditingSlot(false)}
                  >
                    Cancel
                  </Button>
                </HStack>
              ) : (
                <Button
                  size="xs"
                  variant="ghost"
                  color="gray.500"
                  onClick={() => {
                    setEditSlotValue(submission.rewardSlot ?? 'weapon');
                    setEditingSlot(true);
                  }}
                >
                  ✏️ Change reward slot
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}

      {isAdmin && submission.status === 'APPROVED' && onUndoApproval && (
        <Box mt={2}>
          <Button
            size="xs"
            variant="ghost"
            color="orange.400"
            isLoading={undoLoading}
            onClick={async () => {
              setUndoLoading(true);
              try {
                await onUndoApproval(submission.submissionId);
              } finally {
                setUndoLoading(false);
              }
            }}
          >
            ↩ Undo approval
          </Button>
        </Box>
      )}

      {submission.status === 'DENIED' && submission.reviewNote && (
        <Box mt={2} p={2} bg="red.900" borderRadius="sm">
          <Text fontSize="xs" color="red.200">
            <Text as="span" fontWeight="semibold">
              Denial reason:
            </Text>{' '}
            {submission.reviewNote}
          </Text>
        </Box>
      )}

      {isAdmin && isPending && (
        <VStack
          align="stretch"
          spacing={2}
          mt={3}
          pt={3}
          borderTop="1px solid"
          borderColor="gray.600"
        >
          {submission.role === 'PVMER' && (
            <>
              <Text fontSize="sm" color="gray.300">
                Based on the player's actual drop, assign the reward slot.
              </Text>
              {!noReward && (
                <HStack>
                  <Text fontSize="xs" color="gray.400">
                    Reward Slot:
                  </Text>
                  <Select
                    size="xs"
                    value={rewardSlot}
                    onChange={(e) => setRewardSlot(e.target.value)}
                    w="auto"
                    bg="gray.800"
                    borderColor="gray.600"
                    color="white"
                  >
                    {PVMER_SLOTS.map((s) => (
                      <option key={s} value={s} style={{ background: '#2D3748', color: '#E2E8F0' }}>
                        {s}
                      </option>
                    ))}
                  </Select>
                  <Tooltip
                    label={
                      <Box>
                        {Object.entries(PVMER_SLOT_LABELS).map(([slot, desc]) => (
                          <Box key={slot} mb={1}>
                            <Text as="span" fontWeight="bold" color="white">
                              {slot}:{' '}
                            </Text>
                            <Text as="span" color="gray.300">
                              {desc}
                            </Text>
                          </Box>
                        ))}
                      </Box>
                    }
                    placement="right"
                    bg="gray.900"
                    color="white"
                    border="1px solid"
                    borderColor="gray.600"
                    borderRadius="md"
                    p={3}
                    hasArrow
                  >
                    <Text
                      as="span"
                      fontSize="xs"
                      color="gray.500"
                      cursor="help"
                      border="1px solid"
                      borderColor="gray.600"
                      borderRadius="full"
                      w="16px"
                      h="16px"
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                      _hover={{ color: 'gray.300', borderColor: 'gray.400' }}
                    >
                      ?
                    </Text>
                  </Tooltip>
                </HStack>
              )}
              <Checkbox
                size="sm"
                isChecked={noReward}
                onChange={(e) => setNoReward(e.target.checked)}
                colorScheme="orange"
              >
                <Text fontSize="xs" color="gray.400">No reward</Text>
              </Checkbox>
            </>
          )}
          {submission.role === 'SKILLER' && (
            <Checkbox
              size="sm"
              isChecked={noReward}
              onChange={(e) => setNoReward(e.target.checked)}
              colorScheme="orange"
            >
              <Text fontSize="xs" color="gray.400">No reward</Text>
            </Checkbox>
          )}
          {confirmingApprove ? (
            <Box p={3} bg="green.900" borderRadius="md" border="1px solid" borderColor="green.700">
              <Text fontSize="sm" color="green.200" mb={2} fontWeight="semibold">
                {noReward
                  ? 'Approve this submission with no reward?'
                  : submission.role === 'PVMER'
                  ? `Approve and assign reward to the ${rewardSlot} slot?`
                  : 'Approve this submission?'}
              </Text>
              <HStack spacing={2}>
                <Button
                  size="sm"
                  colorScheme="green"
                  isLoading={loading}
                  onClick={() => {
                    setConfirmingApprove(false);
                    handleReview(true);
                  }}
                  flex={1}
                >
                  ✓ Confirm Approval
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  color="gray.300"
                  borderColor="gray.600"
                  onClick={() => setConfirmingApprove(false)}
                >
                  Cancel
                </Button>
              </HStack>
            </Box>
          ) : (
            <HStack spacing={2}>
              <Button
                size="sm"
                colorScheme="green"
                isLoading={loading}
                onClick={() => setConfirmingApprove(true)}
                flex={1}
              >
                ✓ Approve
              </Button>
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                isLoading={loading}
                onClick={() => setDenyExpanded(!denyExpanded)}
                flex={1}
              >
                ✗ Deny
              </Button>
            </HStack>
          )}
          {denyExpanded && (
            <VStack align="stretch" spacing={2}>
              <Input
                size="sm"
                placeholder="Denial reason (shown to player)"
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                bg="gray.800"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: 'gray.500' }}
              />
              <Button
                size="sm"
                colorScheme="red"
                isLoading={loading}
                onClick={() => handleReview(false)}
              >
                Confirm Denial
              </Button>
            </VStack>
          )}
        </VStack>
      )}
    </Box>
  );
}
