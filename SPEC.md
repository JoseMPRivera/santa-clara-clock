# Spec: santa-clara-clock portfolio-readiness and interactivity (v0.2)

## Objective
Make the repo easy for a recruiter or hiring engineer to understand, run and trust in under five minutes, and make the UI more interactive without adding dependencies.

## Tech Stack
Next.js ^15.1, React ^19, TypeScript ^5.6 (strict, `noUncheckedIndexedAccess`), Vitest ^3, ESLint ^8.57, Node 22 (`.nvmrc`), NWS API.

## Commands
```
Install: npm ci
Dev:     npm run dev
Build:   npm run build
Lint:    npm run lint
Types:   npm run typecheck
Test:    npm test
```

## Project Structure
See the "Project structure" section of README.md.

## Code Style
Small typed modules, comments explain why, state modeled as discriminated unions, `@/` path alias, `server-only` for server modules, no `any`.

## Testing Strategy
Vitest in a node environment, tests beside source as `*.test.ts`. Covered: NWS client, `/api/weather` route, sky, time and units helpers. Component tests (jsdom and Testing Library) are out of scope until approved.

## Boundaries
- Always: run lint, typecheck, test and build before committing; keep secrets out of git; keep README in sync.
- Ask first: new dependencies, deploy target, upgrading Next or ESLint.
- Never: commit secrets or a real contact email, remove failing tests without approval, change the weather source.

## Success Criteria
1. Lint, typecheck, tests and build pass locally and in CI.
2. A fresh clone runs with the documented steps only.
3. `/api/weather` has tests for its 200 and 502 paths.
4. Users can switch the clock between local and Santa Clara time, switch °F/°C, browse a 12-hour forecast strip, and opt into auto-refresh, all by keyboard.
5. No secrets or personal email in git history.
6. README has a screenshot and a live demo link (pending deploy decision).

## Open Questions
1. Deploy (for example Vercel) for a live demo link?
2. Persist the unit and time zone choices (localStorage)?
3. Add component tests with jsdom and Testing Library?
4. Migrate off `next lint` now or at the next Next upgrade?
