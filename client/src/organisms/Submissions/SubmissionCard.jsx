import { useState } from 'react';
import { Box, Badge, Button, HStack, VStack, Text, Textarea, Collapse } from '@chakra-ui/react';
import { useSubmissions } from '../../providers/SubmissionsProvider';
import { useToastContext } from '../../providers/ToastProvider';

const STATUS_COLORS = {
  PENDING: 'yellow',
  APPROVED: 'green',
  DENIED: 'red',
};

export default function SubmissionCard({ submission }) {
  const {
    approveSubmission,
    denySubmission,
    undoApproval,
    renderApproveExtras,
    renderSubmissionMeta,
    requireExtrasBeforeApprove,
    colorScheme,
  } = useSubmissions();
  const { showToast } = useToastContext();

  const [approving, setApproving] = useState(false);
  const [denying, setDenying] = useState(false);
  const [extrasState, setExtrasState] = useState({});
  const [denyReason, setDenyReason] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setApproving(false);
    setDenying(false);
    setExtrasState({});
    setDenyReason('');
  };

  const handleApprove = async () => {
    // If there are extras and we haven't opened the extras panel yet, open it first
    if (renderApproveExtras && !approving) {
      setApproving(true);
      setDenying(false);
      return;
    }
    setLoading(true);
    try {
      await approveSubmission(submission, extrasState);
      showToast('Submission approved', 'success');
      reset();
    } catch (e) {
      showToast(e.message ?? 'Failed to approve', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeny = async () => {
    if (!denying) {
      setDenying(true);
      setApproving(false);
      return;
    }
    setLoading(true);
    try {
      await denySubmission(submission, denyReason);
      showToast('Submission denied', 'info');
      reset();
    } catch (e) {
      showToast(e.message ?? 'Failed to deny', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUndoApproval = async () => {
    if (!undoApproval) return;
    setLoading(true);
    try {
      await undoApproval(submission);
      showToast('Approval undone', 'info');
    } catch (e) {
      showToast(e.message ?? 'Failed to undo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const extrasReady =
    !requireExtrasBeforeApprove || !renderApproveExtras || Object.keys(extrasState).length > 0;

  const isPending = submission.status === 'PENDING';
  const isApproved = submission.status === 'APPROVED';
  const isDenied = submission.status === 'DENIED';

  return (
    <Box
      bg="gray.800"
      border="1px solid"
      borderColor={isDenied ? 'red.800' : isApproved ? 'green.800' : 'gray.700'}
      borderRadius="lg"
      p={4}
    >
      <HStack justify="space-between" align="flex-start" mb={2}>
        <VStack align="flex-start" spacing={0.5} flex={1} minW={0}>
          <Text fontWeight="semibold" color="white" fontSize="sm" noOfLines={1}>
            {submission.tileLabel ?? submission.tileId}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {submission.submittedBy}
            {submission.submittedAt && (
              <>
                {' '}
                ·{' '}
                {new Date(submission.submittedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </>
            )}
          </Text>
        </VStack>
        <HStack spacing={2} flexShrink={0}>
          <Badge colorScheme={STATUS_COLORS[submission.status]} fontSize="xs">
            {submission.status}
          </Badge>
          {submission.screenshot && (
            <Button
              as="a"
              href={submission.screenshot}
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              variant="outline"
              colorScheme="gray"
            >
              Screenshot
            </Button>
          )}
        </HStack>
      </HStack>

      {/* Game-mode-specific metadata */}
      {renderSubmissionMeta && <Box mb={2}>{renderSubmissionMeta(submission)}</Box>}

      {/* Denial reason display */}
      {isDenied && submission.reviewNote && (
        <Box
          bg="red.900"
          border="1px solid"
          borderColor="red.700"
          borderRadius="md"
          px={3}
          py={2}
          mb={2}
        >
          <Text fontSize="xs" color="red.200">
            <Text as="span" fontWeight="semibold">
              Reason:{' '}
            </Text>
            {submission.reviewNote}
          </Text>
        </Box>
      )}

      {/* Approve extras panel */}
      <Collapse in={approving && !!renderApproveExtras}>
        <Box bg="gray.900" border="1px solid" borderColor="gray.600" borderRadius="md" p={3} mb={3}>
          {renderApproveExtras?.(submission, extrasState, setExtrasState)}
        </Box>
      </Collapse>

      {/* Deny reason input */}
      <Collapse in={denying}>
        <Textarea
          value={denyReason}
          onChange={(e) => setDenyReason(e.target.value)}
          placeholder="Reason for denial (optional)"
          size="sm"
          bg="gray.900"
          borderColor="gray.600"
          mb={3}
          rows={2}
          resize="none"
        />
      </Collapse>

      {/* Actions */}
      {isPending && (
        <HStack spacing={2} justify="flex-end">
          {(approving || denying) && (
            <Button
              size="xs"
              variant="ghost"
              colorScheme="gray"
              onClick={reset}
              isDisabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button
            size="xs"
            colorScheme="red"
            variant={denying ? 'solid' : 'outline'}
            onClick={handleDeny}
            isLoading={loading && denying}
            isDisabled={loading && !denying}
          >
            {denying ? 'Confirm Denial' : 'Deny'}
          </Button>
          <Button
            size="xs"
            colorScheme={colorScheme}
            variant={approving ? 'solid' : 'outline'}
            onClick={handleApprove}
            isLoading={loading && approving}
            isDisabled={(loading && !approving) || (approving && !extrasReady)}
          >
            {approving ? 'Confirm Approval' : 'Approve'}
          </Button>
        </HStack>
      )}

      {isApproved && undoApproval && (
        <HStack justify="flex-end">
          <Button
            size="xs"
            variant="ghost"
            colorScheme="gray"
            onClick={handleUndoApproval}
            isLoading={loading}
          >
            Undo approval
          </Button>
        </HStack>
      )}
    </Box>
  );
}
