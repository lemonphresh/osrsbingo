'use strict';

/**
 * Dev seeder: Champion Forge "Dev Showdown"
 *
 * Delegates to server/utils/cwDevSeed.js — edit data there.
 *
 * To run:  npx sequelize-cli db:seed --seed 20260307000100-champion-forge-dev-event.js
 * To undo: npx sequelize-cli db:seed:undo --seed 20260307000100-champion-forge-dev-event.js
 */

const { seedDevCfEvent, tearDownDevCfEvent, EVENT_ID } = require('../../utils/cwDevSeed');

module.exports = {
  async up() {
    await seedDevCfEvent('1');
    console.log('✅ Champion Forge dev seeder complete!');
    console.log(`   Visit: /champion-forge/${EVENT_ID}`);
  },

  async down() {
    await tearDownDevCfEvent();
    console.log('✅ Champion Forge dev seeder rolled back.');
  },
};
