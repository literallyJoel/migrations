import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import os from "os";
import path from "path";
import { loadConfig } from "../src/config";

const originalCwd = process.cwd();
const originalEnv = { ...process.env };

function withTempDir() {
  return mkdtempSync(path.join(os.tmpdir(), "migrations-config-test-"));
}

afterEach(() => {
  process.chdir(originalCwd);
  process.env = { ...originalEnv };
});

describe("loadConfig", () => {
  test("loads migrations.config.js when present", async () => {
    const dir = withTempDir();
    try {
      writeFileSync(
        path.join(dir, "migrations.config.js"),
        "export default { migrationsDir: './x', rollbackDir: './y', sql: { ok: true } };"
      );

      process.chdir(dir);
      const config = await loadConfig();

      expect(config.migrationsDir).toBe("./x");
      expect(config.rollbackDir).toBe("./y");
      expect(config.sql.ok).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("returns env/path defaults when config file missing", async () => {
    const dir = withTempDir();
    try {
      process.chdir(dir);
      process.env.MIGRATIONS_DIR = "./env-migrations";
      process.env.ROLLBACK_DIR = "./env-rollbacks";

      const config = await loadConfig();

      expect(config.migrationsDir).toBe("./env-migrations");
      expect(config.rollbackDir).toBe("./env-rollbacks");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
