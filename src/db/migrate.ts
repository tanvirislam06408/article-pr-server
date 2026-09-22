import fs from "fs";
import path from "path";
import { pool, query } from "../config/db";
import { hashPassword } from "../utils/password";

export const runMigrations = async (shouldSeed = false) => {
  console.log("🚀 Starting database migration...");
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");

    await query(schemaSql);
    console.log("✅ Database schema initialized successfully.");

    if (shouldSeed) {
      console.log("🌱 Seeding database...");
      const seedPath = path.join(__dirname, "seed.sql");
      const seedSql = fs.readFileSync(seedPath, "utf-8");

      // Hash default admin and author passwords properly
      const adminPassword = process.env.ADMIN_PASSWORD || "tanvir-admin";
      const defaultPasswordHash = await hashPassword(adminPassword);
      const processedSeedSql = seedSql.replace(
        /\$2a\$10\$p3sZl8XQ1V4XFhVomr7\/I\.gU5yM5qKkYkW2J3e4r5t6y7u8i9o0p1/g,
        defaultPasswordHash
      );

      await query(processedSeedSql);
      console.log("✅ Database seeded successfully with initial topics and articles.");
      console.log("👤 Default Admin Initialized");
    }

    console.log("🎉 Migration process completed!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

const isSeedFlag = process.argv.includes("--seed") || process.argv.includes("-s");
if (require.main === module) {
  runMigrations(isSeedFlag || true); // Default to initializing and seeding
}
