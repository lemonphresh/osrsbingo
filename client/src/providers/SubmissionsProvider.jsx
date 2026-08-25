// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  SUBMISSIONS REVIEW FLOW — canonical convention for every event mode.    ║
// ║                                                                          ║
// ║  If you're building a new event mode with ref review, follow this.       ║
// ║  Battleship is the reference implementation; rainbow bingo, champion     ║
// ║  forge, and spoopy all match. Do not invent new patterns per event.      ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// # Tile lifecycle
//
//   LOCKED → UNLOCKED → SUBMITTED → COMPLETE
//                            ↑
//                            └─ tile stays here across many submissions;
//                               approve/deny do NOT advance the tile.
//                               Only "mark complete" moves it forward.
//
// # Submission-level actions (per row)
//
// - **Approve**: sets the submission row to APPROVED. Does NOT touch the
//   tile status. A tile can accumulate many approved submissions.
// - **Deny**: sets the submission row to DENIED with a reason. Does NOT
//   touch the tile. Team can submit again immediately.
// - Both play a sound cue and add the tile to `stickyTileIds` for 8s so
//   the row stays visible in the "active" pool while the ref works.
//
// # Tile-level action (per tile)
//
// - **Mark Complete**: the ONLY thing that advances the tile to COMPLETE,
//   banks rewards, and unlocks neighbors. Gated by `canMarkTileComplete`
//   in `molecules/TileReviewControls.jsx`:
//
//     canMarkComplete = !isComplete && hasApproved && !hasPending && progress >= 100
//
//   If any gate fails, `markCompleteBlockedReason` returns a human-readable
//   string explaining what's missing so refs never have to guess.
//
// # Multi-submission
//
// A tile can carry many submissions. Some approved, some denied, some
// pending. This is expected for multi-step tasks (e.g. "get 5 uniques" —
// each drop can be its own screenshot). Don't gate submitProof on tile
// status other than "UNLOCKED or SUBMITTED".
//
// # Progress slider + `TileReviewControls`
//
// Progress is stored on the server as 0-100 (percent) regardless of task
// shape. The shared `<TileReviewControls>` molecule handles display:
// - Task has a numeric metric (kc/xp/uniques) → count mode: "3 / 5 kc".
// - No task or non-numeric → percent mode: "60%".
//
// Every new event mode should:
//   1. Ship a `normalize<Mode>Task(task)` helper next to the other
//      normalizers in TileReviewControls.jsx.
//   2. Pass the normalized props to `<TileReviewControls>` on the refs UI.
//   3. NOT re-implement the mark-complete gate anywhere.
//
// # Grouping and sorting (refs page)
//
// Group submissions by tileId. Three pools:
//   - **Active**: has pending submissions OR is in stickyTileIds (recent
//     ref action). Sort by pending count DESC, stabilized via
//     `stableGroupOrder` so tiles don't jump around during review.
//   - **Reviewed**: all submissions reviewed (approved/denied), tile not
//     yet marked complete. Collapsed by default.
//   - **Completed**: `teamTile.status === 'complete'` per authoritative
//     server state — never inferred from submission statuses. Collapsed.
//
// Within a group, render sections pending → approved → denied. Server
// orders submissions by `submittedAt DESC`.
//
// # Live updates
//
// Board pages (team-facing) MUST also add a `visibilitychange` refetch —
// WebSocket subscriptions can drop when the tab is backgrounded, so
// pubsub events fired while hidden never reach the client. The visibility
// listener recovers the state on refocus. See SpoopyEventPage /
// BattleshipEventPage for the pattern.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
// A separate no-op mutation doc — passing NOOP_QUERY to useMutation trips
// Apollo's invariant check (operation type mismatch). This is only used as
// a placeholder when the caller hasn't wired up a particular mutation; the
// corresponding action is gated so it never fires.
const NOOP_MUTATION = gql`
  mutation SubmissionsNoopM {
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
  const [stickyTileIds, setStickyTileIds] = useState(new Set());
  const stickyTimersRef = useRef({});

  const addStickyTile = useCallback((tileId) => {
    if (!tileId) return;
    setStickyTileIds((prev) => new Set([...prev, tileId]));
    if (stickyTimersRef.current[tileId]) clearTimeout(stickyTimersRef.current[tileId]);
    stickyTimersRef.current[tileId] = setTimeout(() => {
      setStickyTileIds((prev) => { const next = new Set(prev); next.delete(tileId); return next; });
      delete stickyTimersRef.current[tileId];
    }, 8000);
  }, []);

  useEffect(() => {
    const timers = stickyTimersRef.current;
    return () => { Object.values(timers).forEach(clearTimeout); };
  }, []);

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

  const [doReview] = useMutation(reviewSubmission ?? NOOP_MUTATION);
  const [doMarkComplete] = useMutation(markTileComplete ?? NOOP_MUTATION);
  const [doUndoApproval] = useMutation(undoApprovalDoc ?? NOOP_MUTATION);
  const [doUndoTileComplete] = useMutation(undoTileCompleteDoc ?? NOOP_MUTATION);

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
      addStickyTile(submission.tileId);
      const result = await doReview({ variables: getApprovalVariables(submission, extrasState) });
      if (soundEnabled) playSubmissionApproved();
      await refetch();
      onSubmissionApprove?.(submission, result);
      return result;
    },
    [addStickyTile, doReview, getApprovalVariables, onSubmissionApprove, refetch, soundEnabled]
  );

  const denySubmission = useCallback(
    async (submission, reason = '') => {
      addStickyTile(submission.tileId);
      const result = await doReview({ variables: getDenialVariables(submission, reason) });
      if (soundEnabled) playSubmissionDenied();
      await refetch();
      onSubmissionDeny?.(submission, reason, result);
      return result;
    },
    [addStickyTile, doReview, getDenialVariables, onSubmissionDeny, refetch, soundEnabled]
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
    stickyTileIds,
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
