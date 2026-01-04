import { useEffect, useRef } from 'react';
import { useToast } from '@chakra-ui/react';
import { useSubscription } from '@apollo/client';
import {
  celebrateSubmissionApproved,
  celebrateNodeCompleted,
  celebrateSubmissionDenied,
} from '../utils/celebrationUtils';
import { NODE_COMPLETED_SUB, SUBMISSION_REVIEWED_SUB } from '../graphql/mutations';

/**
 * Hook that subscribes to submission/node events and triggers celebrations
 *
 * @param {string} eventId - Event ID to subscribe to
 * @param {string} teamId - Current user's team ID (to filter celebrations to own team)
 * @param {Array} nodes - Nodes array (to get node details)
 * @param {boolean} enabled - Whether to enable celebrations (disable for admins)
 */
const useSubmissionCelebrations = (
  eventId,
  teamId,
  nodes,
  enabled = true,
  onNodeCompleted = null
) => {
  const toast = useToast();
  const initializedRef = useRef(false);

  // Small delay to prevent celebrations on initial load/reconnect
  useEffect(() => {
    if (!enabled) return;
    const timer = setTimeout(() => {
      initializedRef.current = true;
    }, 2000);
    return () => clearTimeout(timer);
  }, [enabled]);

  // Subscribe to submission reviews (for own team only)
  useSubscription(SUBMISSION_REVIEWED_SUB, {
    variables: { eventId },
    skip: !enabled || !eventId || !teamId,
    onData: ({ data }) => {
      if (!initializedRef.current) return;

      const sub = data.data?.submissionReviewed;
      if (!sub || sub.team.teamId !== teamId) return;

      const node = nodes?.find((n) => n.nodeId === sub.nodeId);
      const nodeTitle = node?.title || sub.nodeName || 'Node';

      if (sub.status === 'APPROVED') {
        celebrateSubmissionApproved(nodeTitle, node?.rewards?.gp);

        toast({
          title: '✅ Submission Approved!',
          description: `Your submission for "${nodeTitle}" was approved!`,
          status: 'success',
          duration: 5000,
          isClosable: true,
          position: 'top',
        });
      } else if (sub.status === 'DENIED') {
        celebrateSubmissionDenied();

        toast({
          title: '❌ Submission Denied',
          description: sub.denialReason
            ? `"${nodeTitle}": ${sub.denialReason}`
            : `Your submission for "${nodeTitle}" was not approved.`,
          status: 'error',
          duration: 7000,
          isClosable: true,
          position: 'top',
        });
      }
    },
  });

  // Subscribe to node completions (for own team only)
  useSubscription(NODE_COMPLETED_SUB, {
    variables: { eventId },
    skip: !enabled || !eventId || !teamId,
    onData: ({ data }) => {
      if (!initializedRef.current) return;

      const ev = data.data?.nodeCompleted;
      if (!ev || ev.teamId !== teamId) return; // Only celebrate own team's completions

      const node = nodes?.find((n) => n.nodeId === ev.nodeId);
      const nodeTitle = node?.title || ev.nodeName || 'Node';

      celebrateNodeCompleted(nodeTitle, node?.rewards?.gp, node?.rewards?.keys);

      toast({
        title: '🎯 Node Completed!',
        description: `"${nodeTitle}" is complete! ${
          node?.rewards?.gp ? `+${formatGP(node.rewards.gp)} GP` : ''
        }`,
        status: 'success',
        duration: 6000,
        isClosable: true,
        position: 'top',
      });

      if (onNodeCompleted) {
        onNodeCompleted(ev);
      }
    },
  });

  return null;
};

const formatGP = (gp) => {
  if (!gp) return '0';
  if (gp >= 1000000) return (gp / 1000000).toFixed(1) + 'M';
  if (gp >= 1000) return (gp / 1000).toFixed(0) + 'K';
  return gp.toString();
};

export default useSubmissionCelebrations;
