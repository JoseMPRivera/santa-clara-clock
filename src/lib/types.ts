export interface HourlyForecast {
  /** ISO timestamp for the start of this forecast hour. */
  startTime: string;
  temperatureF: number;
  shortForecast: string;
  windSpeed: string;
  windDirection: string;
  precipitationChance: number | null;
  humidity: number | null;
}

export interface WeatherSnapshot {
  location: string;
  /** ISO timestamp of when the National Weather Service generated this forecast. */
  updatedAt: string;
  /** Upcoming hours, soonest first. The first entry stands in for current conditions. */
  hourly: HourlyForecast[];
}
