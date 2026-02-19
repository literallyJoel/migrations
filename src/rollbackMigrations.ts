import path from "path";
import { readdirSync, existsSync } from "fs";
import { log } from "./logger";
import { isBunSqlClient, type MigrationConfig } from "./config";

export async function rollbackMigrations(
  argsOrConfig: { dir?: string } | MigrationConfig,
  configArg?: MigrationConfig,
) {
  const args: { dir?: string } =
    configArg !== undefined ? (argsOrConfig as { dir?: string }) : {};
  const config: MigrationConfig =
    configArg ?? (argsOrConfig as MigrationConfig);

  const sql = config.sql;
  if (!sql) {
    throw new Error("SQL client not configured in migrations.config.ts");
  }

  const dir =
    args.dir ?? config.rollbackDir ?? process.env.ROLLBACK_DIR ?? "./rollbacks";
  const resolvedDir = path.resolve(dir);

  if (!existsSync(resolvedDir)) {
    throw new Error(`Rollback directory does not exist: ${resolvedDir}`);
  }

  const files = readdirSync(resolvedDir)
    .filter((f: string) => f.endsWith(".sql"))
    .sort()
    .reverse();

  if (!files.length) {
    log.info("No rollback files to apply.");
    return;
  }

  const progress = log.progress("Rolling back migrations", files.length);
  try {
    for (const file of files) {
      const fp = path.resolve(resolvedDir, file);
      try {
        if (!isBunSqlClient(sql)) {
          const fs = await import("fs/promises");
          const contents = await fs.readFile(fp, "utf-8");
          await sql.query(contents);
        } else {
          await sql.file(fp);
        }
      } catch (e) {
        throw new Error(`Failed rollback: ${file} — ${e}`);
      }
      progress.tick(file);
    }
    progress.stopSuccess("Rollback complete.");
  } catch (e) {
    progress.stopError("Rollback failed.");
    throw e;
  }
}
