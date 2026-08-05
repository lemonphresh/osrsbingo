import { createContext, useCallback, useContext, useState } from 'react';
import { gql, useMutation, useQuery, useSubscription } from '@apollo/client';
import {
  playSubmissionApproved,
  playSubmissionDenied,
  playSubmissionIncoming,
  playTaskComplete,
} from '../utils/soundEngine';

const NOOP_QUERY = gql`
  query SubmissionsNoopQ {
    __typename
  }
`;
const NOOP_SUBSCRIPTION = gql`
  subscription SubmissionsNoopS {
    __typename
  }
`;

const SubmissionsContext = createContext(null);

export function useSubmissions() {
  const ctx = useContext(SubmissionsContext);
  if (!ctx) throw new Error('useSubmissions must be used inside SubmissionsProvider');
  return ctx;
}

export function SubmissionsProvider({
  eventId,
  teamId,

  // GraphQL documents — pass module-level gql`` constants for stability
  queries: { getSubmissions, getPreScreenshots } = {},
  mutations: {
    reviewSubmission,
    markTileComplete,
    undoApproval: undoApprovalDoc,
    undoTileComplete: undoTileCompleteDoc,
  } = {},
  subscriptions: { onSubmissionAdded, onSubmissionReviewed, onPreScreenshotAdded } = {},

  // Lifecycle callbacks — all optional
  onSubmissionApprove,
  onSubmissionDeny,
  onUndoApproval: onUndoApprovalCb,
  onTileComplete,
  onUndoTileComplete,
  onPreScreenshotAccept,
  onPreScreenshotDeny,

  // Render props — slot in game-mode-specific UI within cards
  renderApproveExtras, // (submission, extrasState, setExtrasState) => ReactNode
  renderSubmissionMeta, // (submission) => ReactNode

  // Variable builders — override if your schema uses different field names
  getApprovalVariables = (sub, extras) => ({ submissionId: sub.id, approved: true, ...extras }),
  getDenialVariables = (sub, reason) => ({
    submissionId: sub.id,
    approved: false,
    denialReason: reason,
  }),
  getTileCompleteVariables = (tileId) => ({ eventId, tileId }),
  getTileUndoVariables = (tileId) => ({ eventId, tileId }),

  // Config
  showPreScreenshots = false,
  requireExtrasBeforeApprove = false,
  colorScheme = 'purple',

  children,
}) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [newPendingCount, setNewPendingCount] = useState(0);

  const queryVars = { eventId, ...(teamId ? { teamId } : {}) };

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data, loading, refetch } = useQuery(getSubmissions ?? NOOP_QUERY, {
    variables: queryVars,
    skip: !eventId || !getSubmissions,
    fetchPolicy: 'network-only',
  });

  const { data: preData } = useQuery(getPreScreenshots ?? NOOP_QUERY, {
    variables: queryVars,
    skip: !showPreScreenshots || !getPreScreenshots || !eventId,
    fetchPolicy: 'network-only',
  });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const [doReview] = useMutation(reviewSubmission ?? NOOP_QUERY);
  const [doMarkComplete] = useMutation(markTileComplete ?? NOOP_QUERY);
  const [doUndoApproval] = useMutation(undoApprovalDoc ?? NOOP_QUERY);
  const [doUndoTileComplete] = useMutation(undoTileCompleteDoc ?? NOOP_QUERY);

  // ── Subscriptions ─────────────────────────────────────────────────────────

  useSubscription(onSubmissionAdded ?? NOOP_SUBSCRIPTION, {
    variables: { eventId },
    skip: !onSubmissionAdded || !eventId,
    onData: () => {
      setNewPendingCount((c) => c + 1);
      if (soundEnabled) playSubmissionIncoming();
    },
  });

  useSubscription(onSubmissionReviewed ?? NOOP_SUBSCRIPTION, {
    variables: { eventId },
    skip: !onSubmissionReviewed || !eventId,
    onData: () => refetch(),
  });

  useSubscription(onPreScreenshotAdded ?? NOOP_SUBSCRIPTION, {
    variables: { eventId },
    skip: !onPreScreenshotAdded || !showPreScreenshots || !eventId,
    onData: () => refetch(),
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  const approveSubmission = useCallback(
    async (submission, extrasState = {}) => {
      const result = await doReview({ variables: getApprovalVariables(submission, extrasState) });
      if (soundEnabled) playSubmissionApproved();
      await refetch();
      onSubmissionApprove?.(submission, result);
      return result;
    },
    [doReview, getApprovalVariables, onSubmissionApprove, refetch, soundEnabled]
  );

  const denySubmission = useCallback(
    async (submission, reason = '') => {
      const result = await doReview({ variables: getDenialVariables(submission, reason) });
      if (soundEnabled) playSubmissionDenied();
      await refetch();
      onSubmissionDeny?.(submission, reason, result);
      return result;
    },
    [doReview, getDenialVariables, onSubmissionDeny, refetch, soundEnabled]
  );

  const undoApproval = useCallback(
    async (submission) => {
      if (!undoApprovalDoc) return;
      const result = await doUndoApproval({ variables: { submissionId: submission.id } });
      await refetch();
      onUndoApprovalCb?.(submission, result);
      return result;
    },
    [doUndoApproval, onUndoApprovalCb, refetch, undoApprovalDoc]
  );

  const completeTile = useCallback(
    async (tileId) => {
      const result = await doMarkComplete({ variables: getTileCompleteVariables(tileId) });
      if (soundEnabled) playTaskComplete();
      await refetch();
      onTileComplete?.(tileId, result);
      return result;
    },
    [doMarkComplete, getTileCompleteVariables, onTileComplete, refetch, soundEnabled]
  );

  const undoTileComplete = useCallback(
    async (tileId) => {
      if (!undoTileCompleteDoc) return;
      const result = await doUndoTileComplete({ variables: getTileUndoVariables(tileId) });
      await refetch();
      onUndoTileComplete?.(tileId, result);
      return result;
    },
    [doUndoTileComplete, getTileUndoVariables, onUndoTileComplete, refetch, undoTileCompleteDoc]
  );

  const clearNewPendingCount = useCallback(() => {
    setNewPendingCount(0);
    refetch();
  }, [refetch]);

  // ── Derived data ──────────────────────────────────────────────────────────

  // The query result key varies by event type — callers should alias to `submissions`
  const allSubmissions = data?.submissions ?? [];
  const pendingSubmissions = allSubmissions.filter((s) => s.status === 'PENDING');
  const approvedSubmissions = allSubmissions.filter((s) => s.status === 'APPROVED');
  const deniedSubmissions = allSubmissions.filter((s) => s.status === 'DENIED');
  const preScreenshots = preData?.preScreenshots ?? [];

  // ── Context value ─────────────────────────────────────────────────────────

  const value = {
    // Data
    allSubmissions,
    pendingSubmissions,
    approvedSubmissions,
    deniedSubmissions,
    preScreenshots,
    newPendingCount,
    loading,

    // Actions
    approveSubmission,
    denySubmission,
    undoApproval: undoApprovalDoc ? undoApproval : null,
    completeTile,
    undoTileComplete: undoTileCompleteDoc ? undoTileComplete : null,
    clearNewPendingCount,
    refetch,

    // Pre-screenshot callbacks (local state only — no mutation)
    acceptPreScreenshot: (ps) => onPreScreenshotAccept?.(ps),
    denyPreScreenshot: (ps) => onPreScreenshotDeny?.(ps),

    // Render props
    renderApproveExtras,
    renderSubmissionMeta,

    // Config
    requireExtrasBeforeApprove,
    showPreScreenshots,
    colorScheme,
    soundEnabled,
    setSoundEnabled,
  };

  return <SubmissionsContext.Provider value={value}>{children}</SubmissionsContext.Provider>;
}
