import path from "path";
import {
  isBunSqlClient,
  type MigrationConfig,
  type SQLClient,
  type QueryResultRow,
} from "./config";
import { log } from "./logger";
import { migrationsDir } from "./migrationsDir";
import { readdirSync, existsSync } from "fs";

export async function applyMigrations(
  args: { file?: string; dir?: string },
  config: MigrationConfig,
) {
  const sql = config.sql;
  if (!sql) {
    throw new Error(
      "No SQL client found. Please configure one in migrations.config.ts",
    );
  }

  const MIGRATIONS_DIR = migrationsDir(args, config);

  if (!existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory does not exist: ${MIGRATIONS_DIR}`);
  }

  await ensureAppliedTable(sql);

  const migrations = args.file
    ? [args.file.endsWith(".sql") ? args.file : `${args.file}.sql`]
    : readdirSync(MIGRATIONS_DIR)
        .filter((f: string) => f.endsWith(".sql"))
        .sort();

  const applied: string[] = await fetchApplied(sql);

  const pending = migrations.filter((f: string) => !applied.includes(f));
  if (!pending.length) return log.success("No new migrations to apply.");

  const progress = log.progress("Applying migrations", pending.length);

  try {
    for (const name of pending) {
      await applyOne(sql, MIGRATIONS_DIR, name);
      progress.tick(name);
    }
    progress.stopSuccess("All migrations applied!");
  } catch (err) {
    progress.stopError("Migration run failed.");
    throw err;
  }
}

async function applyOne(sql: SQLClient, dir: string, file: string) {
  const full = path.resolve(dir, file);
  try {
    if (isBunSqlClient(sql)) {
      await sql.begin(async (tx) => {
        await tx.file(full);
        await tx`INSERT INTO applied_migrations (filename) VALUES (${file});`;
      });
    } else {
      const fs = await import("fs/promises");
      const contents = await fs.readFile(full, "utf-8");
      await sql.query("BEGIN");
      await sql.query(contents);
      await sql.query("INSERT INTO applied_migrations(filename) VALUES($1)", [
        file,
      ]);
      await sql.query("COMMIT");
    }
  } catch (err) {
    if (!isBunSqlClient(sql)) await sql.query("ROLLBACK");
    throw new Error(`Failed migration ${file}: ${err}`);
  }
}

async function ensureAppliedTable(sql: SQLClient) {
  const cmd = `
    CREATE TABLE IF NOT EXISTS applied_migrations (
      filename TEXT PRIMARY KEY,
      date_applied TIMESTAMP DEFAULT NOW()
    );
  `;
  if (isBunSqlClient(sql)) {
    await sql.unsafe(`${cmd}`);
  } else {
    await sql.query(cmd);
  }
}

async function fetchApplied(sql: SQLClient): Promise<string[]> {
  if (isBunSqlClient(sql)) {
    const res = await sql`SELECT filename FROM applied_migrations`;
    return res
      .map((r: QueryResultRow) => r.filename)
      .filter((v): v is string => typeof v === "string");
  } else {
    const { rows } = await sql.query("SELECT filename FROM applied_migrations");
    return rows
      .map((r: QueryResultRow) => r.filename)
      .filter((v): v is string => typeof v === "string");
  }
}
