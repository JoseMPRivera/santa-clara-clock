import { afterEach, describe, expect, it, vi } from "vitest";
import type { WeatherSnapshot } from "@/lib/types";

const { getWeather } = vi.hoisted(() => ({ getWeather: vi.fn() }));

// Mocking the whole module also keeps "server-only" out of the test run.
vi.mock("@/lib/nws", () => ({ getWeather }));

import { GET } from "./route";

const snapshot: WeatherSnapshot = {
  location: "Santa Clara County",
  updatedAt: "2026-10-22T20:00:00+00:00",
  hourly: [
    {
      startTime: "2026-10-22T13:00:00-07:00",
      temperatureF: 64,
      shortForecast: "Mostly Sunny",
      windSpeed: "5 mph",
      windDirection: "NW",
      precipitationChance: 10,
      humidity: 55,
    },
  ],
};

afterEach(() => {
  vi.restoreAllMocks();
  getWeather.mockReset();
});

describe("GET /api/weather", () => {
  it("returns the snapshot as JSON with a cache header", async () => {
    getWeather.mockResolvedValueOnce(snapshot);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage");
    await expect(res.json()).resolves.toEqual(snapshot);
  });

  it("returns a 502 and does not cache it when the lookup fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getWeather.mockRejectedValueOnce(new Error("NWS down"));

    const res = await GET();

    expect(res.status).toBe(502);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    await expect(res.json()).resolves.toEqual({ error: "Weather service unavailable" });
  });
});
