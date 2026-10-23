export type Sky = "dawn" | "day" | "dusk" | "night";

/** Maps an hour of the day (0-23) to the page's sky theme. */
export function skyFor(hour: number): Sky {
  if (hour >= 5 && hour < 8) return "dawn";
  if (hour >= 8 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "dusk";
  return "night";
}
