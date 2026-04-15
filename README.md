# 🗺️ OSRS Bingo Hub

**The ultimate competitive event platform for Old School RuneScape clans.**

Create custom bingo boards to track your goals, run full-scale **Gielinor Rush** events where teams race across procedurally generated maps, host a **Blind Draft** to build balanced teams, or run a full clan tournament with **Champion Forge**.

🌐 **[osrsbingohub.com](https://www.osrsbingohub.com)** • 3,000+ boards created • Built for the community

---

## ✨ Features

### 🎯 Bingo Boards

- **Fully customizable** tiles with any OSRS objective
- **Progress tracking** — set a goal and drag a slider to update progress per tile
- **Share with clanmates** via unique links
- **Multiple templates** to get started quickly

### ⚔️ Gielinor Rush

- **Procedurally generated maps** tailored to your event configuration
- **Three difficulty paths** per location — Short, Medium, and Long objectives
- **Key & Inn mechanics** — collect keys, trade for bonus GP at checkpoints
- **Buff system** — earn and spend buffs to reduce objective requirements
- **Automated prize distribution** with hard-capped budget guarantees
- **Discord bot integration** — submit proofs, check progress, all from Discord
- **Live updates** via WebSocket subscriptions

### ⚔️ Champion Forge

- **Four-phase tournament structure**: Draft → Gathering → Outfitting → Battle
- **Gathering phase** — players complete OSRS tasks to earn items for their war chest, submitted via Discord bot with admin approve/deny review
- **War chest** — approved drops become equippable gear and consumables for your champion
- **Outfitting phase** — full paperdoll gear slots (helm, cape, amulet, weapon, chest, shield, legs, gloves, boots, ring, trinket) with a live training dummy battle previewer
- **Turn-based battle engine** — attacks, defends, specials, and consumable items
- **Bracket support** — single-elimination and double-elimination formats
- **Live battle screen** with real-time WebSocket updates and a per-turn action timer
- **Battle replay** — step through any completed fight turn by turn
- **Per-action visual effects** — CSS-animated slashes, crits, shield ripples, lightning arcs, bleed drips, drain orbs, heals, explosions, buffs, and debuffs
- **Synthesized sound effects** — every action has a unique Web Audio API sound, with a per-user volume slider

### 🎲 Blind Draft

- **Create a draft room** with a custom name, team count, and pick timer
- **Three draft formats**: Snake, Linear, or Auction
- **Blind picks** — teams can't see each other's selections during the draft
- **Captain PIN system** — captains join via a shareable link and room PIN
- **Auto-timer** — configurable pick clock enforces pace
- **Big reveal** — all picks are revealed simultaneously when the draft completes
- **Stat categories & tier formulas** — weight players by any custom stat

### ⚖️ Team Balancer

- **Paste any list of RSNs** — stats are fetched automatically via Wise Old Man
- **Weighted scoring** across EHP, EHB, EHP/year, EHB/year, total level, and raid KCs (CoX, ToB, ToA)
- **Presets** for common event types: All-Rounder, PvM Focused, Skilling Focused, Raid Specialist
- **Fully adjustable weights** — fine-tune each stat's contribution with sliders
- **Hours-per-day slider** per player for balancing around availability
- **Auto-balance** assigns players to teams using a greedy score-equalization algorithm
- **Drag-and-drop** to manually move players between teams after auto-balancing
- **CSV export** for sharing team assignments

### 🏆 Group Dashboard

- **WOM-powered group tracking** — connect any Wise Old Man group and display live goal progress
- **Custom goals** — admins define skill/boss targets with start snapshots and deadlines
- **WOM competitions** — surface active and upcoming competitions with live countdowns and progress bars
- **Follow system** — any user can follow a group dashboard to keep it accessible
- **Auto-sync** — group data refreshes from WOM automatically (1-hour TTL, manual refresh available)
- **Custom themes** — per-group accent colors and branding
- **Admin management** — transfer ownership, add/remove co-admins
- **Activity feed** — per-group log of recent member events
- **Discord integration** — optional webhook for posting goal completions

---

## 🛠️ Tech Stack

| Layer         | Technologies                                     |
| ------------- | ------------------------------------------------ |
| **Frontend**  | React 18, Chakra UI, Apollo Client, Leaflet Maps |
| **Backend**   | Node.js, Express, Apollo Server (GraphQL)        |
| **Database**  | PostgreSQL, Sequelize ORM                        |
| **Real-time** | GraphQL Subscriptions (WebSocket)                |
| **Bot**       | Discord.js                                       |
| **Hosting**   | Heroku                                           |

---

## 🎮 For Event Runners

### Running a Gielinor Rush

| Step             | Action                                               |
| ---------------- | ---------------------------------------------------- |
| **1. Configure** | Set prize pool, team count, difficulty, and duration |
| **2. Generate**  | System creates a balanced map automatically          |
| **3. Invite**    | Share event password with your clan                  |
| **4. Monitor**   | Review submissions and watch the leaderboard live    |
| **5. Payout**    | Winners calculated automatically — you're done!      |

> 💡 **Budget Guarantee**: The hard-capped system ensures you'll _never_ owe more than your prize pool, no matter what teams achieve.

### Running a Champion Forge

| Step               | Action                                                                    |
| ------------------ | ------------------------------------------------------------------------- |
| **1. Draft**       | Configure teams, members, tasks, and phase durations                      |
| **2. Gathering**   | Players complete OSRS tasks and submit proof via Discord bot               |
| **3. Review**      | Admins approve or deny submissions; items land in each team's war chest    |
| **4. Outfitting**  | Teams equip their champion from their war chest before the timer runs out  |
| **5. Battle**      | Champions fight in a live turn-based bracket — last team standing wins!   |

### Running a Blind Draft

| Step            | Action                                                  |
| --------------- | ------------------------------------------------------- |
| **1. Create**   | Set room name, team count, format, and pick timer       |
| **2. Add pool** | Import the player pool with optional stat categories    |
| **3. Invite**   | Share room links with team captains; they join with PIN |
| **4. Draft**    | Each captain picks in turn — other teams can't see      |
| **5. Reveal**   | All picks revealed at once when the draft completes     |

### Using the Team Balancer

| Step              | Action                                                          |
| ----------------- | --------------------------------------------------------------- |
| **1. Paste RSNs** | Enter one username per line — stats are fetched from WOM        |
| **2. Pick preset**| Choose All-Rounder, PvM Focused, Skilling Focused, or Raid Specialist |
| **3. Tune**       | Adjust stat weights and optional hours-per-day per player       |
| **4. Balance**    | Auto-assign teams or drag players between teams manually        |
| **5. Export**     | Download a CSV of final team assignments                        |

### Setting Up a Group Dashboard

| Step             | Action                                                             |
| ---------------- | ------------------------------------------------------------------ |
| **1. Create**    | Link your Wise Old Man group ID and give the dashboard a name      |
| **2. Add goals** | Define skill or boss targets with deadlines                        |
| **3. Share**     | Share the dashboard link — anyone can view and follow it           |
| **4. Monitor**   | Track goal progress, competition countdowns, and the activity feed |

---

## 🏗️ Architecture

```
osrs-bingo-hub/
├── client/          # React frontend (Chakra UI)
├── server/          # Node.js GraphQL backend
└── bot/             # Discord bot for Gielinor Rush
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js v20.19.3 (via NVM — see setup below)
- PostgreSQL v12+
- Discord Bot Token _(optional)_

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/osrs-bingo-hub.git
cd osrs-bingo-hub

# Install all dependencies
cd client && npm install
cd ../server && npm install
cd ../bot && npm install  # optional
```

### 2. Configure Environment

**Server** (`/server/.env`):

```env
DATABASE_URL=postgres://user:pass@localhost:5432/osrsbingo
PORT=4000
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
DISCORD_BOT_TOKEN=your-bot-token  # optional
```

**Client** (`/client/.env`):

```env
REACT_APP_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
REACT_APP_WS_ENDPOINT=ws://localhost:4000/graphql
```

### 3. Setup Database

```bash
cd server/db
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all  # optional sample data
```

### 4. Launch

```bash
# Terminal 1 — Server
cd server && node index.js
# → http://localhost:4000

# Terminal 2 — Client
cd client && npm start
# → http://localhost:3000

# Terminal 3 — Bot (optional)
cd bot && npm start
```

---

## 🧰 Local Development Setup (First-Time / Fresh Machine)

This section covers everything you need to get fully running from scratch, including common pitfalls.

### Node Version (NVM)

This project uses **Node v20.19.3**. Managing it via NVM is strongly recommended.

```bash
# Install NVM (if not already installed via Homebrew)
brew install nvm

# Add to your shell config (~/.zshrc or ~/.bashrc):
export NVM_DIR="$HOME/.nvm"
[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"

# Reload your shell, then install and use the correct version
nvm install 20.19.3
nvm use 20.19.3

# Verify
node --version  # should print v20.19.3
```

> ⚠️ If you see `EBADENGINE` warnings during `npm install`, it means you're on the wrong Node version. Run `nvm use 20.19.3` before installing.

The `bingostart` script handles this automatically per terminal tab — but for manual installs, always set your Node version first.

---

### PostgreSQL Setup

#### 1. Install & Start PostgreSQL

```bash
brew install postgresql@14  # or whichever version you prefer (v12+)
brew services start postgresql@14
```

To verify it's running:

```bash
brew services list  # postgresql should show "started"
```

#### 2. Create the `postgres` Role

Homebrew installs PostgreSQL with your Mac username as the default superuser, **not** `postgres`. The app expects a `postgres` role, so create it:

```bash
psql postgres -c "CREATE ROLE postgres WITH SUPERUSER LOGIN;"
```

> ⚠️ If you skip this step, you'll get: `ConnectionError: role "postgres" does not exist`

#### 3. Create the Database

```bash
psql postgres -c "CREATE DATABASE osrsbingo OWNER postgres;"
```

Replace `osrsbingo` with whatever your `DATABASE_URL` in `.env` points to if different.

#### 4. Run Migrations

```bash
cd server/db
npx sequelize-cli db:migrate
```

---

### Common Errors & Fixes

| Error                                 | Cause                                           | Fix                                                             |
| ------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| `EBADENGINE` on `npm install`         | Wrong Node version                              | `nvm use 20.19.3`                                               |
| `ECONNREFUSED` on port 5432           | PostgreSQL not running                          | `brew services start postgresql@14`                             |
| `role "postgres" does not exist`      | Homebrew uses your Mac username, not `postgres` | `psql postgres -c "CREATE ROLE postgres WITH SUPERUSER LOGIN;"` |
| `database "osrsbingo" does not exist` | DB not created yet                              | `psql postgres -c "CREATE DATABASE osrsbingo OWNER postgres;"`  |
| `npm run dev` crashes immediately     | Missing `.env` file                             | Copy `.env.example` to `.env` and fill in values                |

---

### Using the `bingo` Script

There's a helper script in `.zshrc` that opens all tabs and starts everything automatically:

```bash
bingo
```

This runs `bingostart` (opens bot, client, and server tabs with `nvm use 20.19.3` and `npm i` per tab) and `bingostatus` together. Make sure PostgreSQL is already running before calling it, or the server tab will crash on startup.

---

## 💰 Gielinor Rush: How It Works

### The Game Loop

1. **Navigate** — Teams start at the START node and unlock paths across the map
2. **Choose** — Each location offers Short, Medium, or Long objectives (pick ONE per location)
3. **Complete** — Finish OSRS tasks (boss KC, XP gains, item drops, clue scrolls, etc.)
4. **Submit** — Upload proof via Discord bot
5. **Earn** — Approved submissions grant GP + keys
6. **Trade** — Spend keys at Inns for bonus GP rewards (inn completes on purchase)
7. **Win** — Highest GP total at event end takes the prize!

### Map Structure

| Element             | Description                                                                        |
| ------------------- | ---------------------------------------------------------------------------------- |
| **Location Groups** | Each map location offers 3 difficulty variants                                     |
| **One Choice Rule** | Teams can only complete ONE difficulty per location                                |
| **Paths**           | Mountain (🔴), Trade Route (🔵), Coastal (🟢) — each grants different colored keys |
| **Inns**            | Checkpoints where teams trade keys for GP bonuses — completing an Inn requires making a purchase |

### Objective Types

| Type                | Description                                      |
| ------------------- | ------------------------------------------------ |
| **Boss KC**         | Kill a boss N times                              |
| **XP Gain**         | Gain N XP in a skill                             |
| **Item Collection** | Obtain N drops from a boss or raid               |
| **Minigame**        | Complete N runs of a minigame                    |
| **Clue Scrolls**    | Complete N clue scrolls of a given tier          |

### Buffs

Buffs are earned from nodes and Inn purchases. They reduce objective requirements when applied.

| Category    | Options                             |
| ----------- | ----------------------------------- |
| **Kill**    | 25%, 50%, or 75% KC reduction       |
| **XP**      | 25%, 50%, or 75% XP reduction       |
| **Items**   | 25% drop count reduction            |
| **Universal** | 50% reduction on any objective    |
| **Multi-use** | 25% reduction on two objectives   |

> Item buffs require the objective to have more than 2 drops.

### Budget System

The prize pool is automatically distributed with a **hard-capped guarantee**:

| Allocation | Default | Description                          |
| ---------- | ------- | ------------------------------------ |
| **Nodes**  | 70%     | GP earned from completing objectives |
| **Inns**   | 30%     | GP earned from trading keys          |

#### Node Rewards by Difficulty

| Difficulty  | GP Value      | Keys Earned |
| ----------- | ------------- | ----------- |
| 🟢 Short    | 20% of max    | 1 key       |
| 🟡 Medium   | 70% of max    | 1 key       |
| 🔴 Long     | 100% of max   | 2 keys      |

> Long nodes pay **5× more** than Short nodes. Each path's max GP is calibrated to the total node budget.

#### Inn Trade Options

| Option     | Key Cost        | Payout    |
| ---------- | --------------- | --------- |
| **Quick**  | 2 any           | 80% base  |
| **Standard** | 4 any         | 100% base |
| **Combo**  | 2🔴 + 2🔵 + 2🟢 | 120% base |

---

## ⚔️ Champion Forge: How It Works

### The Four Phases

| Phase          | What Happens                                                                 |
| -------------- | ---------------------------------------------------------------------------- |
| **Draft**      | Admin configures teams, assigns members, sets task list and phase timings    |
| **Gathering**  | Players complete OSRS tasks and submit proof via Discord bot                 |
| **Outfitting** | Teams equip their champion with war chest items before the deadline          |
| **Battle**     | Turn-based bracket combat — champions fight until one team is left standing  |

### Battle Mechanics

| Action      | Description                                                                  |
| ----------- | ---------------------------------------------------------------------------- |
| **Attack**  | Deal damage based on weapon stats vs. opponent's defense                     |
| **Defend**  | Reduce incoming damage for the next hit                                      |
| **Special** | Unique ability tied to your equipped weapon (cleave, barrage, lifesteal, etc.) |
| **Item**    | Use a consumable from your war chest (heal, damage, debuff, buff, etc.)      |

### Stats & Items

Champion stats are derived from equipped gear. Item slots: helm, cape, amulet, trinket, weapon, chest, shield, legs, gloves, boots, ring, and two consumable slots. Items are earned exclusively through gathering phase submissions — no pay-to-win.

### Discord Bot Commands (Champion Forge)

| Command                          | Description                                      |
| -------------------------------- | ------------------------------------------------ |
| `!cfsubmit <task_id>` + img      | Submit a task completion for review              |
| `!cfpresubmit`                   | Record a pre-screenshot baseline for XP tasks    |

---

## 🎲 Blind Draft: How It Works

### Formats

| Format      | Description                                                           |
| ----------- | --------------------------------------------------------------------- |
| **Snake**   | Teams pick in order, reversing each round (1-2-3-3-2-1...)           |
| **Linear**  | Teams always pick in the same order (1-2-3-1-2-3...)                 |
| **Auction** | Each team bids on players using a budget                              |

### Draft Flow

1. Organizer creates a room and sets format, team count, pick timer, and player pool
2. Each team gets a unique join link + PIN for their captain
3. Once all captains join, organizer starts the draft
4. Teams pick in turn — picks are **hidden** from other teams during the draft
5. When all picks are done, picks are **revealed to everyone simultaneously**

### Picking Rules

- Pick timer is enforced per pick (default 60s) — the organizer can pick on behalf of a timed-out captain
- Organizer can always make picks regardless of whose turn it is
- Picks per turn is configurable (default: 1)

---

## ⚖️ Team Balancer: How It Works

### Scoring

Each player is scored by a weighted sum of their WOM stats:

| Stat        | Description                                              |
| ----------- | -------------------------------------------------------- |
| **EHP**     | Efficient Hours Played (lifetime)                        |
| **EHB**     | Efficient Hours Bossed (lifetime)                        |
| **EHP/Y**   | EHP gained in the last year — measures recent activity   |
| **EHB/Y**   | EHB gained in the last year — measures recent bossing    |
| **Lvl**     | Total level, normalized to 2376                          |
| **CoX**     | Chambers of Xeric KC (including CM)                      |
| **ToB**     | Theatre of Blood KC (including HM)                       |
| **ToA**     | Tombs of Amascut KC (including Expert)                   |

### Presets

| Preset             | Best for                                               |
| ------------------ | ------------------------------------------------------ |
| **All-Rounder**    | Mixed-content events where overall versatility matters |
| **PvM Focused**    | Bossing events — weights recent EHB/Y and raid KCs     |
| **Skilling Focused** | XP races or skilling events — ignores bossing stats  |
| **Raid Specialist** | Raid events — weights CoX, ToB, ToA, and EHB/Y heavily |

### Auto-Balance Algorithm

Players are sorted by score descending and assigned one at a time to whichever team currently has the lowest total score — producing near-equal team strength without manual effort.

---

## 🏆 Group Dashboard: How It Works

### Goals

Admins define goals with a **metric** (skill XP, boss KC, etc.), a **target value**, and an optional deadline. The dashboard captures a WOM snapshot at goal creation as the baseline and shows progress toward the target in real time.

### Competitions

Any active or upcoming WOM competition for the group is automatically surfaced with a live countdown timer and per-player progress bars.

### Sync

Group data is synced from Wise Old Man automatically with a 1-hour TTL. Admins can force a manual refresh at any time. The dashboard shows when the last sync occurred and when the next one is due.

---

## 🤖 Discord Bot

Integrate your Gielinor Rush event directly into Discord for seamless team coordination.

### Setup

1. Create a Discord app at [discord.com/developers](https://discord.com/developers)
2. Add a bot and copy the token to your `.env`
3. Invite bot to your server with permissions: Send Messages, Read Messages, Embed Links
4. Set any channel's **topic** to your Event ID (i.e., `event_abc123`)

### Commands

| Command                          | Description                            |
| -------------------------------- | -------------------------------------- |
| `!treasurehunt` / `!th`          | View team status and available nodes   |
| `!nodes`                         | List all available and completed nodes |
| `!submit <node_id>` + upload img | Submit completion proof                |
| `!leaderboard` / `!lb`           | View current event rankings            |

---

## 🗄️ Database

### Core Tables

| Table                 | Purpose                          |
| --------------------- | -------------------------------- |
| `Users`               | Accounts & authentication        |
| `BingoBoards`         | Bingo board configurations       |
| `BingoTiles`          | Individual tile objectives       |
| `TreasureEvents`      | Gielinor Rush event config       |
| `TreasureTeams`       | Competing teams                  |
| `TreasureNodes`       | Map objectives                   |
| `TreasureSubmissions` | Proof submissions                |
| `TreasureActivity`    | Live activity feed               |
| `DraftRooms`          | Blind Draft room config          |
| `DraftPlayers`        | Player pool entries per room     |
| `ClanWarsEvents`      | Champion Forge event config      |
| `ClanWarsTeams`       | Competing teams and war chests   |
| `ClanWarsTasks`       | Gathering phase task definitions |
| `ClanWarsSubmissions` | Proof submissions with review    |
| `ClanWarsItems`       | Equippable item definitions      |
| `ClanWarsTeamItems`   | Items earned per team            |
| `ClanWarsBattles`     | Battle instances and state       |
| `ClanWarsBattleEvents`| Turn-by-turn battle log          |

### Migration Commands

```bash
cd server/db

# Run migrations
npx sequelize-cli db:migrate

# Create new migration
npx sequelize-cli migration:generate --name your-migration-name

# Rollback
npx sequelize-cli db:migrate:undo
```

---

## 🧪 Development

### Test Database Setup

Integration tests (e.g. Champion Forge) run against a local `database_test` Postgres database. One-time setup:

```bash
# 1. Create the test database
createdb database_test

# 2. Run migrations against it (run from the server/ directory)
cd server
npx sequelize-cli db:migrate \
  --config db/config/config.json \
  --migrations-path db/migrations \
  --env test
```

The `test` config in `server/db/config/config.json` connects as your local Mac username (no password) on `127.0.0.1:5432`. If your local Postgres superuser is different, update the `username` field in that config.

To run the integration tests:

```bash
cd server
npx jest __tests__/championForge.test.js
```

> Each test suite cleans up its own data in `afterAll`, so repeated runs are safe.

### Dev Mode with Hot Reload

```bash
# Server (nodemon)
cd server && npm run dev

# Client (React dev server)
cd client && npm start

# Bot (nodemon)
cd bot && npm run dev
```

### Project Structure

```
server/
├── index.js                    # Entry point
├── schema/
│   ├── resolvers/              # Query & mutation handlers
│   └── typeDefs.js             # GraphQL schema
├── db/
│   ├── models/                 # Sequelize models
│   └── migrations/             # Database migrations
└── utils/
    ├── treasureMapGenerator.js # Procedural map generation
    ├── objectiveBuilder.js     # OSRS objective creation
    └── buffHelpers.js          # Buff system logic

client/
├── src/
│   ├── components/             # Reusable UI components
│   ├── pages/                  # Route pages
│   ├── graphql/                # Queries, mutations, subscriptions
│   ├── providers/              # Context providers
│   └── hooks/                  # Custom React hooks
└── public/                     # Static assets

bot/
├── index.js                    # Bot entry point
├── commands/                   # Discord command handlers
└── utils/                      # Bot utilities
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 💬 Support

- 🐛 **Issues**: Open a GitHub issue
- 💬 **Discord**: Join the community server
- 📧 **Contact**: Reach out to the maintainer

---

## 📄 License

This is proprietary software. All rights reserved. For licensing inquiries or partnership opportunities, please email me using the email attached to my GitHub account.

---

<div align="center">

**Made with ❤️ for the OSRS community**

[Visit OSRS Bingo Hub](https://www.osrsbingohub.com)

</div>
