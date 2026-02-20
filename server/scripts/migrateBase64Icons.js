require('dotenv').config();
const sequelize = require('../db/db');
const { fetchInventoryIcon } = require('../utils/itemsService');

const BATCH_SIZE = 50;
const DELAY_MS = 500;
const DRY_RUN = process.argv.includes('--dry-run');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Try multiple strategies to find a wiki icon for a tile name
 */
async function resolveIcon(tileName) {
  if (!tileName) return null;

  // Strategy 1: exact name
  let url = await fetchInventoryIcon(tileName);
  if (url) return url;

  // Strategy 2: strip parenthetical suffixes
  // "Abyssal whip (or)" → "Abyssal whip"
  const stripped = tileName.replace(/\s*\(.*?\)\s*$/, '').trim();
  if (stripped && stripped !== tileName) {
    url = await fetchInventoryIcon(stripped);
    if (url) return url;
  }

  // Strategy 3: first three words
  // "Giant egg sack noted" → "Giant egg sack"
  const words = tileName.split(' ');
  if (words.length > 3) {
    const firstThree = words.slice(0, 3).join(' ');
    url = await fetchInventoryIcon(firstThree);
    if (url) return url;
  }

  // Strategy 4: first two words
  if (words.length > 2) {
    const firstTwo = words.slice(0, 2).join(' ');
    url = await fetchInventoryIcon(firstTwo);
    if (url) return url;
  }

  return null;
}

async function migrate() {
  console.log(`DB: ${process.env.DATABASE_URL?.substring(0, 40)}`);
  console.log(
    DRY_RUN ? '🔍 DRY RUN MODE — no changes will be saved' : '🚀 LIVE MODE — changes will be saved'
  );

  const [tiles] = await sequelize.query(
    `SELECT id, name FROM "BingoTiles" WHERE icon ILIKE 'data:image%'`
  );

  console.log(`\nFound ${tiles.length} base64 tiles to migrate\n`);

  if (tiles.length === 0) {
    console.log('Nothing to do!');
    process.exit(0);
  }

  // Write backup of IDs (not the base64 blobs — no need to store 29MB locally)
  const fs = require('fs');
  fs.writeFileSync(
    'migration_tile_ids.json',
    JSON.stringify(
      tiles.map((t) => ({ id: t.id, name: t.name })),
      null,
      2
    )
  );
  console.log('📁 Tile IDs backed up to migration_tile_ids.json\n');

  let success = 0,
    nulled = 0,
    errors = 0;
  const nulledTiles = []; // track which ones we couldn't resolve

  for (let i = 0; i < tiles.length; i += BATCH_SIZE) {
    const batch = tiles.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (tile) => {
        try {
          const url = await resolveIcon(tile.name);

          if (!DRY_RUN) {
            await sequelize.query(`UPDATE "BingoTiles" SET icon = :icon WHERE id = :id`, {
              replacements: { icon: url ?? null, id: tile.id },
            });
          }

          if (url) {
            success++;
          } else {
            nulled++;
            nulledTiles.push({ id: tile.id, name: tile.name });
          }
        } catch (err) {
          errors++;
          console.error(`Error processing tile ${tile.id} (${tile.name}):`, err.message);
        }
      })
    );

    const processed = Math.min(i + BATCH_SIZE, tiles.length);
    const pct = Math.round((processed / tiles.length) * 100);
    console.log(
      `[${pct}%] ${processed}/${tiles.length} | ✅ ${success} resolved | ⚠️ ${nulled} nulled | ❌ ${errors} errors`
    );

    await sleep(DELAY_MS);
  }

  // Write out the nulled tiles so you can inspect them
  fs.writeFileSync('migration_nulled.json', JSON.stringify(nulledTiles, null, 2));

  console.log(`\n✅ Done!`);
  console.log(`   Resolved: ${success}`);
  console.log(`   Nulled:   ${nulled} (saved to migration_nulled.json)`);
  console.log(`   Errors:   ${errors}`);

  if (DRY_RUN) {
    console.log('\n⚠️  This was a dry run. Run without --dry-run to apply changes.');
  }

  process.exit(0);
}

migrate().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
