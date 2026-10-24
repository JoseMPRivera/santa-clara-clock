import { afterEach, describe, expect, it, vi } from "vitest";

// "server-only" throws when imported outside a React Server Components build.
vi.mock("server-only", () => ({}));

import { getWeather } from "./nws";

const pointsBody = {
  properties: {
    forecastHourly: "https://api.weather.gov/gridpoints/MTR/94,86/forecast/hourly",
  },
};

const basePeriod = {
  startTime: "2026-10-22T13:00:00-07:00",
  temperature: 64,
  temperatureUnit: "F",
  shortForecast: "Mostly Sunny",
  windSpeed: "5 mph",
  windDirection: "NW",
  probabilityOfPrecipitation: { value: 10 },
  relativeHumidity: { value: 55 },
};

function hourlyBody(periods: unknown[] = [basePeriod]) {
  return { properties: { generatedAt: "2026-10-22T20:00:00+00:00", periods } };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockFetchSequence(...responses: Response[]) {
  const fetchMock = vi.fn();
  for (const response of responses) fetchMock.mockResolvedValueOnce(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getWeather", () => {
  it("maps hourly forecast periods to a snapshot", async () => {
    mockFetchSequence(jsonResponse(pointsBody), jsonResponse(hourlyBody()));

    await expect(getWeather()).resolves.toEqual({
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
    });
  });

  it("returns at most 12 hours, soonest first", async () => {
    const periods = Array.from({ length: 24 }, (_, hour) => ({
      ...basePeriod,
      startTime: `2026-10-22T${String(hour).padStart(2, "0")}:00:00-07:00`,
      temperature: 50 + hour,
    }));
    mockFetchSequence(jsonResponse(pointsBody), jsonResponse(hourlyBody(periods)));

    const weather = await getWeather();

    expect(weather.hourly).toHaveLength(12);
    expect(weather.hourly[0]?.startTime).toBe("2026-10-22T00:00:00-07:00");
    expect(weather.hourly[11]?.temperatureF).toBe(61);
  });

  it("converts Celsius temperatures to Fahrenheit", async () => {
    const celsiusPeriod = { ...basePeriod, temperature: 20, temperatureUnit: "C" };
    mockFetchSequence(jsonResponse(pointsBody), jsonResponse(hourlyBody([celsiusPeriod])));

    const weather = await getWeather();

    expect(weather.hourly[0]?.temperatureF).toBe(68);
  });

  it("returns null for missing precipitation and humidity values", async () => {
    const sparsePeriod = {
      ...basePeriod,
      probabilityOfPrecipitation: { value: null },
      relativeHumidity: undefined,
    };
    mockFetchSequence(jsonResponse(pointsBody), jsonResponse(hourlyBody([sparsePeriod])));

    const weather = await getWeather();

    expect(weather.hourly[0]?.precipitationChance).toBeNull();
    expect(weather.hourly[0]?.humidity).toBeNull();
  });

  it("retries once after a transient server error", async () => {
    const fetchMock = mockFetchSequence(
      jsonResponse({}, 500),
      jsonResponse(pointsBody),
      jsonResponse(hourlyBody()),
    );

    await expect(getWeather()).resolves.toMatchObject({ hourly: [{ temperatureF: 64 }] });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("gives up after two failed attempts", async () => {
    const fetchMock = mockFetchSequence(jsonResponse({}, 500), jsonResponse({}, 500));

    await expect(getWeather()).rejects.toThrow("status 500");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refuses a forecast URL that is not on api.weather.gov", async () => {
    const badPoints = { properties: { forecastHourly: "https://example.com/forecast" } };
    mockFetchSequence(jsonResponse(badPoints));

    await expect(getWeather()).rejects.toThrow("Unexpected forecast URL");
  });

  it("throws when the forecast has no periods", async () => {
    mockFetchSequence(jsonResponse(pointsBody), jsonResponse(hourlyBody([])));

    await expect(getWeather()).rejects.toThrow("no forecast periods");
  });
});
