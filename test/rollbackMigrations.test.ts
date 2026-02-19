import { afterEach, describe, expect, mock, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { rollbackMigrations } from "../src/rollbackMigrations";
import type {
  BunSqlClient,
  MigrationConfig,
  QuerySqlClient,
} from "../src/config";
import { log } from "../src/logger";

const originalLog = {
  info: log.info,
  success: log.success,
};

function makeTmpDir() {
  return mkdtempSync(path.join(os.tmpdir(), "migrations-rollback-test-"));
}

afterEach(() => {
  log.info = originalLog.info;
  log.success = originalLog.success;
});

describe("rollbackMigrations", () => {
  test("runs rollback files in reverse order with sql.query client", async () => {
    const dir = makeTmpDir();
    try {
      writeFileSync(path.join(dir, "001_users.sql"), "DROP TABLE users;");
      writeFileSync(path.join(dir, "002_posts.sql"), "DROP TABLE posts;");

      const order: string[] = [];
      const sql: QuerySqlClient = {
        query: async (contents: string) => {
          order.push(contents.trim());
          return { rows: [] };
        },
      };

      await rollbackMigrations({ dir }, { sql });

      expect(order).toEqual(["DROP TABLE posts;", "DROP TABLE users;"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("supports config-only signature", async () => {
    const dir = makeTmpDir();
    try {
      writeFileSync(path.join(dir, "001_users.sql"), "DROP TABLE users;");
      const fileSpy = mock(async (_filePath: string) => {});
      const sql = ((_: TemplateStringsArray, ..._values: unknown[]) =>
        Promise.resolve([])) as BunSqlClient;
      sql.begin = async () => undefined;
      sql.file = fileSpy;
      sql.unsafe = async () => undefined;

      await rollbackMigrations({ rollbackDir: dir, sql });

      expect(fileSpy).toHaveBeenCalledTimes(1);
      const firstArg = fileSpy.mock.calls[0]?.[0];
      if (!firstArg) throw new Error("Expected file path argument");
      expect(firstArg.endsWith("001_users.sql")).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("logs info when rollback dir has no sql files", async () => {
    const dir = makeTmpDir();
    try {
      const info = mock(() => {});
      log.info = info;
      const sql: QuerySqlClient = {
        query: async () => ({ rows: [] }),
      };

      await rollbackMigrations({ dir }, { sql });

      expect(info).toHaveBeenCalledWith("No rollback files to apply.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("throws when sql client missing", async () => {
    const config: MigrationConfig = {};
    await expect(rollbackMigrations(config)).rejects.toThrow(
      "SQL client not configured in migrations.config.ts",
    );
  });

  test("throws if rollback query fails", async () => {
    const dir = makeTmpDir();
    try {
      writeFileSync(path.join(dir, "001_users.sql"), "DROP TABLE users;");

      const sql: QuerySqlClient = {
        query: () => {
          throw new Error("boom");
        },
      };
      await expect(rollbackMigrations({ dir }, { sql })).rejects.toThrow(
        "Failed rollback: 001_users.sql",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
