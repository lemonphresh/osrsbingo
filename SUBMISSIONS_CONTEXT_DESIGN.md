# Reusable Submissions Context — Design Document

## Problem

Champion Forge has a polished submission review flow, but it's tightly coupled to CF-specific concerns (loot slots, item rarity, war chest, role tagging). Future refs pages (Rainbow Bingo, new event types) need the same core flow — real-time pending queue, approve/deny with reason, screenshot preview, pre-screenshot stash, tile/task completion — without inheriting CF's loot machinery.

The goal: a `SubmissionsProvider` + composable components that handle 100% of the generic ref workflow, with clean callback props for whatever game-mode-specific logic needs to hang off each event.

---

## Core Lifecycle (game-mode agnostic)

```
Player submits (Discord or web)
  → Submission created (status: PENDING)
  → Subscription fires → ref panel shows new item

Ref reviews submission
  → Approve (optionally with a note) → status: APPROVED
  → Deny (with required reason)      → status: DENIED

Ref marks tile/task complete
  → All APPROVED submissions for that tile are "resolved"
  → Game-mode callback fires (CF creates items; GR marks node; RB completes tile)

Optional undo paths:
  → Undo approval       → resets to PENDING, reverses any side effects
  → Undo tile complete  → resets tile, reverses item grants / node completions
```

Pre-screenshots are a parallel track — ref-only visual reference, no approval lifecycle, no side effects.

---

## What's Generic vs. What's Custom

| Concern                                              | Generic (context handles it) | Custom (callback prop)                   |
| ---------------------------------------------------- | ---------------------------- | ---------------------------------------- |
| Fetch submissions by event/team                      | ✅                           |                                          |
| Real-time subscription (new/reviewed)                | ✅                           |                                          |
| Approve / deny with reason                           | ✅                           |                                          |
| Undo approval                                        | ✅                           |                                          |
| Status filtering (pending / approved / denied)       | ✅                           |                                          |
| Screenshot lightbox                                  | ✅                           |                                          |
| Sound feedback                                       | ✅                           |                                          |
| Pre-screenshot stash (read-only)                     | ✅ (if enabled)              |                                          |
| Tile mark complete / undo complete                   | ✅ (triggers)                |                                          |
| Loot slot selection before approval                  |                              | `renderApproveExtras`                    |
| Item creation on approve (optional) or tile complete |                              | `onSubmissionApprove` / `onTileComplete` |
| Undo item creation                                   |                              | `onUndoApproval` / `onUndoTileComplete`  |
| Custom per-submission metadata display               |                              | `renderSubmissionMeta`                   |

---

## Context API

```jsx
<SubmissionsProvider
  eventId="evt_123"
  teamId="team_456"           // optional — omit to show all teams
  queries={{
    getSubmissions: GET_SUBMISSIONS_QUERY,          // required
    getPreScreenshots: GET_PRE_SCREENSHOTS_QUERY,   // optional
  }}
  mutations={{
    reviewSubmission: REVIEW_SUBMISSION_MUTATION,   // required
    markTileComplete: MARK_TILE_COMPLETE_MUTATION,  // required
    undoApproval: UNDO_APPROVAL_MUTATION,           // optional
    undoTileComplete: UNDO_TILE_COMPLETE_MUTATION,  // optional
  }}
  subscriptions={{
    onSubmissionAdded: SUBMISSION_ADDED_SUBSCRIPTION,     // required
    onSubmissionReviewed: SUBMISSION_REVIEWED_SUBSCRIPTION, // required
    onPreScreenshotAdded: PRE_SCREENSHOT_ADDED_SUBSCRIPTION, // optional
  }}

  // --- Lifecycle callbacks ---
  onSubmissionApprove={(submission, mutationResult) => { /* create item, ping Discord, etc */ }}
  onSubmissionDeny={(submission, reason, mutationResult) => { /* notify player, etc */ }}
  onUndoApproval={(submission) => { /* delete item, reset state */ }}
  onTileComplete={(tileId, approvedSubmissions) => { /* create items, mark node, etc */ }}
  onUndoTileComplete={(tileId) => { /* delete items, unmark node, etc */ }}

  // --- Pre-screenshot callbacks (visual only — no status lifecycle) ---
  onPreScreenshotAccept={(preScreenshot) => { /* note acceptance */ }}
  onPreScreenshotDeny={(preScreenshot) => { /* flag for follow-up */ }}

  // --- Render props for custom UI within cards ---
  renderApproveExtras={(submission, approveState, setApproveState) => (
    // CF renders: reward slot dropdown, no-reward checkbox
    // RB renders: nothing (or a note field)
    // Return null if you don't need extras
  )}
  renderSubmissionMeta={(submission) => (
    // CF renders: role badge (PVMER/SKILLER), difficulty, reward preview
    // Other modes render: whatever metadata they store
  )}

  // --- Feature flags ---
  showPreScreenshots={true}    // default false
  requireExtrasBeforeApprove={false} // if true, approve button is disabled until renderApproveExtras is satisfied
  soundEnabled={true}
>
  {children}
</SubmissionsProvider>
```

---

## Context Shape (useSubmissions hook)

```js
const {
  // Data
  submissions, // all submissions for event/team
  pendingSubmissions, // filtered: status === 'PENDING'
  approvedSubmissions, // filtered: status === 'APPROVED'
  deniedSubmissions, // filtered: status === 'DENIED'
  preScreenshots, // pre-screenshot list (empty if not enabled)
  newPendingCount, // unread new submissions since last load

  // Submission actions
  approveSubmission, // (submissionId, extras?) → Promise
  denySubmission, // (submissionId, reason) → Promise
  undoApproval, // (submissionId) → Promise
  markTileComplete, // (tileId) → Promise
  undoTileComplete, // (tileId) → Promise

  // Pre-screenshot actions (local state only — no mutation)
  acceptPreScreenshot, // (preScreenshotId) → calls onPreScreenshotAccept prop
  denyPreScreenshot, // (preScreenshotId) → calls onPreScreenshotDeny prop

  // UI state
  loading,
  refetch,
  clearNewPendingCount,
} = useSubmissions();
```

---

## Component Tree

```
SubmissionsProvider          ← context + queries + subscriptions
└─ SubmissionsRefsPanel      ← top-level drop-in; handles layout, sound toggle, new-subs banner
   ├─ NewSubmissionsBanner   ← "X new submissions — click to reload"
   ├─ SubmissionList         ← tabbed or sectioned list (pending / approved / denied)
   │  ├─ SubmissionCard      ← individual submission row
   │  │  ├─ SubmissionMeta   ← renderSubmissionMeta output
   │  │  ├─ ScreenshotButton ← opens lightbox
   │  │  ├─ ApproveExtras    ← renderApproveExtras output (shown before approve button)
   │  │  └─ ReviewActions    ← approve / deny / undo buttons + deny reason input
   │  └─ (repeats)
   └─ PreScreenshotSection   ← shown if showPreScreenshots=true
      └─ PreScreenshotCard   ← screenshot + accept/deny visual actions
```

### SubmissionsRefsPanel props

This is the single drop-in for a refs page. Thin wrapper; doesn't need many props because context carries everything:

```jsx
<SubmissionsRefsPanel
  groupBy="tile" // 'tile' | 'team' | 'none' — how to bucket submissions
  showTileComplete // whether to show the "mark complete" button per group
/>
```

---

## Schema Requirements (what the consuming event type needs to provide)

The context is query-agnostic — it doesn't care about the shape of your schema as long as you pass in compatible queries/mutations. The minimum submission object it needs at runtime:

```js
{
  id: String,           // unique submission ID
  tileId: String,       // groups submissions into tile/task buckets
  tileLabel: String,    // display name for the tile
  submittedBy: String,  // Discord ID or username
  screenshot: String,   // URL (nullable)
  status: 'PENDING' | 'APPROVED' | 'DENIED',
  reviewNote: String,   // denial reason (nullable)
  submittedAt: String,
}
```

Everything else (role, difficulty, rewardSlot, etc.) lives in `renderSubmissionMeta` / `renderApproveExtras` — the context never touches it.

---

## How CF Would Use This

CF's refs page refactored to use the generic context:

```jsx
<SubmissionsProvider
  eventId={eventId}
  queries={{ getSubmissions: GET_CLAN_WARS_SUBMISSIONS, getPreScreenshots: GET_CF_PRE_SCREENSHOTS }}
  mutations={{ reviewSubmission: REVIEW_CF_SUBMISSION, markTileComplete: MARK_TASK_COMPLETE, ... }}
  subscriptions={{ onSubmissionAdded: CF_SUB_ADDED, onSubmissionReviewed: CF_SUB_REVIEWED, ... }}

  onSubmissionApprove={async (sub, result) => {
    // CF-specific: item is optionally created at approval time (reward slot assigned here).
    // The mutation can roll and create the CFItem immediately on approve rather than
    // waiting for tile complete — tile complete just finalizes the task state.
  }}
  onTileComplete={async (taskId, approvedSubs) => {
    // CF-specific: marks task done; items may already exist from approval.
    // Any approved subs that didn't get an item yet (i.e. no-reward edge cases) are resolved here.
  }}
  onUndoTileComplete={async (taskId) => {
    // CF-specific: server deletes any CFItems not yet equipped, clears rewardItemIds
  }}

  renderApproveExtras={(sub, state, setState) => (
    sub.role === 'PVMER' ? (
      <CFRewardSlotPicker value={state.rewardSlot} onChange={(v) => setState({ rewardSlot: v })} />
    ) : (
      <CFNoRewardCheckbox checked={state.noReward} onChange={(v) => setState({ noReward: v })} />
    )
  )}
  renderSubmissionMeta={(sub) => (
    <CFSubmissionBadges role={sub.role} difficulty={sub.difficulty} />
  )}

  requireExtrasBeforeApprove={true}
  showPreScreenshots={true}
>
  <SubmissionsRefsPanel groupBy="tile" showTileComplete />
</SubmissionsProvider>
```

---

## How a New Event (i.e. Rainbow Bingo) Would Use This

```jsx
<SubmissionsProvider
  eventId={eventId}
  queries={{ getSubmissions: GET_RB_SUBMISSIONS }}
  mutations={{ reviewSubmission: REVIEW_RB_SUBMISSION, markTileComplete: MARK_RB_TILE }}
  subscriptions={{ onSubmissionAdded: RB_SUB_ADDED, onSubmissionReviewed: RB_SUB_REVIEWED }}
  onTileComplete={(tileId) => {
    // RB-specific: mark tile green on the bingo board
  }}
  // No renderApproveExtras needed — plain approve/deny is enough
  // No renderSubmissionMeta needed — base display is sufficient
  showPreScreenshots={false}
>
  <SubmissionsRefsPanel groupBy="tile" showTileComplete />
</SubmissionsProvider>
```

---

## Implementation Order

1. **Extract the generic schema** — define `Submission` interface in typeDefs as a separate named type (not tied to `CFSubmission`). Each event type maps its own submission model to this shape.

2. **Build the context + hook** — `SubmissionsProvider` / `useSubmissions`. Wire up queries, mutations, subscriptions. No render logic yet.

3. **Build `SubmissionCard`** — accept `renderApproveExtras` and `renderSubmissionMeta` as props. Approve/deny/undo buttons built in.

4. **Build `SubmissionList` + `SubmissionsRefsPanel`** — groupBy logic, new-pending banner, sound toggle.

5. **Refactor CF refs page** to use the new components — good smoke test that the abstraction holds.

6. **Use on next event type** — if CF refactor works cleanly, the next event's refs page is just wiring queries and callbacks.

---

## What This Doesn't Cover (intentionally out of scope)

- **Discord submission intake** — each event handles its own bot commands; the context only cares about data that already exists in the DB
- **Loot/item creation logic** — lives entirely in the `onTileComplete` callback; the context never sees item data
- **Bracket / outfitting / battle phases** — this is submissions-only; refs pages for other phases stay separate
