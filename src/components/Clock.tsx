"use client";

import { useEffect, useMemo, useState } from "react";
import { skyFor } from "@/lib/sky";
import { SANTA_CLARA_TIME_ZONE, hourIn } from "@/lib/time";
import { SegmentedControl } from "./SegmentedControl";

type Zone = "local" | "santa-clara";

const ZONE_OPTIONS = [
  { value: "local", label: "My time" },
  { value: "santa-clara", label: "Santa Clara" },
] as const;

function createFormatters(timeZone: string | undefined) {
  return {
    timeFormat: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone,
    }),
    dateFormat: new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone,
    }),
  };
}

export function Clock() {
  // Start empty so the server and first client render match, then tick after mount.
  const [now, setNow] = useState<Date | null>(null);
  const [zone, setZone] = useState<Zone>("local");

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // `undefined` means the visitor's own time zone.
  const timeZone = zone === "santa-clara" ? SANTA_CLARA_TIME_ZONE : undefined;
  const { timeFormat, dateFormat } = useMemo(() => createFormatters(timeZone), [timeZone]);

  const hour = now ? hourIn(now, timeZone) : undefined;
  useEffect(() => {
    if (hour === undefined) return;
    document.documentElement.dataset.sky = skyFor(hour);
  }, [hour]);

  const parts = now ? timeFormat.formatToParts(now) : [];
  const part = (type: Intl.DateTimeFormatPartTypes, fallback: string) =>
    parts.find((p) => p.type === type)?.value ?? fallback;

  return (
    <section className="clock" aria-label="Current time">
      <time className="clock__time" dateTime={now?.toISOString()}>
        <span>{part("hour", "--")}</span>
        <span className="clock__colon">:</span>
        <span>{part("minute", "--")}</span>
        <span className="clock__seconds">{part("second", "--")}</span>
        <span className="clock__period">{part("dayPeriod", "")}</span>
      </time>
      <p className="clock__date">{now ? dateFormat.format(now) : "\u00A0"}</p>
      <div className="clock__controls">
        <SegmentedControl
          label="Time zone"
          options={ZONE_OPTIONS}
          value={zone}
          onChange={setZone}
        />
      </div>
    </section>
  );
}
