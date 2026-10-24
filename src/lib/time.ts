/** The time zone the weather forecast point (San Jose) is in. */
export const SANTA_CLARA_TIME_ZONE = "America/Los_Angeles";

/** The hour of day (0-23) for a moment in the given time zone, or the visitor's own zone if omitted. */
export function hourIn(date: Date, timeZone?: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone,
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === "hour")?.value ?? "0";
  // Some engines report midnight as "24".
  return Number(hour) % 24;
}

/** A short 12-hour label such as `3 PM` for an ISO timestamp, in the given time zone. */
export function hourLabel(isoTime: string, timeZone: string = SANTA_CLARA_TIME_ZONE): string {
  return (
    new Intl.DateTimeFormat("en-US", { hour: "numeric", timeZone })
      .format(new Date(isoTime))
      // Newer ICU versions put a narrow no-break space before AM/PM.
      .replace(/\s/g, " ")
  );
}
