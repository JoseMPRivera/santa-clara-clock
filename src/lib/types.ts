export interface WeatherSnapshot {
  location: string;
  temperatureF: number;
  shortForecast: string;
  windSpeed: string;
  windDirection: string;
  precipitationChance: number | null;
  humidity: number | null;
  isDaytime: boolean;
  /** ISO timestamp of when the National Weather Service generated this forecast. */
  updatedAt: string;
}
