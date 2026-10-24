export type TemperatureUnit = "F" | "C";

/** Formats a Fahrenheit reading in the requested unit, e.g. `64°F` or `18°C`. */
export function formatTemperature(fahrenheit: number, unit: TemperatureUnit): string {
  const value = unit === "F" ? fahrenheit : Math.round(((fahrenheit - 32) * 5) / 9);
  return `${value}°${unit}`;
}
