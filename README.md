# 🗺️ OSRS Bingo Hub

**The ultimate competitive event platform for Old School RuneScape clans.**

Create custom bingo boards to track your goals, or run full-scale **Gielinor Rush** events where teams race across procedurally generated maps, completing OSRS objectives and battling for a GP prize pool.

🌐 **[osrsbingohub.com](https://www.osrsbingohub.com)** • 3,000+ boards created • Built for the community

---

## ✨ Features

### 🎯 Bingo Boards

- **Fully customizable** tiles with any OSRS objective
- **Share with clanmates** via unique links
- **Real-time progress** tracking
- **Multiple templates** to get started quickly

### ⚔️ Gielinor Rush

- **Procedurally generated maps** tailored to your event configuration
- **Three difficulty paths** per location — risk vs. reward strategy
- **Key & Inn mechanics** — collect keys, trade for bonus GP at checkpoints
- **Automated prize distribution** with hard-capped budget guarantees
- **Discord bot integration** — submit proofs, check progress, all from Discord
- **Live updates** via WebSocket subscriptions

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

Running a Gielinor Rush event is straightforward:

| Step             | Action                                               |
| ---------------- | ---------------------------------------------------- |
| **1. Configure** | Set prize pool, team count, difficulty, and duration |
| **2. Generate**  | System creates a balanced map automatically          |
| **3. Invite**    | Share event password with your clan                  |
| **4. Monitor**   | Review submissions and watch the leaderboard live    |
| **5. Payout**    | Winners calculated automatically — you're done!      |

> 💡 **Budget Guarantee**: The hard-capped system ensures you'll _never_ owe more than your prize pool, no matter what teams achieve.

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

| Error | Cause | Fix |
| ----- | ----- | --- |
| `EBADENGINE` on `npm install` | Wrong Node version | `nvm use 20.19.3` |
| `ECONNREFUSED` on port 5432 | PostgreSQL not running | `brew services start postgresql@14` |
| `role "postgres" does not exist` | Homebrew uses your Mac username, not `postgres` | `psql postgres -c "CREATE ROLE postgres WITH SUPERUSER LOGIN;"` |
| `database "osrsbingo" does not exist` | DB not created yet | `psql postgres -c "CREATE DATABASE osrsbingo OWNER postgres;"` |
| `npm run dev` crashes immediately | Missing `.env` file | Copy `.env.example` to `.env` and fill in values |

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
2. **Choose** — Each location offers Easy, Medium, or Hard objectives (pick ONE)
3. **Complete** — Finish OSRS tasks (boss KC, XP gains, item collection, etc.)
4. **Submit** — Upload proof via Discord or web interface
5. **Earn** — Approved submissions grant GP + keys
6. **Trade** — Spend keys at Inns for bonus GP rewards
7. **Win** — Highest GP total at event end takes the prize!

### Map Structure

| Element             | Description                                                                        |
| ------------------- | ---------------------------------------------------------------------------------- |
| **Location Groups** | Each map location offers 3 difficulty variants                                     |
| **One Choice Rule** | Teams can only complete ONE difficulty per location                                |
| **Paths**           | Mountain (🔴), Trade Route (🔵), Coastal (🟢) — each grants different colored keys |
| **Inns**            | Checkpoints where teams trade keys for GP bonuses                                  |

### Budget System

The prize pool is automatically distributed with a **hard-capped guarantee**:

| Allocation | Default | Description                          |
| ---------- | ------- | ------------------------------------ |
| **Nodes**  | 70%     | GP earned from completing objectives |
| **Inns**   | 30%     | GP earned from trading keys          |

#### Node Rewards by Difficulty

| Difficulty | GP Multiplier | Keys Earned |
| ---------- | ------------- | ----------- |
| 🟢 Easy    | 0.5x base     | 1 key       |
| 🟡 Medium  | 1.0x base     | 1 key       |
| 🔴 Hard    | 1.5x base     | 2 keys      |

#### Inn Trade Options

| Option     | Key Cost        | Payout    |
| ---------- | --------------- | --------- |
| **Small**  | 2 any           | 80% base  |
| **Medium** | 4 any           | 100% base |
| **Combo**  | 2🔴 + 2🔵 + 2🟢 | 120% base |

#### Example: 100M Prize Pool (10 Teams)

```
Per-team budget: 10,000,000 GP

┌─────────────────┬──────────┬─────────┬───────────┬──────────┐
│ Strategy        │ Node GP  │ Inn GP  │ Total     │ % Budget │
├─────────────────┼──────────┼─────────┼───────────┼──────────┤
│ All Easy+Small  │ 2.33M    │ 2.0M    │ 4.33M     │ 43%      │
│ Mixed/Average   │ 4.67M    │ 2.5M    │ 7.17M     │ 72%      │
│ All Hard+Combo  │ 7.0M     │ 3.0M    │ 10.0M     │ 100%     │
└─────────────────┴──────────┴─────────┴───────────┴──────────┘
```

> ✅ **Guaranteed**: Maximum possible payout = 100% of budget. Event runners always have enough GP.

---

## 🤖 Discord Bot

Integrate your event directly into Discord for seamless team coordination.

### Setup

1. Create a Discord app at [discord.com/developers](https://discord.com/developers)
2. Add a bot and copy the token to your `.env`
3. Invite bot to your server with permissions: Send Messages, Read Messages, Embed Links
4. Set any channel's **topic** to your Event ID (e.g., `event_abc123`)

### Commands

| Command                         | Description                            |
| ------------------------------- | -------------------------------------- |
| `!treasurehunt` / `!th`         | View team status and available nodes   |
| `!nodes`                        | List all available and completed nodes |
| `!submit <node_id> <proof_url>` | Submit completion proof                |
| `!leaderboard` / `!lb`          | View current event rankings            |
| `!buffs`                        | Check team's available buffs           |

---

## 🗄️ Database

### Core Tables

| Table                 | Purpose                    |
| --------------------- | -------------------------- |
| `Users`               | Accounts & authentication  |
| `BingoBoards`         | Bingo board configurations |
| `BingoTiles`          | Individual tile objectives |
| `TreasureEvents`      | Gielinor Rush event config |
| `TreasureTeams`       | Competing teams            |
| `TreasureNodes`       | Map objectives             |
| `TreasureSubmissions` | Proof submissions          |
| `TreasureActivity`    | Live activity feed         |

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
├── graphql/
│   ├── resolvers/              # Query & mutation handlers
│   ├── subscriptions/          # Real-time subscriptions
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