import { afterEach, describe, expect, mock, test } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "fs";
import os from "os";
import path from "path";
import { createMigration } from "../src/createMigration";
import { log } from "../src/logger";

const originalExit = process.exit;
const originalDateNow = Date.now;
const originalLogWarn = log.warn;
const originalLogError = log.error;
const originalLogSuccess = log.success;

function makeTmpDir() {
  return mkdtempSync(path.join(os.tmpdir(), "migrations-create-test-"));
}

afterEach(() => {
  process.exit = originalExit;
  Date.now = originalDateNow;
  log.warn = originalLogWarn;
  log.error = originalLogError;
  log.success = originalLogSuccess;
});

describe("createMigration", () => {
  test("creates timestamped migration file in provided dir", async () => {
    const dir = makeTmpDir();
    try {
      const migrationsDir = path.join(dir, "migrations");
      Date.now = () => 1700000000000;
      const success = mock(() => {});
      log.success = success;

      await createMigration({ table: "users", dir: migrationsDir });

      expect(existsSync(migrationsDir)).toBe(true);
      const files = readdirSync(migrationsDir);
      expect(files).toEqual(["1700000000000_users.sql"]);
      expect(success).toHaveBeenCalledTimes(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("exits when table is missing", async () => {
    const dir = makeTmpDir();
    try {
      const warn = mock(() => {});
      log.warn = warn;

      process.exit = ((code?: number) => {
        throw new Error(`EXIT:${code}`);
      }) as typeof process.exit;

      await expect(createMigration({ dir })).rejects.toThrow("EXIT:1");
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
