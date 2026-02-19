import { afterEach, describe, expect, mock, test } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "fs";
import os from "os";
import path from "path";
import { createMigration } from "../src/createMigration";
import { log } from "../src/logger";

const originalDateNow = Date.now;
const originalLogSuccess = log.success;

function makeTmpDir() {
  return mkdtempSync(path.join(os.tmpdir(), "migrations-create-test-"));
}

afterEach(() => {
  Date.now = originalDateNow;
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

  test("throws when table is missing", async () => {
    const dir = makeTmpDir();
    try {
      await expect(createMigration({ dir })).rejects.toThrow(
        "Please specify a table name with --table=<name>",
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
