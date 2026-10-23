"use client";

import { useEffect, useState } from "react";
import { skyFor } from "@/lib/sky";

const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
});

const dateFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export function Clock() {
  // Start empty so the server and first client render match, then tick after mount.
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hour = now?.getHours();
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
    </section>
  );
}
