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
  npx sequelize-cli db:seed:undo --seed 20260309000002-cw-draft-seeder.js
  npx sequelize-cli db:seed:undo --seed 20260309000001-cw-gathering-seeder.js
  npx sequelize-cli db:seed:undo --seed 20260307000100-champion-forge-dev-event.js
  cd ..
else
  cd db
  echo "Seeding Champion Forge dev data..."
  npx sequelize-cli db:seed --seed 20260307000100-champion-forge-dev-event.js
  npx sequelize-cli db:seed --seed 20260309000001-cw-gathering-seeder.js
  npx sequelize-cli db:seed --seed 20260309000002-cw-draft-seeder.js
  cd ..
fi

echo "Done."
