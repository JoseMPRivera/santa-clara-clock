import "server-only";
import type { WeatherSnapshot } from "./types";

const NWS_BASE = "https://api.weather.gov";

// San Jose is the Santa Clara County seat; the NWS API looks up forecasts by point.
const LOCATION = { label: "Santa Clara County", lat: 37.3382, lon: -121.8863 } as const;

const USER_AGENT =
  process.env.NWS_USER_AGENT ?? "santa-clara-clock (set NWS_USER_AGENT in .env.local)";

interface PointsResponse {
  properties: { forecastHourly: string };
}

interface HourlyPeriod {
  temperature: number;
  temperatureUnit: "F" | "C";
  shortForecast: string;
  windSpeed: string;
  windDirection: string;
  isDaytime: boolean;
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
  const period = hourly.properties.periods[0];
  if (!period) throw new Error("NWS returned no forecast periods");

  const temperatureF =
    period.temperatureUnit === "C"
      ? Math.round((period.temperature * 9) / 5 + 32)
      : period.temperature;

  return {
    location: LOCATION.label,
    temperatureF,
    shortForecast: period.shortForecast,
    windSpeed: period.windSpeed,
    windDirection: period.windDirection,
    precipitationChance: period.probabilityOfPrecipitation?.value ?? null,
    humidity: period.relativeHumidity?.value ?? null,
    isDaytime: period.isDaytime,
    updatedAt: hourly.properties.generatedAt,
  };
}
