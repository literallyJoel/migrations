import { afterEach, describe, expect, mock, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { applyMigrations } from "../src/applyMigrations";
import type {
  BunSqlClient,
  BunSqlTx,
  MigrationConfig,
  QuerySqlClient,
} from "../src/config";
import { log } from "../src/logger";

const originalLog = {
  info: log.info,
  success: log.success,
};

function makeTmpDir() {
  return mkdtempSync(path.join(os.tmpdir(), "migrations-apply-test-"));
}

afterEach(() => {
  log.info = originalLog.info;
  log.success = originalLog.success;
});

describe("applyMigrations", () => {
  test("applies pending migrations with node-style sql.query client", async () => {
    const dir = makeTmpDir();
    try {
      writeFileSync(
        path.join(dir, "001_users.sql"),
        "CREATE TABLE users(id int);",
      );
      writeFileSync(
        path.join(dir, "002_posts.sql"),
        "CREATE TABLE posts(id int);",
      );

      const calls: Array<{ sql: string; params?: unknown[] }> = [];
      const sql: QuerySqlClient = {
        query: mock(async (query: string, params?: unknown[]) => {
          calls.push({ sql: query, params });
          if (query.includes("SELECT filename FROM applied_migrations")) {
            return { rows: [{ filename: "001_users.sql" }] };
          }
          return { rows: [] };
        }),
      };

      const success = mock(() => {});
      log.success = success;

      await applyMigrations({ dir }, { sql });

      const ranMigration = calls.some((c) =>
        c.sql.includes("CREATE TABLE posts(id int);"),
      );
      const inserted = calls.some((c) =>
        c.sql.includes("INSERT INTO applied_migrations(filename)"),
      );

      expect(ranMigration).toBe(true);
      expect(inserted).toBe(true);
      expect(success).toHaveBeenCalled();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("applies specific file using bun-style sql.file client", async () => {
    const dir = makeTmpDir();
    try {
      writeFileSync(path.join(dir, "one.sql"), "SELECT 1;");

      const txCalls: string[] = [];
      const insertSpy = mock(async () => [] as Array<{ filename: string }>);
      const selectSpy = mock(async () => [] as Array<{ filename: string }>);

      const wrappedTag = (
        chunks: TemplateStringsArray,
        ..._vals: unknown[]
      ) => {
        const text = chunks.join("$");
        if (text.includes("SELECT filename FROM applied_migrations")) {
          return selectSpy();
        }
        if (text.includes("INSERT INTO applied_migrations")) {
          return insertSpy();
        }
        return Promise.resolve([]);
      };

      const wrapped = wrappedTag as BunSqlClient;
      wrapped.begin = async (fn: (tx: BunSqlTx) => Promise<void>) => {
        const txTag = (chunks: TemplateStringsArray, ..._vals: unknown[]) => {
          const text = chunks.join("$");
          if (text.includes("INSERT INTO applied_migrations")) {
            return insertSpy();
          }
          return Promise.resolve([]);
        };
        const tx = txTag as BunSqlTx;
        tx.file = async (fp: string) => {
          txCalls.push(`file:${fp}`);
          return undefined;
        };
        await fn(tx);
      };
      wrapped.file = async () => undefined;
      wrapped.unsafe = async () => undefined;

      await applyMigrations({ dir, file: "one" }, { sql: wrapped });

      expect(txCalls.length).toBe(1);
      expect(txCalls[0].endsWith(path.join(dir, "one.sql"))).toBe(true);
      expect(insertSpy).toHaveBeenCalledTimes(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("throws if sql client missing", async () => {
    const config: MigrationConfig = {};
    await expect(applyMigrations({}, config)).rejects.toThrow(
      "No SQL client found. Please configure one in migrations.config.ts",
    );
  });

  test("throws if migration directory is missing", async () => {
    const sql: QuerySqlClient = { query: async () => ({ rows: [] }) };
    await expect(
      applyMigrations({ dir: "/tmp/not-here-xyz" }, { sql }),
    ).rejects.toThrow("Migrations directory does not exist");
  });

  test("logs no-op when no pending migrations", async () => {
    const dir = makeTmpDir();
    try {
      writeFileSync(
        path.join(dir, "001_users.sql"),
        "CREATE TABLE users(id int);",
      );
      const success = mock(() => {});
      log.success = success;

      const sql: QuerySqlClient = {
        query: async (query: string) => {
          if (query.includes("SELECT filename")) {
            return { rows: [{ filename: "001_users.sql" }] };
          }
          return { rows: [] };
        },
      };

      await applyMigrations({ dir }, { sql });

      expect(success).toHaveBeenCalledWith("No new migrations to apply.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
