#!/usr/bin/env bash
# Run all Champion Forge dev seeders
# Usage:
#   bash server/scripts/seed-champion-forge-dev.sh        # seed
#   bash server/scripts/seed-champion-forge-dev.sh undo   # undo

set -e

export DATABASE_URL=postgres://lemon@localhost/osrsbingo_local

if [ "$1" = "undo" ]; then
  cd db
  echo "Undoing Champion Forge dev seeders..."
  npx sequelize-cli db:seed:undo --seed 20260309000005-cw-battle-seeder.js
  npx sequelize-cli db:seed:undo --seed 20260309000004-cw-outfitting-seeder.js
  npx sequelize-cli db:seed:undo --seed 20260309000003-cw-gathering-rich-seeder.js
  npx sequelize-cli db:seed:undo --seed 20260309000002-cw-draft-seeder.js
  npx sequelize-cli db:seed:undo --seed 20260309000001-cw-gathering-seeder.js
  npx sequelize-cli db:seed:undo --seed 20260307000100-champion-forge-dev-event.js
  cd ..
else
  cd db
  echo "Seeding Champion Forge dev data..."
  npx sequelize-cli db:seed --seed 20260307000100-champion-forge-dev-event.js  # battle already IN_PROGRESS
  npx sequelize-cli db:seed --seed 20260309000001-cw-gathering-seeder.js        # gathering: basic
  npx sequelize-cli db:seed --seed 20260309000002-cw-draft-seeder.js            # draft: setup checklist
  npx sequelize-cli db:seed --seed 20260309000003-cw-gathering-rich-seeder.js   # gathering: rich (submissions + items)
  npx sequelize-cli db:seed --seed 20260309000004-cw-outfitting-seeder.js       # outfitting: full war chests
  npx sequelize-cli db:seed --seed 20260309000005-cw-battle-seeder.js           # battle: locked loadouts, simulate-ready
  cd ..
fi

echo "Done."
