import "server-only";
import type { HourlyForecast, WeatherSnapshot } from "./types";

const NWS_BASE = "https://api.weather.gov";

// How many upcoming hours the API returns, starting with the current one.
const HOURS_TO_SHOW = 12;

// San Jose is the Santa Clara County seat; the NWS API looks up forecasts by point.
const LOCATION = { label: "Santa Clara County", lat: 37.3382, lon: -121.8863 } as const;

const USER_AGENT =
  process.env.NWS_USER_AGENT ?? "santa-clara-clock (set NWS_USER_AGENT in .env.local)";

interface PointsResponse {
  properties: { forecastHourly: string };
}

interface HourlyPeriod {
  startTime: string;
  temperature: number;
  temperatureUnit: "F" | "C";
  shortForecast: string;
  windSpeed: string;
  windDirection: string;
  probabilityOfPrecipitation?: { value: number | null };
  relativeHumidity?: { value: number | null };
}

interface HourlyResponse {
  properties: { generatedAt: string; periods: HourlyPeriod[] };
}

async function nwsFetch<T>(url: string, revalidateSeconds: number): Promise<T> {
  let lastError: unknown;

  // api.weather.gov occasionally returns a transient 5xx, so try twice.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/geo+json", "User-Agent": USER_AGENT },
        next: { revalidate: revalidateSeconds },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`NWS request failed with status ${res.status}`);
      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function toHourlyForecast(period: HourlyPeriod): HourlyForecast {
  const temperatureF =
    period.temperatureUnit === "C"
      ? Math.round((period.temperature * 9) / 5 + 32)
      : period.temperature;

  return {
    startTime: period.startTime,
    temperatureF,
    shortForecast: period.shortForecast,
    windSpeed: period.windSpeed,
    windDirection: period.windDirection,
    precipitationChance: period.probabilityOfPrecipitation?.value ?? null,
    humidity: period.relativeHumidity?.value ?? null,
  };
}

export async function getWeather(): Promise<WeatherSnapshot> {
  // The grid point for a location almost never changes, so cache it for a day.
  const point = await nwsFetch<PointsResponse>(
    `${NWS_BASE}/points/${LOCATION.lat},${LOCATION.lon}`,
    86_400,
  );

  const hourlyUrl = point.properties.forecastHourly;
  if (!hourlyUrl.startsWith(`${NWS_BASE}/`)) {
    throw new Error("Unexpected forecast URL returned by NWS");
  }

  // Forecasts refresh roughly hourly; cache for 10 minutes.
  const hourly = await nwsFetch<HourlyResponse>(hourlyUrl, 600);
  const periods = hourly.properties.periods.slice(0, HOURS_TO_SHOW);
  if (periods.length === 0) throw new Error("NWS returned no forecast periods");

  return {
    location: LOCATION.label,
    updatedAt: hourly.properties.generatedAt,
    hourly: periods.map(toHourlyForecast),
  };
}
