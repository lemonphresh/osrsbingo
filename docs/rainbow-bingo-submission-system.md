# Event Submission System

This document is the source of truth for how the Discord-based submission system works for clan events on this platform. It was designed and refined through the Rainbow Bingo event but describes a general pattern that should be followed for any future event that requires players to submit proof screenshots through Discord for ref review.

The concrete implementation lives in `bot/commands/rainbowbingo.js`, `server/schema/resolvers/RainbowBingo.js`, and `client/src/pages/RainbowRefsPage.jsx`. When building a new event's submission system, use these as the reference implementation.

---

## Core Concept

Submissions happen through Discord. Players run a bot command in their team's private channel with a screenshot attached. The bot records the submission and a refs panel in the web app surfaces it for review. Refs approve or deny submissions individually, track progress on objectives, and then manually mark an objective complete when satisfied. Completion triggers Discord notifications and can unlock successor objectives automatically.

There are two submission types used in this system:
- **Pre-screenshots** — proof of starting state before beginning an objective (e.g., current kc, current xp, 0 reward points). Informational only, do not advance objective state.
- **Final submissions** — proof of completion once the objective is done.

Not all event types require both. An event that only tracks drops may only need final submissions. The pre/final distinction is implemented in the data model and bot but can be simplified for future events if pre-screenshots aren't needed.

---

## The Discord Bot Commands

**Reference file:** `bot/commands/rainbowbingo.js`

The bot exposes two commands per event type. For Rainbow Bingo:
- `!rbpre <objectiveCode>` — submits a pre-screenshot (alias: `!rbp`)
- `!rbsubmit <objectiveCode>` — submits a final completion screenshot (alias: `!rbs`)

When implementing for a new event, create a new command file following this same pattern. Both commands share a single handler function (`handleSubmission`) that takes a `type` argument (`PRE` or `FINAL`).

### Command flow

1. **Active event pre-check** — before doing anything, the bot queries a lightweight resolver (`isRainbowBingoChannelActive` in the Rainbow Bingo case) that returns a boolean: is this channel associated with a currently ACTIVE event? If false, the bot returns silently with no reply. This is critical — it prevents noise when an event is in setup or ended, and allows staging and production bots to run in the same server without interfering with each other.

2. **Input validation** — the objective code must be provided and must exist in the event's objective map. A screenshot must be attached directly to the same message as the command. Both violations produce an error reply before hitting the server.

3. **Mutation** — calls the server-side `createSubmission` mutation with: objectiveCode, type (PRE or FINAL), screenshotUrl (Discord CDN URL of the attachment), discordMessageId (for jump links in the refs panel), channelId (the team identity mechanism), discordUsername, discordUserId, submittedAt.

4. **Success reply** — the bot replies with a confirmation embed showing the objective, team name, and "Pending review" status.

### Key constraint: screenshot in the same message as the command

Players paste the command and attach the image in a single Discord message send. The bot reads `message.attachments.first()`. If no attachment is present, it rejects before calling the server. This is the intended UX — players should not be able to submit a command and then upload an image separately.

### Channel as team identity

The bot does not use Discord user identity to determine which team a player belongs to. It uses `message.channelId`. Each team must have its own unique private Discord channel, and that channel ID must be registered against the team in the database. This is a deliberate simplification — it means anyone who can send a message in the team channel can submit for that team, which is the right model for a clan event.

---

## Server-Side: createSubmission

**Reference resolver:** `createRainbowSubmission` in `server/schema/resolvers/RainbowBingo.js`

Called by the Discord bot only. No user authentication — the channel ID is the sole identity mechanism on this path.

**Validation chain:**
1. Find team by `discordChannelId` — if no team is registered for this channel, reject silently (the bot's pre-check should have caught this, but defense in depth)
2. Find event by team's `eventId` — reject if missing
3. Check event status — SETUP and COMPLETE both throw specific messages; anything other than ACTIVE is rejected
4. Find the team's objective entry — reject if not found
5. Check objective status — LOCKED rejects (player shouldn't be able to see this objective yet), COMPLETE rejects (no submitting against a finished objective)

**On success:**
- Creates a submission row with status `PENDING`
- Stores: objectiveCode, type, screenshotUrl, discordMessageId, channelId, discordUsername, discordUserId, submittedAt
- If the submission is FINAL and the objective is currently UNLOCKED, advances objective status to `SUBMITTED` — this signals to refs and spectators that the team is actively working on this objective
- Publishes a WebSocket event to wake up the refs panel in real time

**Pre-screenshots do not change objective state.** They are informational records only. Multiple pre-screenshots for the same objective are allowed — if a player submits the wrong screenshot they should just submit another.

---

## Objective Statuses

The lifecycle of a team's objective through the event:

| Status | Meaning |
|--------|---------|
| `LOCKED` | Not yet reachable. Hidden from players. |
| `UNLOCKED` | Available to work on. No final submissions yet. |
| `SUBMITTED` | At least one final submission exists (regardless of review status). |
| `COMPLETE` | Manually marked complete by a ref. Requires progress at 100. |

Transitions:
- LOCKED → UNLOCKED: triggered when a prerequisite objective is completed (or at event start for starting objectives)
- UNLOCKED → SUBMITTED: triggered automatically when the first FINAL submission is received
- SUBMITTED → COMPLETE: triggered manually by a ref
- COMPLETE → SUBMITTED (undo): triggered manually by a ref

The SUBMITTED state is purely visual — it tells refs and spectators that work is in progress on this objective, without implying the submission has been approved. The actual approval/denial state lives on the individual submission rows, not on the objective itself.

---

## Submission Statuses

Each individual submission has its own independent status:

| Status | Meaning |
|--------|---------|
| `PENDING` | Awaiting ref review |
| `APPROVED` | Ref accepted it |
| `DENIED` | Ref rejected it, with an optional written reason |

Submission status does not directly advance objective status. A ref approving a submission does not complete the objective — that is always a separate explicit manual action. This is intentional: it gives refs full control over timing and lets them approve submissions as they come in without prematurely locking in a completion.

Denied submissions can be re-approved at any time.

---

## The Refs Panel

**Reference file:** `client/src/pages/RainbowRefsPage.jsx`

The refs panel is a web interface accessible only to logged-in users listed as admins on the event. Refs and admins share full permissions — there is no role separation.

### Alerts

- **Sound alerts** — plays a chime when a new submission arrives via WebSocket. Requires a click interaction first to unlock audio (browser policy).
- **Browser push notifications** — sends a system notification even when the tab is not focused.
- **Tab title** — updates to show the count of pending submissions, e.g. `(3) Rainbow Bingo Refs`.
- **On tab focus** — the page automatically refetches submissions and board state.

These alert mechanisms together mean refs can have the tab open in the background and still be notified promptly of new submissions.

### Submission Groups

Submissions are grouped by `objectiveCode + teamId`. Each group shows all pre-screenshots and finals from that team for that objective together. Groups with at least one PENDING submission sort to the top and are auto-expanded. Within a group, submissions sort PENDING first, then APPROVED, then DENIED, with most recent first within each bucket.

**Stable group order** — the sort order is snapshotted the moment the list first loads (or is manually refreshed). While a ref is mid-review, incoming WebSocket events increment a counter but do not re-sort the list. A yellow banner reading "X new submission(s) — click to load" appears below the "how reffing works" box when unloaded submissions are waiting. Clicking it resets the snapshot and refetches, re-sorting fresh data into the new stable order. This prevents the list from jumping under a ref's cursor while they are actively reviewing.

### Reviewing a Submission

For each submission the ref sees:
- Type badge (Pre-screenshot / Final), status badge, Discord username, timestamp
- "View in Discord ↗" jump link — only present when the event has a `guildId` configured and the submission has both a `channelId` and `discordMessageId`. Constructs a direct jump URL: `discord.com/channels/{guildId}/{channelId}/{messageId}`. The `guildId` is set in the event admin panel.
- Screenshot thumbnail — click to open full size in a modal
- Approve / Deny buttons (on PENDING), or Re-approve button (on DENIED)

**Approving** sets the submission to APPROVED, records the reviewer and timestamp, and sends a Discord @mention to the submitting player in their team channel: "your screenshot for **X** was approved ✅".

**Denying** sets the submission to DENIED and sends the same Discord @mention with the denial reason appended if one was provided.

Both notifications go to the team's registered Discord channel. The @mention uses the `discordUserId` stored on the submission. If `discordUserId` is missing, the message is still sent but without a mention.

### Progress Tracking

Each objective group has a progress input (number field) and a slider. Progress is stored as a 0–100 integer percentage on the objective row.

For objectives with a defined metric target (e.g., 500 kc, 1000 xp gained), the input and slider can operate in raw value mode and convert to percentage internally. For objectives without a metric target, it's a straight 0–100% slider.

Progress saves live — no save button. The slider saves on drag end, the number input saves on blur or Enter key. Each save re-publishes board state via WebSocket so the team's visual progress indicators update immediately for both the team and spectators.

**Progress must reach 100 before an objective can be marked complete** — enforced in both the UI (complete button is disabled below 100) and on the server (rejects with an error).

### Completing an Objective

The complete button is enabled only when:
- At least one FINAL submission for that objective+team is `APPROVED`
- Progress is at 100

Requires a two-click confirmation. On confirm:
1. Sets objective status to COMPLETE with a timestamp (atomic — rejects if already COMPLETE)
2. Calculates which successor objectives are newly unlocked based on the event's objective graph
3. Sets newly unlocked objectives to UNLOCKED with timestamps
4. Publishes WebSocket events — updates the team board and spectator board in real time
5. Sends a Discord embed to the team's channel listing the completed objective and any newly unlocked ones
6. Checks for a win condition (e.g., all capstones complete) and fires a board-complete embed if met

### Undoing a Completion

A completed objectives accordion shows all completions across all teams. Only the **most recently completed objective per team** has an active undo button — earlier ones show a disabled button with a tooltip explaining the constraint. This is per-team independently: team A's undo availability has no relationship to team B's.

The restriction exists because undoing an earlier completion in a chain would need to cascade-lock objectives that were unlocked by it, and those objectives may have had work done on them in the meantime. Enforcing newest-first prevents refs from accidentally unraveling progress.

Undo:
1. Reverts objective status to SUBMITTED (if approved finals exist) or UNLOCKED
2. Re-locks any objectives that were only unlocked as a consequence of this completion
3. Re-publishes board state

If a mistake was made earlier in the chain, undo that team's completions in reverse order — newest first.

---

## What Players See

Players access their team board via a secret token URL. The token is generated at team creation and should be kept private to the team.

**Visual indicators on the board:**
- No ring, no dot: unlocked, no activity
- Partial progress ring: progress has been logged by a ref
- Orange dot: a final submission exists (SUBMITTED status)
- Full ring + checkmark: complete

After submitting, players see their submission(s) in the objective detail modal with live status badges. When a ref approves or denies, the player receives a Discord @mention in their team channel and the status badge updates in real time via WebSocket without a page reload.

When an objective is completed, the board updates in real time, a celebration animation plays, and the team's Discord channel gets a notification listing what just unlocked.

---

## Data Model

**Submission row fields:**
- `submissionId` — prefixed unique ID
- `teamId`, `eventId`, `objectiveCode`
- `type` — `PRE` or `FINAL`
- `status` — `PENDING`, `APPROVED`, `DENIED`
- `screenshotUrl` — Discord CDN URL of the attached image
- `discordMessageId` — stored so refs can jump directly to the message in Discord
- `channelId` — Discord channel ID, used to identify the team on inbound bot submissions
- `discordUsername`, `discordUserId` — for display in the refs panel and for @mention notifications
- `submittedAt`, `reviewedAt`, `reviewedBy`, `denialReason`

**Team objective row fields relevant to submissions:**
- `status` — LOCKED / UNLOCKED / SUBMITTED / COMPLETE
- `progress` — 0–100 integer, set by refs
- `unlockedAt`, `completedAt`
- `hasSubmissions` — boolean flag, lets the board show the "in progress" indicator without fetching all submissions

---

## Discord Notifications Summary

| Trigger | Recipient | Content |
|---------|-----------|---------|
| Submission approved | Team channel, @submitter | "your screenshot for **X** was approved ✅" |
| Submission denied | Team channel, @submitter | "your screenshot for **X** was denied ❌ — {reason}" |
| Objective completed | Team channel | Embed: completed objective, newly unlocked objectives, optional thematic note |
| Win condition met | Team channel | Separate celebratory embed |

---

## Key Design Decisions (preserve these for future events)

- **Channel = team identity.** No per-user auth on the submission path. The channel ID is the team. Each team needs a unique private Discord channel registered against it.
- **Guild ID enables jump links.** Without the event's Discord guild ID set in the admin panel, "View in Discord" links won't appear in the refs panel. Set it before going live.
- **Silent pre-check on all commands.** The bot checks whether the channel is active before responding to any command. Non-active states (setup, ended, wrong channel) produce zero response. This lets staging and production bots coexist safely.
- **Approval does not complete an objective.** Refs approve submissions and set progress separately, then explicitly trigger completion. This prevents accidental early completions and gives refs control over pacing.
- **Pre-screenshots are soft gates.** A player can submit a final without a pre. The pre-screenshot is a tool for refs to verify starting state, not a technical prerequisite enforced by the system.
- **Undo is newest-first per team.** Only the most recently completed objective per team can be undone, independent across teams. This preserves unlock chain integrity.
- **Event password doubles as event name.** The single value entered at event creation is used as both the in-screenshot verification word and the display name shown everywhere in the admin and refs panels. Pick something that works as both.
