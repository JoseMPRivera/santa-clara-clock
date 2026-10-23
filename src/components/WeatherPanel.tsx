"use client";

import { useEffect, useRef, useState } from "react";
import type { WeatherSnapshot } from "@/lib/types";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; data: WeatherSnapshot };

export function WeatherPanel() {
  const [state, setState] = useState<State>({ status: "idle" });
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  async function loadWeather() {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: "loading" });

    try {
      const res = await fetch("/api/weather", { signal: controller.signal });
      if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
      const data = (await res.json()) as WeatherSnapshot;
      setState({ status: "success", data });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setState({ status: "error" });
    }
  }

  const loading = state.status === "loading";
  const buttonLabel = state.status === "idle" ? "Get weather" : "Refresh weather";

  return (
    <section className="weather" aria-labelledby="weather-heading">
      <h2 id="weather-heading" className="weather__heading">
        Weather in Santa Clara County
      </h2>

      <button type="button" className="button" onClick={loadWeather} disabled={loading}>
        {loading ? "Checking the forecast…" : buttonLabel}
      </button>

      <div className="weather__result" role="status" aria-live="polite">
        {state.status === "error" && (
          <p className="weather__error">
            Couldn’t reach the National Weather Service. Select “Refresh weather” to try again.
          </p>
        )}

        {state.status === "success" && <WeatherDetails data={state.data} />}
      </div>
    </section>
  );
}

function WeatherDetails({ data }: { data: WeatherSnapshot }) {
  const updated = new Date(data.updatedAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <>
      <p className="weather__temp">{data.temperatureF}°F</p>
      <p className="weather__summary">{data.shortForecast}</p>
      <dl className="weather__facts">
        <div>
          <dt>Wind</dt>
          <dd>
            {data.windSpeed} {data.windDirection}
          </dd>
        </div>
        {data.precipitationChance !== null && (
          <div>
            <dt>Chance of rain</dt>
            <dd>{data.precipitationChance}%</dd>
          </div>
        )}
        {data.humidity !== null && (
          <div>
            <dt>Humidity</dt>
            <dd>{data.humidity}%</dd>
          </div>
        )}
      </dl>
      <p className="weather__source">Forecast from weather.gov, updated {updated}.</p>
    </>
  );
}
