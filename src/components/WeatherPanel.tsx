"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hourLabel } from "@/lib/time";
import type { WeatherSnapshot } from "@/lib/types";
import { formatTemperature, type TemperatureUnit } from "@/lib/units";
import { SegmentedControl } from "./SegmentedControl";

const AUTO_REFRESH_MS = 10 * 60 * 1000;

const UNIT_OPTIONS = [
  { value: "F", label: "°F" },
  { value: "C", label: "°C" },
] as const;

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; data: WeatherSnapshot };

export function WeatherPanel() {
  const [state, setState] = useState<State>({ status: "idle" });
  const [unit, setUnit] = useState<TemperatureUnit>("F");
  const [selected, setSelected] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  // A background refresh keeps the current view on screen and ignores failures.
  const loadWeather = useCallback(async (background = false) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    if (!background) setState({ status: "loading" });

    try {
      const res = await fetch("/api/weather", { signal: controller.signal });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = (await res.json()) as WeatherSnapshot;
      setState({ status: "success", data });
      if (!background) setSelected(0);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (!background) setState({ status: "error" });
    }
  }, []);

  const hasData = state.status === "success";
  useEffect(() => {
    if (!autoRefresh || !hasData) return;
    const id = setInterval(() => {
      if (!document.hidden) void loadWeather(true);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh, hasData, loadWeather]);

  const loading = state.status === "loading";
  const buttonLabel = state.status === "idle" ? "Get weather" : "Refresh weather";

  return (
    <section className="weather" aria-labelledby="weather-heading">
      <h2 id="weather-heading" className="weather__heading">
        Weather in Santa Clara County
      </h2>

      <div className="weather__controls">
        <button type="button" className="button" onClick={() => void loadWeather()} disabled={loading}>
          {loading ? "Checking the forecast…" : buttonLabel}
        </button>
        <SegmentedControl
          label="Temperature unit"
          options={UNIT_OPTIONS}
          value={unit}
          onChange={setUnit}
        />
        <button
          type="button"
          className="toggle"
          aria-pressed={autoRefresh}
          disabled={!hasData}
          onClick={() => setAutoRefresh((on) => !on)}
        >
          Auto-refresh
        </button>
      </div>

      <div className="weather__result" role="status" aria-live="polite">
        {state.status === "error" && (
          <p className="weather__error">
            Couldn’t reach the National Weather Service. Select “Refresh weather” to try again.
          </p>
        )}

        {state.status === "success" && (
          <Conditions data={state.data} unit={unit} selected={selected} />
        )}
      </div>

      {state.status === "success" && (
        <>
          <HourlyStrip data={state.data} unit={unit} selected={selected} onSelect={setSelected} />
          <p className="weather__source">
            Forecast from weather.gov, updated {formatClock(state.data.updatedAt)}.
            {autoRefresh && " Refreshes every 10 minutes."}
          </p>
        </>
      )}
    </section>
  );
}

function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

interface ViewProps {
  data: WeatherSnapshot;
  unit: TemperatureUnit;
  selected: number;
}

function Conditions({ data, unit, selected }: ViewProps) {
  // The list can shrink between refreshes, so keep the index in range.
  const index = Math.min(selected, data.hourly.length - 1);
  const hour = data.hourly[index];
  if (!hour) return null;

  return (
    <>
      <p className="weather__when">{index === 0 ? "Now" : `At ${hourLabel(hour.startTime)}`}</p>
      <p className="weather__temp">{formatTemperature(hour.temperatureF, unit)}</p>
      <p className="weather__summary">{hour.shortForecast}</p>
      <dl className="weather__facts">
        <div>
          <dt>Wind</dt>
          <dd>
            {hour.windSpeed} {hour.windDirection}
          </dd>
        </div>
        {hour.precipitationChance !== null && (
          <div>
            <dt>Chance of rain</dt>
            <dd>{hour.precipitationChance}%</dd>
          </div>
        )}
        {hour.humidity !== null && (
          <div>
            <dt>Humidity</dt>
            <dd>{hour.humidity}%</dd>
          </div>
        )}
      </dl>
    </>
  );
}

function HourlyStrip({
  data,
  unit,
  selected,
  onSelect,
}: ViewProps & { onSelect: (index: number) => void }) {
  const index = Math.min(selected, data.hourly.length - 1);

  return (
    <ul className="hourly" role="list" aria-label="Hourly forecast. Select an hour for details.">
      {data.hourly.map((hour, i) => (
        <li key={hour.startTime}>
          <button
            type="button"
            className="hourly__item"
            aria-pressed={i === index}
            onClick={() => onSelect(i)}
          >
            <span className="hourly__time">{i === 0 ? "Now" : hourLabel(hour.startTime)}</span>
            <span className="hourly__temp">{formatTemperature(hour.temperatureF, unit)}</span>
            {hour.precipitationChance !== null && (
              <span className="hourly__rain">{hour.precipitationChance}%</span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
