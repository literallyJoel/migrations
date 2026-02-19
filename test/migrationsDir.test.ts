import { afterEach, describe, expect, test } from "bun:test";
import path from "path";
import { migrationsDir } from "../src/migrationsDir";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("migrationsDir", () => {
  test("prefers args.dir", () => {
    const dir = migrationsDir(
      { dir: "./from-args" },
      { migrationsDir: "./from-config" },
    );

    expect(dir).toBe("./from-args");
  });

  test("uses config migrationsDir when args.dir missing", () => {
    const dir = migrationsDir({}, { migrationsDir: "./from-config" });

    expect(dir).toBe("./from-config");
  });

  test("uses MIGRATIONS_DIR env when args and config missing", () => {
    process.env.MIGRATIONS_DIR = "./from-env";

    const dir = migrationsDir({}, undefined);

    expect(dir).toBe("./from-env");
  });

  test("falls back to default relative dist path", () => {
    delete process.env.MIGRATIONS_DIR;

    const dir = migrationsDir({}, undefined);

    expect(path.isAbsolute(dir)).toBe(true);
    expect(dir.endsWith(path.join("migrations"))).toBe(true);
  });
});
