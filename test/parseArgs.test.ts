import { afterEach, describe, expect, test } from "bun:test";
import parseArgs from "../src/util/parseArgs";

const originalArgv = [...process.argv];

afterEach(() => {
  process.argv = [...originalArgv];
});

describe("parseArgs", () => {
  test("parses command and value flags", () => {
    process.argv = [
      "bun",
      "script",
      "create",
      "--table=users",
      "--dir=./db/migrations",
    ];

    const args = parseArgs<{
      command: string;
      table?: string;
      dir?: string;
    }>();

    expect(args.command).toBe("create");
    expect(args.table).toBe("users");
    expect(args.dir).toBe("./db/migrations");
  });

  test("sets boolean true for non-value flags", () => {
    process.argv = ["bun", "script", "apply", "--dry-run"];

    const args = parseArgs<{ command: string; "dry-run"?: boolean }>();

    expect(args.command).toBe("apply");
    expect(args["dry-run"]).toBe(true);
  });

  test("keeps known value flags undefined when value missing", () => {
    process.argv = ["bun", "script", "create", "--table"];

    const args = parseArgs<{ command: string; table?: string }>();

    expect(args.command).toBe("create");
    expect(args.table).toBeUndefined();
  });

  test("preserves '=' inside value", () => {
    process.argv = ["bun", "script", "apply", "--file=a=b=c.sql"];

    const args = parseArgs<{ command: string; file?: string }>();

    expect(args.command).toBe("apply");
    expect(args.file).toBe("a=b=c.sql");
  });
});
