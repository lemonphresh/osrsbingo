'use strict';

module.exports = {
  async up(queryInterface) {
    // Add SETUP value — Postgres doesn't support removing enum values, so we replace PAUSED with SETUP
    // by renaming the type and recreating it with the correct values.
    await queryInterface.sequelize.transaction(async (t) => {
      // 1. Rename old type out of the way
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_RainbowEvents_status" RENAME TO "enum_RainbowEvents_status_old";`,
        { transaction: t },
      );
      // 2. Create new type with correct values
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_RainbowEvents_status" AS ENUM ('SETUP', 'ACTIVE', 'COMPLETE');`,
        { transaction: t },
      );
      // 3. Migrate the column — map PAUSED → SETUP (shouldn't exist in prod yet, but be safe)
      await queryInterface.sequelize.query(
        `ALTER TABLE "RainbowEvents"
           ALTER COLUMN status DROP DEFAULT,
           ALTER COLUMN status TYPE "enum_RainbowEvents_status"
             USING CASE status::text
               WHEN 'PAUSED' THEN 'SETUP'::"enum_RainbowEvents_status"
               ELSE status::text::"enum_RainbowEvents_status"
             END,
           ALTER COLUMN status SET DEFAULT 'SETUP';`,
        { transaction: t },
      );
      // 4. Drop old type
      await queryInterface.sequelize.query(
        `DROP TYPE "enum_RainbowEvents_status_old";`,
        { transaction: t },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (t) => {
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_RainbowEvents_status" RENAME TO "enum_RainbowEvents_status_old";`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_RainbowEvents_status" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETE');`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        `ALTER TABLE "RainbowEvents"
           ALTER COLUMN status DROP DEFAULT,
           ALTER COLUMN status TYPE "enum_RainbowEvents_status"
             USING CASE status::text
               WHEN 'SETUP' THEN 'ACTIVE'::"enum_RainbowEvents_status"
               ELSE status::text::"enum_RainbowEvents_status"
             END,
           ALTER COLUMN status SET DEFAULT 'ACTIVE';`,
        { transaction: t },
      );
      await queryInterface.sequelize.query(
        `DROP TYPE "enum_RainbowEvents_status_old";`,
        { transaction: t },
      );
    });
  },
};
