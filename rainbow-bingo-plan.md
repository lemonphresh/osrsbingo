# Rainbow Bingo — Implementation Plan

**Eternal Gems Pride Event**

---

## Overview

| Detail | Value |
|--------|-------|
| Main URL | `/eg-rainbow` |
| Refs URL | `/eg-rainbow/refs` |
| Admin URL | `/eg-rainbow/admin` |
| Theme | Rainbow/Pride OSRS bingo |
| Structure | Team-based (12–15 players/team) |
| Progression | Discord screenshot → admin approve → tile unlocked → next tile(s) revealed |
| Rewards | None — pure progression |

---

## Board Structure

**56 tiles total:**
- 7 color paths × 7 tiles = 49 colored tiles
- 7 Capstone tiles (C1–C7) — junction/milestone tiles, team chooses next direction on completion

### Color Paths

| Color | Code | Theme |
|-------|------|-------|
| Red | R1–R7 | Life |
| Orange | O1–O7 | Healing |
| Yellow | Y1–Y7 | Sunlight |
| Green | G1–G7 | Nature |
| Blue | B1–B7 | Magic and Art |
| Indigo | I1–I7 | Serenity |
| Violet | V1–V7 | Spirit |
| Capstone | C1–C7 | Pride (fun names) |

---

## Tile Catalog

### Tile Data Fields

```
tileCode       — "R1", "Y3", "C7"
color          — "red" | "orange" | "yellow" | "green" | "blue" | "indigo" | "violet" | "capstone"
colorIndex     — 1–7
bossOrSkill    — display name, e.g. "Grotesque Guardians", "Woodcutting"
metricType     — "xp" | "kc" | "unique" | "special"
metricTarget   — numeric (xp in millions, kc count, unique count)
metricLabel    — human-readable, e.g. "5M xp", "300 kc", "2 uniques", "mismatched set"
hoursEstimate  — float
theme          — color path theme string (only on [color]1 tiles, inherited by path)
funName        — null (capstones only), e.g. "bi tile"
notes          — any special rules or conditions
```

### Red (Life)

| Code | Boss/Skill | Metric | Target | Label | Hours | Notes |
|------|-----------|--------|--------|-------|-------|-------|
| R1 | Woodcutting | xp | 5 | 5M xp | 23 | |
| R2 | Grotesque Guardians | kc | 300 | 300 kc | 10 | |
| R3 | Commander Zilyana | unique | 2 | 2 uniques | 4 | |
| R4 | Moons of Peril | unique | 3 | 3 uniques | 4 | |
| R5 | Abyssal Sire | kc | 400 | 400 kc | 10 | |
| R6 | Araxxor | kc | 300 | 300 kc | 9 | |
| R7 | Fortis Colosseum | unique | 2 | 2 uniques | 4 | |

### Orange (Healing)

| Code | Boss/Skill | Metric | Target | Label | Hours | Notes |
|------|-----------|--------|--------|-------|-------|-------|
| O1 | Cooking | xp | 5 | 5M xp | 11 | |
| O2 | Doom of Mokhaiotl | unique | 2 | 2 uniques | 12 | |
| O3 | Zulrah | unique | 3 | 3 uniques | 9 | |
| O4 | Sarachnis | unique | 6 | 6 uniques | 6 | |
| O5 | Dagannoth Kings | unique | 5 | 5 uniques | 5 | |
| O6 | General Graardor | unique | 2 | 2 uniques | 6.5 | |
| O7 | Jad / Zuk | special | — | 3 inferno OR 12 fire cape | 3 | |

### Yellow (Sunlight)

| Code | Boss/Skill | Metric | Target | Label | Hours | Notes |
|------|-----------|--------|--------|-------|-------|-------|
| Y1 | Agility | xp | 1.5 | 1.5M xp | 15 | Unlocks Y2 AND Y4 |
| Y2 | Fletching | xp | 5 | 5M xp | 0 | Can do concurrently with Y1 |
| Y3 | The Leviathan | unique | 2 | 2 uniques | 7 | Requires Y2 |
| Y4 | Wintertodt | unique | 4 | 4 uniques | 4 | Requires Y1 |
| Y5 | Scurrius | kc | 500 | 500 kc | 5 | Requires Y4 |
| Y6 | K'ril Tsutsaroth | unique | 3 | 3 uniques | 4.5 | Requires Y3 AND Y5 |
| Y7 | Tombs of Amascut | unique | 2 | 2 uniques | 6 | Requires Y6 |

### Green (Nature)

| Code | Boss/Skill | Metric | Target | Label | Hours | Notes |
|------|-----------|--------|--------|-------|-------|-------|
| G1 | Fishing | xp | 2.5 | 2.5M xp | 20 | Interplay with G3 (Tempy) |
| G2 | Sailing | xp | 6.5 | 6.5M xp | 29 | |
| G3 | Tempoross uniques | unique | 1 | 1 unique | 3 | |
| G4 | Kalphite Queen | unique | 3 | 3 uniques | 4 | |
| G5 | Kraken | kc | 500 | 500 kc | 5 | |
| G6 | Vorkath | unique | 4 | 4 uniques | 5 | |
| G7 | Amoxliatl | unique | 5 | 5 uniques | 7 | |

### Blue (Magic and Art)

| Code | Boss/Skill | Metric | Target | Label | Hours | Notes |
|------|-----------|--------|--------|-------|-------|-------|
| B1 | Crafting | xp | 5 | 5M xp | 18 | |
| B2 | GOTR Dyes | unique | 1 | 1 unique | 9 | |
| B3 | Smithing | xp | 3 | 3M xp | 7 | |
| B4 | Corrupted Gauntlet | unique | 3 | 3 uniques | 10 | |
| B5 | Zalcano | unique | 1 | 1 unique | 40 | 40-player tile; ~20 kph |
| B6 | Thermonuclear Smoke Devil | kc | 500 | 500 kc | 5 | |
| B7 | Yama | unique | 1 | 1 unique | 13 | |

### Indigo (Serenity)

| Code | Boss/Skill | Metric | Target | Label | Hours | Notes |
|------|-----------|--------|--------|-------|-------|-------|
| I1 | Mining | xp | 2 | 2M xp | 10 | |
| I2 | Kree'arra | unique | 2 | 2 uniques | 7 | |
| I3 | Calvar'ion | unique | 3 | 3 uniques | 6 | |
| I4 | Spindel | unique | 3 | 3 uniques | 6 | |
| I5 | Duke Sucellus | unique | 3 | 3 uniques | 7 | |
| I6 | Alchemical Hydra | kc | 300 | 300 kc | 10 | |
| I7 | Giant Mole | unique | 10 | 10 uniques | 5 | |

### Violet (Spirit)

| Code | Boss/Skill | Metric | Target | Label | Hours | Notes |
|------|-----------|--------|--------|-------|-------|-------|
| V1 | Slayer | xp | 4 | 4M xp | 40 | "not actually 40 hrs" |
| V2 | Barrows | special | — | mismatched set | 6 | |
| V3 | Corporeal Beast | unique | 2 | 2 uniques | 9 | |
| V4 | Phantom Muspah | unique | 4 | 4 uniques | 5 | |
| V5 | The Whisperer | unique | 3 | 3 uniques | 9 | |
| V6 | Cerberus | kc | 500 | 500 kc | 10 | |
| V7 | Chambers of Xeric | unique | 2 | 2 uniques | 6 | Assumes decent trio CMs |

### Capstones (Pride themed)

| Code | Fun Name | Boss/Skill | Metric | Target | Label | Hours | Notes |
|------|----------|-----------|--------|--------|-------|-------|-------|
| C1 | be gay do crime | Thieving | xp | 4 | 4M xp | 18 | |
| C2 | grindr | Unique slayer heads | unique | — | unique # of heads | 0 | Done during V1 Slayer xp tile |
| C3 | scissor me timbers | Vardorvis | unique | 2 | 2 uniques | 7 | |
| C4 | bears | Callisto / Artio | unique | 3 | 3 uniques | 6 | |
| C5 | trans inclusive (name TBD) | Nightmare / PNM | unique | 1 | the egg | 12 | |
| C6 | nb tile | Hunter Rumors (Pitri) | kc | 200 | 200 rumors | 13 | Pitri is canonically nb |
| C7 | bi tile | Royal Titans | unique | 2 | 2 uniques | 6 | |

---

## Progression System

### DAG (Tile Prerequisites)

Tiles have prerequisites — completing a tile **unlocks** the next tile(s). The graph is per-team.

**Tile States (per team, per tile):**

| State | Meaning |
|-------|---------|
| `LOCKED` | Prerequisites not yet met |
| `UNLOCKED` | Ready to attempt (prerequisites met, not yet submitted) |
| `PRE_SUBMITTED` | Pre-screenshot submitted, awaiting admin approve |
| `PRE_APPROVED` | Pre-screenshot approved, awaiting final submission |
| `SUBMITTED` | Final screenshot submitted, awaiting admin review |
| `COMPLETE` | Admin approved — tile done, next tiles unlocked |
| `DENIED` | Most recent submission denied — stays UNLOCKED |

### Yellow DAG (confirmed by user — template for other colors)

```
                  Y2 → Y3 ↘
Y1 → {Y2, Y4}                → Y6 → Y7
                  Y4 → Y5 ↗
```

- Y1 completion unlocks both Y2 and Y4 simultaneously
- Y6 requires BOTH Y3 AND Y5 to be COMPLETE
- Y7 requires Y6

### Other Colors

Default assumption is **strictly linear** until the user defines branching:

```
X1 → X2 → X3 → X4 → X5 → X6 → X7
```

Applies to: R, O, G, B, I, V — update this section as the user confirms any branching/convergence rules.

### Capstone Branching (TBD)

When a team completes a Capstone tile, they choose which path(s) to enter next. Choices are made in-app by the team captain / admin.

- The full capstone→color mapping will be defined before Phase 6 (Capstone Logic).
- Looking at the board layout, Capstones appear to be junction tiles between color paths.

### Starting Condition

On team creation, the black **Start Tile** (as shown on the board) is the entry point. Whichever tiles it connects to are set to `UNLOCKED` on team creation. All other tiles begin `LOCKED`.

### Fog of War

- Teams see tile details (name, boss, target, notes) only for `UNLOCKED`, `SUBMITTED`, `PRE_SUBMITTED`, `PRE_APPROVED`, or `COMPLETE` tiles.
- `LOCKED` tiles render as mystery/locked placeholders on the board.
- When a tile transitions to `UNLOCKED`, the bot posts tile details to the team's Discord channel.

---

## Database Models

### RainbowEvent

```
eventId        STRING PK
eventName      STRING
status         ENUM('ACTIVE', 'PAUSED', 'COMPLETE')
startDate      DATE
endDate        DATE nullable
adminIds       JSONB (array of user IDs)
tileGraph      JSONB (prerequisite map: { "Y6": ["Y3","Y5"], "Y2": ["Y1"], ... })
startTiles     JSONB (array of tileCodes that begin UNLOCKED)
createdAt      DATE
```

### RainbowTeam

```
teamId             STRING PK
eventId            STRING FK → RainbowEvent
teamName           STRING
discordChannelId   STRING  (submissions from this channel = this team)
captainDiscordId   STRING nullable
notes              STRING nullable
createdAt          DATE
```

### RainbowTeamTile

```
teamTileId         STRING PK
teamId             STRING FK → RainbowTeam
eventId            STRING FK → RainbowEvent
tileCode           STRING  (e.g. "Y3", "C7")
status             ENUM('LOCKED','UNLOCKED','PRE_SUBMITTED','PRE_APPROVED','SUBMITTED','COMPLETE','DENIED')
unlockedAt         DATE nullable
completedAt        DATE nullable
activeSubmissionId STRING nullable FK → RainbowSubmission
```

### RainbowSubmission

```
submissionId       STRING PK
teamId             STRING FK → RainbowTeam
eventId            STRING FK → RainbowEvent
tileCode           STRING
type               ENUM('PRE', 'FINAL')
screenshotUrl      TEXT
discordMessageId   STRING nullable
channelId          STRING  (for audit trail)
status             ENUM('PENDING', 'APPROVED', 'DENIED')
reviewedBy         STRING nullable (userId)
reviewedAt         DATE nullable
denialReason       TEXT nullable
submittedAt        DATE
```

---

## Discord Bot

### Channel → Team Mapping

Each `RainbowTeam` stores `discordChannelId`. The bot looks up the team by matching `message.channelId` — no Discord user ID matching needed.

### Commands

| Command | Description |
|---------|-------------|
| `!rbpre <tileCode>` + screenshot | Submit a pre-screenshot for a tile |
| `!rbsubmit <tileCode>` + screenshot | Submit a final completion screenshot |

### Validation (both commands)

1. Channel ID matches a known team in an `ACTIVE` event
2. Tile code is valid (exists in catalog)
3. For `!rbpre`: tile must be `UNLOCKED`
4. For `!rbsubmit`: tile must be `UNLOCKED` or `PRE_APPROVED`
5. Message must have a screenshot attachment

### Bot Responses

- **Success**: `✅ **[Tile Name]** pre-screenshot / submission received for **[Team Name]** — pending review`
- **Unknown channel**: `❌ This channel is not registered for any Rainbow Bingo team`
- **Tile locked**: `❌ **[tileCode]** is locked — complete the prerequisites first`
- **No screenshot**: `❌ Please attach a screenshot to your submission`
- **Event not active**: `❌ There is no active Rainbow Bingo event`

### Staff Channel Notifications

On new PRE or FINAL submission, bot posts to a configured staff channel:
```
🌈 New submission — [PRE/FINAL]
Team: [Team Name]
Tile: [tileCode] — [Tile Label]
[screenshot link]
```

### Tile Unlock Announcements (to team channel)

When a tile is approved and unlocks next tiles, bot posts to the team's channel:
```
🎉 [tileCode] complete! ✅
You've unlocked: [NextTile1] — [NextTile1Label], [NextTile2] — [NextTile2Label]
[Tile details for each newly unlocked tile]
```

---

## GraphQL API

### Queries

```graphql
getRainbowEvent(eventId: ID!): RainbowEvent
getRainbowTeams(eventId: ID!): [RainbowTeam]
getRainbowTeamBoard(teamId: ID!): [RainbowTeamTile]
getRainbowSubmissions(eventId: ID!, status: SubmissionStatus): [RainbowSubmission]
getRainbowTileDefs: [RainbowTileDef]   # static catalog
```

### Mutations

```graphql
createRainbowEvent(input: CreateRainbowEventInput!): RainbowEvent
createRainbowTeam(eventId: ID!, input: CreateRainbowTeamInput!): RainbowTeam
updateRainbowEventStatus(eventId: ID!, status: RainbowEventStatus!): RainbowEvent

createRainbowSubmission(input: CreateRainbowSubmissionInput!): RainbowSubmission   # called by bot
reviewRainbowSubmission(submissionId: ID!, approved: Boolean!, denialReason: String): RainbowSubmission

chooseCapstonePath(teamId: ID!, tileCode: String!, nextTileCode: String!): RainbowTeamTile

addRainbowAdmin(eventId: ID!, userId: ID!): RainbowEvent
removeRainbowAdmin(eventId: ID!, userId: ID!): RainbowEvent
```

### Subscriptions

```graphql
rainbowSubmissionAdded(eventId: ID!): RainbowSubmission    # admins get live alerts
rainbowTeamBoardUpdated(teamId: ID!): [RainbowTeamTile]   # board updates in real-time
```

### Approval Side Effects (server-side on `reviewRainbowSubmission`)

When a FINAL submission is approved:
1. `RainbowSubmission.status` → `APPROVED`
2. `RainbowTeamTile.status` → `COMPLETE`, `completedAt` set
3. Check `tileGraph` for tiles that now have all prerequisites met → set those to `UNLOCKED`
4. Fire `rainbowTeamBoardUpdated` subscription
5. Bot posts tile unlock announcement to team's Discord channel

When a PRE submission is approved:
1. `RainbowSubmission.status` → `APPROVED`
2. `RainbowTeamTile.status` → `PRE_APPROVED`

When denied (either type):
1. `RainbowSubmission.status` → `DENIED`
2. `RainbowTeamTile.status` → back to `UNLOCKED`
3. Bot posts denial message to team's channel with reason

---

## Pages & UI

### `/eg-rainbow` — Main Board

- Visual grid matching the board layout (positions from the CSV)
- Tiles rendered as colored cards (red/orange/yellow/green/blue/indigo/violet/grey-for-capstone)
- **Team selector** — dropdown to pick which team's board to view
- **Tile appearance by state:**

| State | Visual |
|-------|--------|
| LOCKED | Dark card, `?` icon, no label |
| UNLOCKED | Colored card, tile label, pulsing border |
| PRE_SUBMITTED / SUBMITTED | Colored card, "⏳ Pending" badge |
| PRE_APPROVED | Colored card, "📸 Pre-approved" badge |
| COMPLETE | Colored card, checkmark, slightly muted |
| DENIED | Colored card, "❌ Denied" badge |

- Clicking a COMPLETE or UNLOCKED tile shows a tooltip/modal with tile details (boss, target, notes)
- Clicking a LOCKED tile shows nothing (or a generic "locked" message)

### `/eg-rainbow/refs` — Reference Images

- Public page (no auth required)
- One section per color path
- Each tile has a gallery slot for reference images showing valid submissions
- Admin can upload/manage ref images via the admin panel
- Useful for showing: what a valid unique screenshot looks like, what KC screen to show, etc.

### `/eg-rainbow/admin` — Admin Panel

- Protected (admins only, based on `adminIds` on the event)
- **Submission queue** — tabbed: PRE submissions | FINAL submissions
- Each submission card shows:
  - Team name
  - Tile code + label
  - Screenshot (click to enlarge)
  - Submitted at timestamp
  - Approve / Deny buttons
  - Deny shows text input for reason
- **Live updates** via `rainbowSubmissionAdded` subscription (toast + audio cue)
- Team board overview (see all teams' progress at a glance)
- Team management (create team, set channel ID, set captain)
- Event status controls (ACTIVE / PAUSED / COMPLETE)
- Ref image management (upload images per tile for `/eg-rainbow/refs`)
- Capstone choice override (admin can manually set next path if team can't do it themselves)

---

## Bot File

New file: `bot/commands/rainbowbingo.js`

Commands: `rbsubmit`, `rbpre`  
Aliases: `rbs`, `rbp`

Structure mirrors `bot/commands/clanwars.js` — lazy-loads models, validates channel → team → tile, creates submission record, fires Discord embed.

---

## Routes (client/src/routes.jsx additions)

```js
{ path: '/eg-rainbow',       element: <RainbowBingoBoardPage /> }
{ path: '/eg-rainbow/refs',  element: <RainbowBingoRefsPage /> }
{ path: '/eg-rainbow/admin', element: <RainbowBingoAdminPage /> }
```

---

## Static Tile Catalog

Stored in `server/utils/rainbowTiles.js` as a plain JS array (no DB table needed — tiles don't change).

The `tileGraph` (prerequisites) is stored on `RainbowEvent` as JSONB, so it can be adjusted per-event if needed.

---

## Build Order

### Phase 0: Finalize Design (Before Any Code)

- [ ] Confirm starting tiles (which tiles begin UNLOCKED per team)
- [ ] Confirm full DAG for all 7 color paths (user to fill in branching for R, O, G, B, I, V)
- [ ] Confirm capstone connection points (which color paths each capstone connects)
- [ ] Confirm tile names (e.g. O2 "Doom" — full boss name?)
- [ ] Confirm C2 "grindr" rule — does it auto-complete alongside V1 or require separate submission?
- [ ] Decide on winner condition (most tiles by end date? full board completion? first to finish?)

### Phase 1: Data Foundation

- [ ] `server/utils/rainbowTiles.js` — static tile catalog (56 tiles)
- [ ] `server/db/models/RainbowEvent.js`
- [ ] `server/db/models/RainbowTeam.js`
- [ ] `server/db/models/RainbowTeamTile.js`
- [ ] `server/db/models/RainbowSubmission.js`
- [ ] DB migrations for all 4 models
- [ ] `server/db/seeders/` — seed one active event + 2 test teams with initial tile states
- [ ] `server/utils/rainbowBingoHelpers.js` — tile unlock logic (`getNewlyUnlockedTiles(tileGraph, completedTiles)`)

### Phase 2: GraphQL API

- [ ] `server/schema/resolvers/RainbowBingo.js` — all queries, mutations, subscriptions
- [ ] Wire into main schema
- [ ] Test approval side effects (unlock logic, subscription fires)

### Phase 3: Discord Bot

- [ ] `bot/commands/rainbowbingo.js` — `!rbpre` and `!rbsubmit`
- [ ] Staff channel notification on new submission
- [ ] Tile unlock announcement to team channel on approval
- [ ] Denial message to team channel

### Phase 4: Admin Panel (`/eg-rainbow/admin`)

- [ ] Submission queue with PRE / FINAL tabs
- [ ] Approve / deny with reason
- [ ] Live subscription alert for new submissions
- [ ] Team management (create team, set channelId)
- [ ] Event status control
- [ ] Basic team progress overview

### Phase 5: Main Board (`/eg-rainbow`)

- [ ] Visual grid layout matching the board CSV positions
- [ ] Tile state rendering (locked/unlocked/submitted/complete)
- [ ] Team selector
- [ ] Tile detail tooltip/modal for unlocked/complete tiles
- [ ] Fog of war (locked tiles as mystery cards)
- [ ] Live subscription updates (board refreshes when tiles complete)

### Phase 6: Refs Page (`/eg-rainbow/refs`)

- [ ] Public reference image gallery
- [ ] Admin image upload per tile (in admin panel)
- [ ] Organized by color path

### Phase 7: Capstone Logic

- [ ] `chooseCapstonePath` mutation + UI (team captain selects next path in-app)
- [ ] Bot announces capstone completion + prompt team to choose direction
- [ ] Admin override for capstone choice

---

## Open Questions (Resolve in Phase 0)

1. **Prerequisite rules for R, O, G, B, I, V** — are they all strictly linear, or is there branching like Yellow's? Confirm before Phase 1.
2. **Capstone connections** — which color path(s) does each capstone connect to/unlock?
3. **Winner condition** — is there a winner, or is it a personal completion challenge for the clan?
4. **Pre-screenshot requirement** — mandatory for all tiles, optional, or only required for KC/xp tiles?
