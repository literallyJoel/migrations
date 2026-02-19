import { afterEach, describe, expect, mock, test } from "bun:test";
import { log } from "../src/logger";

const originalConsoleLog = console.log;

afterEach(() => {
  console.log = originalConsoleLog;
});

describe("logger", () => {
  test("prints prefixed success message", () => {
    const spy = mock(() => {});
    console.log = spy as unknown as typeof console.log;

    log.success("done");

    expect(spy).toHaveBeenCalledTimes(1);
    const callArg = spy.mock.calls[0]?.[0] as string;
    expect(callArg).toContain("done");
    expect(callArg).toContain("✅");
  });

  test("prints prefixed error and warn messages", () => {
    const spy = mock(() => {});
    console.log = spy as unknown as typeof console.log;

    log.error("bad");
    log.warn("careful");

    expect(spy).toHaveBeenCalledTimes(2);
    expect((spy.mock.calls[0]?.[0] as string).includes("❌")).toBe(true);
    expect((spy.mock.calls[1]?.[0] as string).includes("⚠️")).toBe(true);
  });
});
