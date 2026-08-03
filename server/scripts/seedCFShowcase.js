'use strict';

/**
 * Seeds the three completed Champion Forge showcase events into any environment.
 * Safe to run multiple times — each seeder skips if the event already exists.
 *
 * Local:
 *   DATABASE_URL=postgres://lemon@localhost/osrsbingo_local node server/scripts/seedCFShowcase.js
 *
 * Production (Heroku):
 *   heroku run node server/scripts/seedCFShowcase.js --app osrsbingo
 */

require('dotenv').config();

// Touch models so Sequelize initialises the connection before seeders run
require('../db/models');

const SEEDERS = [
  '../db/seeders/20260318000006-cw-completed-se-seeder',    // The Irongate Invitational (4 teams, SE)
  '../db/seeders/20260318000007-cw-completed-de-seeder',    // The Grand Forge Championship (8 teams, DE)
  '../db/seeders/20260318000008-cw-showcase-battle-seeder', // The Grand Showcase (all animation types)
];

async function main() {
  for (const seederPath of SEEDERS) {
    const seeder = require(seederPath);
    await seeder.up(null);
  }
  console.log('\n✅ All CF showcase events seeded.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
