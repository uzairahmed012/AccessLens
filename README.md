# AccessLens

A developer workspace for evidence-based website accessibility auditing. **Phase 1** adds queued scan jobs, safe URL intake and Neon-backed history to the separate application preview. Live scanning remains disabled. The public product illustration is explicitly labeled example content; it never requests or presents live scan data.

The source requirements are `PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, and `Design.md`. All processes run natively. **No Docker.**

## Run locally on Windows

1. Install **Node.js 24 LTS** with npm. The system runtime is Node 25.0.0; final verification used a project-cached Node 24.22.0 LTS without changing that installation. Use LTS for ongoing development. Git is optional to run the app; this starter directory has no initialized repository.
2. Open PowerShell in the project root. Use `npm.cmd` to avoid Windows execution-policy restrictions on `npm.ps1`.
3. Install and start:

   ```powershell
   npm.cmd install
   if (!(Test-Path -LiteralPath .env)) { Copy-Item -LiteralPath .env.example -Destination .env }
   npm.cmd run dev
   ```

   Preserve existing credentials. The shell and public website start without a database; saving and reading jobs require the Neon setup below. `npm.cmd ci` reproduces locked dependencies. Installation builds shared contracts and generates the Prisma client locally without connecting to Neon.

4. Open **http://127.0.0.1:5173** for the public website. Use **Explore the workspace** to enter **http://127.0.0.1:5173/app**. The app header reports **API online** for backend liveness. **Create scan job** saves a queued job for a configured approved host and opens its details. No target website is visited and no accessibility findings are generated. Accounts are not enabled: `/app` is a local preview, not an authenticated or protected route.
5. Visit **http://127.0.0.1:3001/api/health**; expect exactly `{"status":"ok"}`. This checks API liveness, not database readiness.
6. Stop both processes with **Ctrl+C**.

To use separate terminals:

```powershell
npm.cmd run dev:api
npm.cmd run dev:web
```

The API binds to loopback by default. Vite proxies browser requests under `/api` to `API_PROXY_TARGET`, so credentials never enter frontend code. If the API port changes, update both `PORT` and `API_PROXY_TARGET` in `.env`. If the frontend origin changes, update `CORS_ORIGINS` and the Vite CLI port. Use explicit HTTP(S) origins without paths or trailing slashes.

## Public website and application

| Route                                                          | Experience                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------------- |
| `/`                                                            | Public marketing website; no sidebar and no API requests   |
| `/#product`, `/#features`, `/#how-it-works`, `/#accessibility` | Public section navigation                                  |
| `/app`                                                         | Queued-job form, recent saved jobs and live API health     |
| `/app/new`                                                     | Create a queued job for an approved public host            |
| `/app/history`                                                 | Persisted jobs with bounded cursor pagination              |
| `/app/findings`                                                | Empty findings, element inspection and fix suggestion tabs |
| `/app/scans/:scanId`                                           | Persisted job metadata, state and safe errors              |
| `/app/workspace`                                               | Appearance and development configuration information       |
| `/app/guide`                                                   | Development roadmap                                        |
| `/history`, `/workspace`, `/guide`                             | Compatibility redirects to corresponding `/app` routes     |

The marketing inspector uses React state to switch between three illustrative accessibility examples. Its tabs show a highlighted example element or original/suggested code. Copying code writes only to your clipboard and shows a dismissible notification. It does not fetch a website, generate findings, store records or execute displayed code. Planned capabilities are identified as planned. The app has its own shell and a persistent preview notice. On mobile, its menu opens the remaining workspace routes. Future authentication belongs at the `/app` boundary and must include server-side authorization when private data is introduced; the current layout is not an auth mechanism.

The design research is persisted in `design-system/accesslens/`. `Design.md` defines the applied tokens, typography, responsive patterns, reusable controls, and reduced-motion rules. `reports/report_phase0.md` preserves earlier milestones and records the current UI/UX upgrade separately.

## Verify

```powershell
npm.cmd run verify
npm.cmd run format:check
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

`verify` runs strict TypeScript checks, ESLint (including React hooks and JSX accessibility), backend/frontend/shared unit tests, all builds, and **offline** Prisma schema validation. Playwright starts its own native API/Vite processes if they are not already running. Browser tests exercise real API health, routes, themes, keyboard use, API retry, responsive layout, and axe checks on AccessLens itself. They do not implement the future scanner. Screenshots go to ignored `artifacts/`; failure traces go to `test-results/`.

If Google Chrome is already installed, you can use it for these application UI checks without downloading another browser:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm.cmd run test:e2e
Remove-Item Env:PLAYWRIGHT_CHANNEL
```

For compiled API verification:

```powershell
npm.cmd run build
npm.cmd run start:api
# In another terminal:
Invoke-RestMethod -Uri http://127.0.0.1:3001/api/health
```

## Neon development setup

Use the existing `accesslens` Neon project and an isolated non-production branch. Never infer database readiness from API health. Never paste credentials into logs, reports or `VITE_` variables.

1. In the existing project, create/select an isolated development/test branch and open its **Connect** dialog. Do not use the production branch.
2. Copy the pooled PostgreSQL URL into `DATABASE_URL` in your private root `.env`. Copy the corresponding direct URL (pooling disabled) into `DIRECT_URL`. Preserve `sslmode=require` and any Neon-provided TLS parameters. URL-encode special password characters if constructing URLs manually. Never commit these values.
3. Run:

   ```powershell
   npm.cmd run db:generate
   npm.cmd run build
   npm.cmd run db:check
   ```

   `db:check` verifies both pooled and direct connections through Prisma using read-only `SELECT 1`, with TLS certificate verification. It checks that the URLs match one endpoint, database and role. It requires the API production build. Raw database errors are withheld. `db:validate` is an offline schema check.

4. Confirm both URLs belong to your isolated branch. Set `DATABASE_TARGET_CONFIRMED=development` in private `.env` only after checking the target. Then run `npm.cmd run db:migrate` and `npm.cmd run db:status`. This applies the committed initial Scan/Finding migration using **DIRECT_URL**, with no reset or `db push`. Migrations require the confirmation guard and reject production mode.
5. Set `SCAN_ALLOWED_HOSTS` to comma-separated exact public hostnames you own or are authorized to test. For a local intake smoke test you can use `example.com`; Phase 1 only resolves DNS and saves metadata. No wildcards, URL schemes, paths or ports. Empty configuration disables intake. Restart the API after changing `.env`.
6. Run `npm.cmd run dev`. Submit an approved URL at `/app/new`, follow its job link, open history, restart the API and reload the detail page. Its state remains `queued`; there is no worker yet.
7. Run `npm.cmd run test:database` for opt-in real integration checks. The guard is mandatory. It creates a generated `phase1_test_<random>` schema, applies migrations there, checks direct/pooled access, real writes, constraints, API creation/read, a physical API restart, ordering and cursor pagination, then drops **only that generated schema**. Public app records are preserved. It needs native child-process/network access and the production build.

   For the actual browser-to-Neon workflow, set `$env:PLAYWRIGHT_CHANNEL='chrome'` if using installed Chrome, then run `npm.cmd run test:database -- --browser`. It starts separate local API/Vite processes and checks real form submission, persisted details after reload, history, mobile reflow and axe checks on AccessLens. It never visits submitted target websites. Regular `test:e2e` also uses clearly scoped HTTP fixtures for deterministic error, empty and pagination UI tests; those fixtures are not persistence evidence.

Prisma, client and PostgreSQL adapter are pinned together at 7.10.1. Keep versions aligned. Prisma 7 migration configuration reads only DIRECT_URL; runtime reads DATABASE_URL. The adapter limits each pool to five connections, bounds connection/query times and verifies TLS certificates. Generated client sources are ignored and recreated on install; never commit secrets or generated credentials.

## API foundation

| Endpoint                             | Behavior                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| `GET /api/health`                    | `200 {"status":"ok"}`; `Cache-Control: no-store`                                |
| `HEAD /api/health`                   | Health headers, no response body                                                |
| `POST /api/scans`                    | Strict `{ "url": "https://approved-host/path" }`; `202` queued DTO and Location |
| `GET /api/scans?limit=10&cursor=...` | `{ items: Scan[], nextCursor: string or null }`; limit 1–50, default 20         |
| `GET /api/scans/:id`                 | Persisted job DTO or safe 404; UUID required                                    |
| Unknown routes                       | `404` with a typed JSON error                                                   |

Errors have the form:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "This endpoint does not exist.",
    "requestId": "server-generated-correlation-id"
  }
}
```

The request ID also appears in `X-Request-ID`. Helmet supplies security headers, CORS permits configured origins and POST preflight, JSON bodies are bounded to 16 KB, and centralized middleware hides raw errors. Logs omit request URLs, bodies, credentials and cookies. Shared Zod contracts validate request/response shapes. Limits are 10 submissions/minute and 120 scan-route requests/minute per client IP, with Retry-After and standard rate-limit headers. Forwarded headers are not trusted. Counters are in memory and reset on restart; multi-instance/public deployment needs shared limits and authentication/ownership.

URL intake uses standards-based normalization, rejects credentials, non-HTTP(S), every IP literal (including alternative IPv4 forms), unsafe ports and hostname tricks; enforces exact canonical host approval; and rejects any nonpublic DNS answer. DNS has a 3-second deadline and eight pending lookup slots. No target HTTP request or browser is started. This intake check does **not** solve redirects or DNS rebinding at execution time: Phase 2 must revalidate all destinations and actual browser connections before scanning.

The queued DTO includes `id`, original `url`, `normalizedUrl`, lowercase `status`, ISO timestamps, nullable start/finish and safe error fields. No score, report, findings count or fabricated progress is returned. Malformed requests use 400; unsafe hosts 403; missing jobs 404; media-type errors 415; rate limits 429; disabled intake, DNS failures and storage failures 503. Health remains 200 when storage is unavailable.

After configuring an approved host and applying the migration, a local PowerShell smoke test is:

```powershell
$scanJob = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3001/api/scans -ContentType 'application/json' -Body '{"url":"https://example.com/page"}'
Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/scans/$($scanJob.id)"
Invoke-RestMethod -Uri 'http://127.0.0.1:3001/api/scans?limit=10'
```

The response is a queued job, not an accessibility report. To inspect storage independently, use the Neon development branch SQL editor with a read-only query such as `SELECT id, status, "createdAt" FROM "Scan" ORDER BY "createdAt" DESC LIMIT 10;`. Ensure the selected branch matches `.env`.

## Structure and next phase

```text
apps/web/          React/Vite application, reusable UI, theme and health client
apps/api/          Express API, environment validation, middleware and Prisma schema
packages/shared/   Shared Zod contracts and inferred TypeScript types
scripts/           Native database verification helper
tests/e2e/         Browser and accessibility tests for AccessLens itself
reports/           Required phase reports
Memory.md          Verified continuation context and outstanding work
```

The next phase is the separate constrained browser worker in Phase 2. Do not navigate submitted URLs inside API handlers. Arbitrary external scanning must remain disabled until network-boundary SSRF controls are proven. Retain trusted-host mode, never run user scripts or disable Chromium's sandbox.

Read [the Phase 0 report](reports/report_phase0.md) for actual verification results and [Memory.md](Memory.md) before continuing. Automated checks cannot establish WCAG conformance; manual keyboard, screen reader, zoom and user testing remain necessary.

## Troubleshooting

- **PowerShell blocks npm:** use `npm.cmd` / `npx.cmd`; no execution-policy change is required.
- **Registry access fails:** check network/proxy permissions and rerun installation. The repository-local `.npm-cache` avoids writing to the user profile cache.
- **API unavailable:** start the backend, check startup output, and verify `/api/health` directly. Use the header's retry button after resolving the issue.
- **Port already in use:** stop your earlier process or change the configured ports consistently. Vite uses a strict port to prevent silently switching origins.
- **Environment rejected:** startup reports only invalid variable names. Check `.env.example`; do not paste secret values into logs or issue reports.
- **Shared package missing:** rerun `npm.cmd run build --workspace @accesslens/shared` after an interrupted installation.
- **Browser executable missing:** run `npx.cmd playwright install chromium` locally, then rerun browser tests. No scanner worker is started.
- **Database check fails:** build the API first; verify matching pooled/direct URLs, TLS, Neon availability and network access. The public site and shell remain runnable without a database.
- **URL intake disabled:** configure exact `SCAN_ALLOWED_HOSTS` and restart the backend. Include each needed subdomain explicitly.
- **History returns 503:** check `db:check` and `db:status`; apply the migration only after confirming the isolated target.
- **Migration guarded:** check your Neon branch, then set `DATABASE_TARGET_CONFIRMED=development`. Do not bypass the guard for production.

## Tooling references

Implementation was checked against the official [Vite guide](https://vite.dev/guide/), [Tailwind Vite integration](https://tailwindcss.com/docs/installation/using-vite), [shadcn/ui manual installation](https://ui.shadcn.com/docs/installation/manual), and [Prisma configuration documentation](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference). The editable shadcn/ui primitives live in `apps/web/src/components/ui`; `components.json` and `@/` aliases support future component additions.
