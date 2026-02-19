import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { log } from "../src/logger";

afterEach(() => {
  mock.restore();
});

describe("logger", () => {
  test("prints prefixed success message", () => {
    const spy = spyOn(console, "log").mockImplementation(() => {});

    log.success("done");

    expect(spy).toHaveBeenCalledTimes(1);
    const callArg = spy.mock.calls[0]?.[0] as string;
    expect(callArg).toContain("done");
    expect(callArg).toContain("✅");
  });

  test("prints prefixed error and warn messages", () => {
    const spy = spyOn(console, "log").mockImplementation(() => {});

    log.error("bad");
    log.warn("careful");

    expect(spy).toHaveBeenCalledTimes(2);
    expect((spy.mock.calls[0]?.[0] as string).includes("❌")).toBe(true);
    expect((spy.mock.calls[1]?.[0] as string).includes("⚠️")).toBe(true);
  });
});
