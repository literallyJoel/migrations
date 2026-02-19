import path from "path";
import { readdirSync, existsSync } from "fs";
import { log } from "./logger";
import type { MigrationConfig } from "./config";

export async function rollbackMigrations(
  argsOrConfig: { dir?: string } | MigrationConfig,
  configArg?: MigrationConfig
) {
  const args: { dir?: string } =
    configArg !== undefined ? (argsOrConfig as { dir?: string }) : {};
  const config: MigrationConfig =
    configArg ?? (argsOrConfig as MigrationConfig);

  const sql = config.sql;
  if (!sql) {
    log.error("SQL client not configured in migrations.config.ts");
    process.exit(1);
  }

  const dir =
    args.dir ?? config.rollbackDir ?? process.env.ROLLBACK_DIR ?? "./rollbacks";
  const resolvedDir = path.resolve(dir);

  if (!existsSync(resolvedDir)) {
    log.error(`Rollback directory does not exist: ${resolvedDir}`);
    process.exit(1);
  }

  const files = readdirSync(resolvedDir)
    .filter((f: string) => f.endsWith(".sql"))
    .sort()
    .reverse();

  if (!files.length) {
    log.info("No rollback files to apply.");
    return;
  }

  for (const file of files) {
    const fp = path.resolve(resolvedDir, file);
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