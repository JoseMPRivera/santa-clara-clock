import { describe, expect, it } from "vitest";
import { formatTemperature } from "./units";

describe("formatTemperature", () => {
  it("keeps Fahrenheit readings as they are", () => {
    expect(formatTemperature(64, "F")).toBe("64°F");
  });

  it.each([
    [32, "0°C"],
    [68, "20°C"],
    [70, "21°C"],
    [212, "100°C"],
    [-4, "-20°C"],
  ])("converts %i°F to %s", (fahrenheit, expected) => {
    expect(formatTemperature(fahrenheit, "C")).toBe(expected);
  });
});
