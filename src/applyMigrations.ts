import path from "path";
import type { MigrationConfig } from "./config.js";
import { log } from "./logger.js";
import { readdirSync, existsSync } from "fs";

export async function applyMigrations(
  args: { file?: string; dir?: string },
  config: MigrationConfig
) {
  const sql = config.sql;
  if (!sql) {
    log.error(
      "No SQL client found. Please configure one in migrations.config.ts"
    );
    process.exit(1);
  }

  const MIGRATIONS_DIR = args.dir ?? config.migrationsDir ?? "./migrations";

  if (!existsSync(MIGRATIONS_DIR)) {
    log.error(`Migrations directory does not exist: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  await ensureAppliedTable(sql);

  const migrations = args.file
    ? [args.file.endsWith(".sql") ? args.file : `${args.file}.sql`]
    : readdirSync(MIGRATIONS_DIR)
        .filter((f) => f.endsWith(".sql"))
        .sort();

  const applied: string[] = await fetchApplied(sql);

  const pending = migrations.filter((f) => !applied.includes(f));
  if (!pending.length) return log.success("No new migrations to apply.");

  log.info(`Applying ${pending.length} migration(s)...\n`);

  for (const name of pending) {
    await applyOne(sql, MIGRATIONS_DIR, name);
  }

  log.success("All migrations applied!");
}

async function applyOne(sql: any, dir: string, file: string) {
  const full = path.resolve(dir, file);
  try {
    if (sql.file) {
      await sql.begin(async (tx: any) => {
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
    log.success(`Applied: ${file}`);
  } catch (err) {
    if (sql.query) await sql.query("ROLLBACK");
    log.error(`Failed migration ${file}: ${err}`);
    process.exit(1);
  }
}

async function ensureAppliedTable(sql: any) {
  const cmd = `
    CREATE TABLE IF NOT EXISTS applied_migrations (
      filename TEXT PRIMARY KEY,
      date_applied TIMESTAMP DEFAULT NOW()
    );
  `;
  if (sql.file) {
    await sql.unsafe(`${cmd}`);
  } else {
    await sql.query(cmd);
  }
}

async function fetchApplied(sql: any): Promise<string[]> {
  if (sql.file) {
    const res = await sql`SELECT filename FROM applied_migrations`;
    return res.map((r: any) => r.filename);
  } else {
    const { rows } = await sql.query("SELECT filename FROM applied_migrations");
    return rows.map((r: any) => r.filename);
  }
}
