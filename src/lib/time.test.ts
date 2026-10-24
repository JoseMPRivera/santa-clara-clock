import { describe, expect, it } from "vitest";
import { hourIn, hourLabel } from "./time";

describe("hourIn", () => {
  const moment = new Date("2026-10-22T20:00:00Z");

  it("reads the hour in the requested time zone", () => {
    expect(hourIn(moment, "America/Los_Angeles")).toBe(13);
    expect(hourIn(moment, "UTC")).toBe(20);
  });

  it("reports midnight as 0", () => {
    expect(hourIn(new Date("2026-10-23T00:00:00Z"), "UTC")).toBe(0);
  });
});

describe("hourLabel", () => {
  it("formats a 12-hour label in Pacific time by default", () => {
    expect(hourLabel("2026-10-22T13:00:00-07:00")).toBe("1 PM");
    expect(hourLabel("2026-10-22T00:00:00-07:00")).toBe("12 AM");
  });

  it("honors an explicit time zone", () => {
    expect(hourLabel("2026-10-22T13:00:00-07:00", "UTC")).toBe("8 PM");
  });
});
