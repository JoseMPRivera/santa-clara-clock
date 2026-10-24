# Santa Clara County time and weather

[![CI](https://github.com/JoseMPRivera/santa-clara-clock/actions/workflows/ci.yml/badge.svg)](https://github.com/JoseMPRivera/santa-clara-clock/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A small full-stack web app built with Next.js and TypeScript. It shows the current time on a 12-hour clock and has a button that fetches the forecast for Santa Clara County from the National Weather Service (NWS). The page background shifts between dawn, day, dusk and night with the time.

## Features

- Live clock that ticks every second, with a toggle between your local time and Santa Clara (Pacific) time
- One-click weather lookup: temperature, conditions, wind, chance of rain and humidity
- Hourly forecast strip for the next 12 hours: select any hour to see its details
- °F / °C toggle and an optional auto-refresh every 10 minutes
- Loading and error states, with results announced to screen readers
- Server-side API route with caching and a retry for transient NWS errors

## Tech stack

- [Next.js 15](https://nextjs.org) (App Router) and React 19
- TypeScript in strict mode, including `noUncheckedIndexedAccess`
- Vitest for unit tests
- ESLint with the Next.js rules
- GitHub Actions for continuous integration (lint, type check, tests, build)
- Weather data from the free [NWS API](https://www.weather.gov/documentation/services-web-api), which needs no API key

## Getting started

You need Node.js 18.18 or newer ([nodejs.org](https://nodejs.org)); the repo pins Node 22 in `.nvmrc`.

```bash
npm install
cp .env.example .env.local   # Windows PowerShell: Copy-Item .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

Edit `.env.local` and set `NWS_USER_AGENT` to include your contact email. The NWS asks every client to identify itself. `.env.local` is gitignored and never committed.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check with no output |
| `npm test` | Run the unit tests once |
| `npm run test:watch` | Run the tests in watch mode |

## Project structure

```
src/
  app/
    api/weather/route.ts   GET /api/weather, returns the weather snapshot as JSON
    layout.tsx, page.tsx   Page shell and layout
    globals.css            Theme variables for each time of day
    controls.css           Toggles and the hourly forecast strip
  components/
    Clock.tsx              Client-side clock, time zone toggle and sky theme
    WeatherPanel.tsx       Button, unit toggle, auto-refresh, hourly strip and results
    SegmentedControl.tsx   Accessible either/or toggle
  lib/
    nws.ts                 NWS client (server only)
    sky.ts                 Hour of day to sky theme
    time.ts                Hour and label helpers for a given time zone
    units.ts               Temperature formatting (°F / °C)
    types.ts               Shared types
```

## Design decisions

- **Weather goes through a server route.** The NWS requires a `User-Agent` header, which browsers don't allow scripts to set. The route also keeps the NWS URL logic out of the client.
- **Two-step NWS lookup with caching.** The app first resolves a latitude and longitude to a forecast grid URL (cached for a day, since it almost never changes), then fetches the hourly forecast (cached for 10 minutes). The route also sends `Cache-Control` so a CDN can reuse responses briefly.
- **The forecast URL is validated** to be on `api.weather.gov` before it is fetched.
- **The clock avoids hydration mismatches.** It renders placeholders on the server and starts ticking after mount, so the server and first client render agree.
- **Request state is a discriminated union** (`idle`, `loading`, `error`, `success`), so the UI can't be in an impossible combination of states. In-flight requests are aborted on a new click or on unmount.
- **Auto-refresh is quiet.** Background refreshes keep the current view on screen, skip while the tab is hidden, and ignore transient failures.
- **Controls are real buttons** with `aria-pressed`, so they work with a keyboard and screen readers.
- **The forecast point is San Jose,** the county seat, because the NWS forecasts by point rather than by county. Change `LOCATION` in `src/lib/nws.ts` to use another city.
- **Security headers** (`nosniff`, frame denial, referrer and permissions policies) are set in `next.config.ts`.

## Testing

`npm test` runs unit tests for the NWS client (response mapping, the 12-hour limit, Celsius conversion, missing values, retry behavior, URL validation, empty forecasts) with `fetch` mocked, for the `/api/weather` route (success and 502 paths), and for the time-of-day, time zone and temperature helpers. The same checks run on every push and pull request through GitHub Actions.

## License

[MIT](LICENSE)
