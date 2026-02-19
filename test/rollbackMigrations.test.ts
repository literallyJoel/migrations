import { afterEach, describe, expect, mock, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { rollbackMigrations } from "../src/rollbackMigrations";
import { log } from "../src/logger";

const originalExit = process.exit;
const originalLog = {
  info: log.info,
  success: log.success,
  error: log.error,
};

function makeTmpDir() {
  return mkdtempSync(path.join(os.tmpdir(), "migrations-rollback-test-"));
}

afterEach(() => {
  process.exit = originalExit;
  log.info = originalLog.info;
  log.success = originalLog.success;
  log.error = originalLog.error;
});

describe("rollbackMigrations", () => {
  test("runs rollback files in reverse order with sql.query client", async () => {
    const dir = makeTmpDir();
    try {
      writeFileSync(path.join(dir, "001_users.sql"), "DROP TABLE users;");
      writeFileSync(path.join(dir, "002_posts.sql"), "DROP TABLE posts;");

      const order: string[] = [];
      const sql = {
        query: async (contents: string) => {
          order.push(contents.trim());
        },
      };

      await rollbackMigrations({ dir }, { sql } as any);

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

      await rollbackMigrations({
        rollbackDir: dir,
        sql: { file: fileSpy },
      } as any);

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

      await rollbackMigrations({ dir }, {
        sql: { query: async () => {} },
      } as any);

      expect(info).toHaveBeenCalledWith("No rollback files to apply.");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("logs and exits when sql client missing", async () => {
    const error = mock(() => {});
    log.error = error;
    process.exit = ((code?: number) => {
      throw new Error(`EXIT:${code}`);
    }) as typeof process.exit;

    await expect(rollbackMigrations({} as any)).rejects.toThrow("EXIT:1");
    expect(error).toHaveBeenCalledTimes(1);
  });

  test("logs and exits if rollback query fails", async () => {
    const dir = makeTmpDir();
    try {
      writeFileSync(path.join(dir, "001_users.sql"), "DROP TABLE users;");
      const error = mock(() => {});
      log.error = error;

      process.exit = ((code?: number) => {
        throw new Error(`EXIT:${code}`);
      }) as typeof process.exit;

      await expect(
        rollbackMigrations({ dir }, {
          sql: {
            query: () => {
              throw new Error("boom");
            },
          },
        } as any),
      ).rejects.toThrow("EXIT:1");

      expect(error).toHaveBeenCalledTimes(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
