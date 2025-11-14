import path from "path";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { migrationsDir } from "./migrationsDir";
import type { MigrationConfig } from "./config";
import { log } from "./logger";

export async function createMigration(
  args: { table?: string; dir?: string },
  config?: MigrationConfig
) {
  const MIGRATIONS_DIR = migrationsDir(args, config);

  if (!existsSync(MIGRATIONS_DIR))
    mkdirSync(MIGRATIONS_DIR, { recursive: true });

  if (!args.table) {
    log.warn("Please specify a table name with --table=<name>");
    process.exit(1);
  }

  const filename = `${Date.now()}_${args.table}.sql`;
  const filepath = path.resolve(MIGRATIONS_DIR, filename);

  try {
    writeFileSync(filepath, "");
    log.success(`Created migration: ${filepath}`);
  } catch (e) {
    log.error("Failed to create migration file: " + e);
  }
}
