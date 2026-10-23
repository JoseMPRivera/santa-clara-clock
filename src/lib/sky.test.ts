import { describe, expect, it } from "vitest";
import { skyFor } from "./sky";

describe("skyFor", () => {
  it.each([
    [0, "night"],
    [4, "night"],
    [5, "dawn"],
    [7, "dawn"],
    [8, "day"],
    [16, "day"],
    [17, "dusk"],
    [19, "dusk"],
    [20, "night"],
    [23, "night"],
  ])("maps hour %i to %s", (hour, expected) => {
    expect(skyFor(hour)).toBe(expected);
  });
});
