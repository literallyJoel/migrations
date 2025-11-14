import path from "path";
import { readdirSync } from "fs";
import { log } from "./logger";
import type { MigrationConfig } from "./config";

export async function rollbackMigrations(config: MigrationConfig) {
  const sql = config.sql;
  if (!sql) {
    log.error("SQL client not configured in migrations.config.ts");
    process.exit(1);
  }

  const dir = config.rollbackDir ?? "./rollbacks";
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().reverse();

  if (!files.length) {
    log.info("No rollback files to apply.");
    return;
  }

  for (const file of files) {
    const fp = path.resolve(dir, file);
    const fs = await import("fs/promises");
    const contents = await fs.readFile(fp, "utf-8");
    try {
      await sql.query ? sql.query(contents) : sql.file(fp);
      log.success(`Rolled back: ${file}`);
    } catch (e) {
      log.error(`Failed rollback: ${file} — ${e}`);
      process.exit(1);
    }
  }
}