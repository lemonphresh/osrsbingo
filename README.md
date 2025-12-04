# OSRS Bingo Hub

A comprehensive web platform for Old School RuneScape players to create bingo boards and compete in Gielinor Rush events with their clanmates.

## 🎮 Overview

OSRS Bingo Hub ([osrsbingohub.com](https://www.osrsbingohub.com)) provides two main game modes:

- **Bingo Boards**: Create custom bingo boards for personal goals or clan competitions
- **Gielinor Rush**: Team-based competitive events where teams race through generated maps completing OSRS objectives

## 🏗️ Architecture

The project consists of three main components:

```
osrs-bingo-hub/
├── client/          # React frontend application
├── server/          # Node.js/Express GraphQL backend
└── bot/             # Discord bot for Gielinor Rush integration
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Discord Bot Token (optional, for Discord integration)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/osrs-bingo-hub.git
   cd osrs-bingo-hub
   ```

2. **Install dependencies for all components**

   ```bash
   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install

   # Install bot dependencies (optional)
   cd ../bot
   npm install
   ```

3. **Database Setup**

   ```bash
   cd server/db

   # Run database migrations
   npx sequelize-cli db:migrate

   # Seed initial data (optional)
   npx sequelize-cli db:seed:all
   ```

4. **Start the application**

   ```bash
   # Terminal 1: Start the server
   cd server
   node index.js
   # Server runs on http://localhost:4000

   # Terminal 2: Start the client
   cd client
   npm start
   # Client runs on http://localhost:3000

   # Terminal 3 (optional): Start the Discord bot
   cd bot
   npm start
   ```

## 📁 Component Details

### Server (Backend)

**Location**: `/server`

The backend is built with Node.js, Express, and GraphQL, using PostgreSQL for data persistence.

#### Key Technologies

- **GraphQL** with Apollo Server for API
- **Sequelize ORM** for database management
- **PostgreSQL** for data storage
- **JWT** for authentication
- **WebSocket** for real-time subscriptions

#### Environment Variables

Create a `.env` file in the `/server` directory:

```env
# Database
DATABASE_URL=postgres://username:password@localhost:5432/osrsbingo
# Or use individual settings:
DB_HOST=localhost
DB_USER=postgres
DB_PASS=password
DB_NAME=osrsbingo

# Server
PORT=4000
NODE_ENV=development

# Authentication
JWT_SECRET=your-secret-key-here
SESSION_SECRET=your-session-secret

# Discord (optional)
DISCORD_BOT_TOKEN=your-bot-token
```

#### Database Configuration

The database configuration is managed in `/server/config/config.json`:

```json
{
  "development": {
    "username": "postgres",
    "password": "password",
    "database": "osrsbingo",
    "host": "127.0.0.1",
    "dialect": "postgres"
  },
  "production": {
    "use_env_variable": "DATABASE_URL",
    "dialect": "postgres",
    "dialectOptions": {
      "ssl": {
        "require": true,
        "rejectUnauthorized": false
      }
    }
  }
}
```

### Client (Frontend)

**Location**: `/client`

A React-based single-page application with Chakra UI for styling.

#### Key Technologies

- **React 18** with hooks
- **Apollo Client** for GraphQL
- **Chakra UI** for component library
- **React Router** for navigation
- **Leaflet** for map visualization

#### Environment Variables

Create a `.env` file in the `/client` directory:

```env
# API Configuration
REACT_APP_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
REACT_APP_WS_ENDPOINT=ws://localhost:4000/graphql

# Discord Bot (optional)
REACT_APP_DISCORD_BOT_INSTALLATION_URL=your-bot-install-url

# Feature Flags (optional)
REACT_APP_ENABLE_TREASURE_HUNT=true
```

#### Proxy Configuration

The client is configured to proxy API requests to the server (see `package.json`):

```json
"proxy": "http://localhost:5000"
```

### Discord Bot

**Location**: `/bot`

An optional Discord bot that allows teams to interact with Gielinor Rush events directly from Discord.

#### Key Features

- Submit objective completions via Discord
- Check team progress and available nodes
- View leaderboard
- Use buffs and strategic items

#### Environment Variables

Create a `.env` file in the `/bot` directory:

```env
# Discord Configuration
DISCORD_BOT_TOKEN=your-discord-bot-token

# API Configuration
GRAPHQL_ENDPOINT=http://localhost:4000/graphql

# Logging
NODE_ENV=development
```

#### Bot Commands

- `!treasurehunt` or `!th` - View current team status
- `!nodes` - List available and completed nodes
- `!submit <node> <proof_url>` - Submit completion proof
- `!leaderboard` - View event rankings

#### Setup Instructions

1. Create a Discord application at [discord.com/developers](https://discord.com/developers)
2. Add a bot to your application
3. Copy the bot token to your `.env` file
4. Invite the bot to your server with appropriate permissions (Send Messages, Read Messages, Embed Links)
5. Set channel topics to your Event ID for bot functionality

## 🗄️ Database Schema

### Main Tables

- **Users** - User accounts and authentication
- **BingoBoards** - Bingo board configurations
- **BingoTiles** - Individual bingo tiles
- **TreasureEvents** - Gielinor Rush event configuration
- **TreasureTeams** - Teams participating in events
- **TreasureNodes** - Map nodes with objectives
- **TreasureSubmissions** - Proof submissions for completed objectives

### Migrations

Database migrations are located in `/server/migrations/` and managed with Sequelize CLI:

```bash
# Create a new migration
npx sequelize-cli migration:generate --name migration-name

# Run pending migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Reset database
npx sequelize-cli db:migrate:undo:all
```

## 🧪 Development

### Running in Development Mode

1. **Server with auto-reload**:

   ```bash
   cd server
   npm run dev  # Uses nodemon for auto-restart
   ```

2. **Client with hot-reload**:

   ```bash
   cd client
   npm start  # React development server
   ```

3. **Bot with auto-reload**:
   ```bash
   cd bot
   npm run dev  # Uses nodemon
   ```

### Code Structure

```
server/
├── index.js              # Express server entry point
├── db/
│   ├── models/           # Sequelize models
│   ├── migrations/       # Database migrations
│   └── seeders/          # Database seeds
├── graphql/
│   ├── resolvers/        # GraphQL resolvers
│   └── typeDefs.js       # GraphQL schema
└── utils/                # Utility functions

client/
├── src/
│   ├── components/       # Reusable components
│   ├── pages/           # Route pages
│   ├── graphql/         # GraphQL queries/mutations
│   ├── providers/       # Context providers
│   └── utils/           # Helper functions
└── public/              # Static assets

bot/
├── index.js             # Bot entry point
├── commands/            # Command handlers
└── utils/              # Bot utilities
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 💬 Support

For issues, questions, or suggestions:

- Open an issue on GitHub
- Join our Discord server
- Contact the maintainer

## 🔗 Links

- **Production Site**: [osrsbingohub.com](https://www.osrsbingohub.com)
- **Documentation**: Coming soon
- **Discord**: Join our community server

---

Made with ❤️ for the OSRS community
