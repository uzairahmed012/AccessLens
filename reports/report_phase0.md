# AccessLens — Phase 0 Development Report

## 1. Phase Overview

- Phase: **0 — Monorepo, design foundation and runnable shell**.
- Report date: **2026-10-21**, Asia/Karachi.
- Date completed: **2026-10-21**.
- Overall status: **PASS — all mandatory Phase 0 gates verified**. Optional live Neon connectivity remains unverified without credentials.
- Objective: establish a real, native development environment, an accessible application shell, a live health API, reusable contracts and engineering checks. Implement no later-phase scanning or persistence behavior.

## 2. What This Phase Implemented

The npm-workspaces repository separates the React frontend, Express backend and shared contracts. Strict TypeScript, linting, formatting, unit tests and browser test infrastructure support ongoing development. The lockfile records the installed dependencies, and the workspace dependency tree was verified.

The redesigned frontend provides a public product website at `/` and a separate application preview under `/app`. The public site includes a hero, clearly labeled interactive concept illustration, audience and feature sections, workflow, accessibility value, final CTA and footer. The app retains the disabled scan form, real API health and empty history with larger, more readable styling. No live findings, scan records, customer statistics or success metrics are fabricated. The user explicitly selected an unauthenticated local preview; accounts remain future work. See section 12 for the redesign and its verification.

The API implements health, validated startup configuration, restricted CORS, security headers, bounded JSON parsing, correlation IDs, structured safe logging, centralized JSON errors and reusable request-body validation. It does not navigate URLs or expose scan routes.

The database foundation includes synchronized Prisma/Prisma Client versions, a PostgreSQL datasource configured through environment variables, and offline validation plus an explicitly credential-dependent connectivity command. There are no application tables, migrations or database writes in Phase 0.

## 3. How the Implementation Works

### Repository and startup

An npm workspace is a group of packages installed together from one project root. `apps/web` owns the interface, `apps/api` owns the HTTP server, and `packages/shared` owns the descriptions of data they exchange. Installation builds the shared package into JavaScript and declarations. The root development script uses `concurrently` to start both local Node processes; Ctrl+C stops them together.

For example, `npm.cmd run dev:api` starts `tsx watch`, which executes the TypeScript server and restarts it after API changes. `npm.cmd run dev:web` starts Vite, which serves React and updates changed frontend modules. Neither command requires a database.

### Frontend-to-backend flow

1. React mounts providers for TanStack Query, themes and reduced-motion preferences.
2. React Router selects the public page for `/` or `AppShell` for `/app/*`. The public page has its own navigation/footer; only the app mounts the sidebar and health indicator. Pages load on demand with a real code-loading message. The remaining steps describe app-only health communication.
3. `ApiStatus` asks TanStack Query for the health resource. While pending, it displays a loading indicator. It never displays a successful connection before a response arrives.
4. `fetchHealth` requests the relative path `/api/health`. Vite forwards that development request to the configured API origin, normally `http://127.0.0.1:3001`.
5. Express returns `{ "status": "ok" }`. The client validates this JSON against the shared Zod schema before showing **API online**. The request is bounded to five seconds and supports cancellation.
6. A failed request or unexpected response produces **API unavailable**, with a retry button. This status refers only to the API process; it says nothing about Neon or a scanner.

The shared schema is an executable definition of the response rather than an informal agreement. For example, a response claiming an extra `database: "connected"` field is rejected by the strict health schema. TypeScript types are inferred from the same schema, so the frontend and backend share one definition.

The URL form has a programmatic label, disabled URL input and disabled submit button. Its explanatory text says that scanning is unavailable and that no URL will be submitted. Its submit handler also prevents navigation. There is no POST request, result polling or fake scan lifecycle.

### Backend boundaries

The server loads the root `.env`, validates recognized settings with Zod and refuses invalid configuration before listening. An invalid port, for example, produces a startup error naming `PORT` without echoing environment values. Blank database settings are allowed for this phase.

Each request receives a server-generated correlation ID, also returned as `X-Request-ID`. Helmet adds security headers. CORS permits only explicitly configured HTTP(S) origins; command-line clients without an Origin header can still reach health. JSON parsing rejects malformed bodies and caps input at 16 KB. The router handles health; unknown routes fall through to a typed 404.

The centralized error handler converts known failures into safe JSON. It does not expose stack traces, connection strings, submitted payloads or raw exception messages. Pino records request method, correlation ID, response status and timing, while omitting request URLs, headers and bodies. A future controller can use `validateBody(schema)` and read the parsed value from `res.locals.body`; invalid input never reaches that controller. Tests exercise this helper using test-only routes.

CORS does not provide authorization or scanner network isolation. Submission rate limits, scan repositories, safe URL policies and persistent queues belong to Phase 1. Browser execution belongs to a separate constrained worker in Phase 2.

### Theme and information flow

Theme state is held in a React context. The toggle changes a `dark` class on the root element and saves the preference in localStorage. The initial preference follows the operating system if none is saved; a small initial script applies it before React paints. CSS variables change the entire palette. If browser storage is blocked, the toggle still works for that session.

Navigation changes focus to the new main content and updates the document title. Motion supplies a short dashboard entrance; `MotionConfig reducedMotion="user"` and the CSS reduced-motion rule respect user preferences. Empty states are static descriptions of unavailable data, not simulated API responses.

### Database configuration and architectural decisions

The Prisma schema declares PostgreSQL; `apps/api/prisma.config.ts` reads `DIRECT_URL` for CLI operations, falling back to `DATABASE_URL` only if a direct URL is not set. `DATABASE_URL` is reserved for the future pooled application client. `scripts/database.mjs` reads the root environment explicitly, so commands behave the same regardless of workspace scripts.

`db:validate` performs schema validation without requiring credentials and never connects. `db:check` instead requires real URLs with `sslmode=require` and executes read-only `SELECT 1` via Prisma's direct datasource. It hides raw failure diagnostics that might contain connection details. This checks the direct connection only; pooled client integration remains Phase 1 work.

Prisma and Prisma Client are pinned together to **7.10.1**. The initial 6.x installation produced three audit entries tracing to a vulnerable `deepmerge-ts` dependency; the stable 7.10.1 release fixes that chain and its engine declaration accepts the installed Node 25 runtime. This is a configuration upgrade within the required Prisma architecture, not a change of database technology. See the [upstream advisory](https://github.com/advisories/GHSA-ggr8-5vv4-36mx). Prisma 7 uses a separate config file for connection URLs and will require a PostgreSQL driver adapter when Phase 1 introduces models/client generation.

The project recommends Node 24 LTS through `.node-version` and the README. Final verification used a project-cached native **Node 24.22.0 LTS**, without changing the system runtime. No models or migrations were added because `Phases.md` explicitly places Scan/Finding persistence in Phase 1. An unused active client, worker or empty migration would imply behavior this phase does not implement.

The user requested local native development, so the Sites skill's local-only workflow was used without creating or deploying a hosted Site. Its alternate hosting framework does not replace the user's explicit React/Vite + Express architecture.

## 4. Files Created or Modified

| File Path                                                                            | Change                 | Purpose                                                                         |
| ------------------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------- |
| `package.json`, `package-lock.json`                                                  | Created                | Workspaces, native development scripts, gates and reproducible dependency graph |
| `.npmrc`, `.gitignore`, `.node-version`                                              | Created                | Local cache, ignored secrets/output, recommended LTS runtime                    |
| `tsconfig.base.json`, `tsconfig.tools.json`                                          | Created                | Shared strict compiler settings and browser-tooling checks                      |
| `eslint.config.js`, `.prettierrc.json`, `.prettierignore`                            | Created                | TypeScript/React/accessibility linting and consistent formatting                |
| `.env.example`                                                                       | Created                | Nonsecret environment template and Neon URL formats                             |
| `packages/shared/src/index.ts`, package/config/tests                                 | Created                | Shared Zod health/error contracts and contract tests                            |
| `apps/api/src/app.ts`, `server.ts`                                                   | Created                | Configurable application factory and native server lifecycle                    |
| `apps/api/src/config/env.ts`                                                         | Created                | Startup environment validation without secret disclosure                        |
| `apps/api/src/lib/logger.ts`, `middleware/*`                                         | Created                | Safe structured logging, errors and request-body validation                     |
| `apps/api/src/routes/health.ts`                                                      | Created                | Real API liveness route                                                         |
| `apps/api/tests/*`                                                                   | Created                | HTTP behavior, validation, errors and logging verification                      |
| `apps/api/prisma/schema.prisma`, `apps/api/prisma.config.ts`, `scripts/database.mjs` | Created                | Optional Neon/Prisma configuration and verification commands                    |
| `apps/web/vite.config.ts`, `components.json`, package/TypeScript configs             | Created                | Vite, Tailwind, aliases, editable shadcn/ui primitives and test configuration   |
| `apps/web/index.html`, `public/favicon.svg`, `src/main.tsx`                          | Created                | App entry, metadata, icon, packaged fonts and providers                         |
| `apps/web/src/app/*`, `components/*`                                                 | Created                | Routing, theme, shell, live API status, accessible empty states and reusable UI |
| `apps/web/src/features/scan/scan-url-form.tsx`                                       | Created                | Clearly disabled scanner preview                                                |
| `apps/web/src/routes/*`, `styles/globals.css`                                        | Created                | Responsive pages and token-based light/dark design                              |
| `apps/web/src/test/*`, `src/lib/api.test.ts`                                         | Created                | User behavior and health-client tests                                           |
| `playwright.config.ts`, `tests/e2e/foundation.spec.ts`                               | Created                | Real browser smoke, responsive, keyboard and axe checks                         |
| `README.md`                                                                          | Created                | Windows setup, environment, verification, Neon and troubleshooting guide        |
| `Memory.md`, `reports/report_phase0.md`                                              | Created and maintained | Verified continuation record and required phase handoff                         |

The original requirements remain in place. `Design.md` was extended to record the user's approved public/app redesign.

## 5. APIs and Database Changes

| Method/path                                 | Response                           | Validation and behavior                                         |
| ------------------------------------------- | ---------------------------------- | --------------------------------------------------------------- |
| `GET /api/health`                           | `200 {"status":"ok"}`              | No inputs; strict shared response schema; no-store cache policy |
| `HEAD /api/health`                          | `200`, no body                     | Same liveness semantics                                         |
| `OPTIONS`                                   | CORS preflight for allowed origins | Only configured origins; GET/HEAD/OPTIONS advertised            |
| Unknown routes, including POST `/api/scans` | `404` typed JSON error             | No scan route or outbound fetch                                 |

Errors contain `{error:{code,message,requestId}}`. Codes in this foundation are `VALIDATION_ERROR`, `NOT_FOUND`, `INTERNAL_ERROR`, `ORIGIN_NOT_ALLOWED`, and `PAYLOAD_TOO_LARGE`. The correlation ID appears in both response JSON and headers. Malformed JSON returns 400, denied CORS origins return 403, oversized bodies return 413, and unexpected failures return a sanitized 500.

Database change: PostgreSQL datasource configuration only. **No models, relationships, migrations, records or table changes.** No database credentials were supplied, and no live connectivity or persistence is claimed.

## 6. UI/UX Implementation

The visual direction follows the precision-audit design: icy background, white/slate surfaces, restrained teal accents, precise borders, 14px cards and navy text. CSS variables implement light and dark palettes without component-specific theme hardcoding. The small-text muted token is slightly darker than the suggested light muted value to improve contrast. Inter and JetBrains Mono are delivered as normal npm font packages.

Desktop uses a persistent sidebar and workspace header. At tablet widths, cards tighten and the lower dashboard stacks. At phone widths, navigation becomes a horizontal row above the header and content forms a single column. The scan form changes to a full-width input/button layout. No interaction depends on hover.

Accessibility includes semantic landmarks, a skip link, meaningful headings, programmatic URL labeling/descriptions, visible focus, current-route semantics, route focus handling, textual API status, new-tab descriptions, decorative icon hiding, reduced motion and readable empty/error states. Browser storage failures do not break themes. The UI explains that automated testing cannot establish WCAG conformance.

## 7. Original Foundation Testing and Verification

Environment: Windows, system Node v25.0.0, npm 11.6.2, Git 2.55.0.windows.4. Final checks ran on **Node v24.22.0 LTS**, with **Google Chrome 154.0.8037.57**, Playwright 1.64.1 and axe-core 4.14.0. Installed versions include TypeScript 5.9.3, Vite 8.3.4, React 19.3.1, Tailwind 4.3.3, Express 5.3.0 and Prisma 7.10.1.

Exact PowerShell context for the final LTS commands:

```powershell
$env:PATH = (Resolve-Path '.npm-cache\_npx\387698761821791d\node_modules\node\bin').Path + ';' + $env:PATH
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run verify
$env:PLAYWRIGHT_CHANNEL = 'chrome'
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run test:e2e -- --max-failures=1
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run format:check
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run db:check
```

The cache path is specific to this session. It was obtained with `npm.cmd exec --yes --package=node@24 -- node -p process.execPath`; `npm.cmd exec --offline --package=node@24 -- node --version` confirmed v24.22.0. Normal development should use installed Node 24 LTS and the shorter README commands.

| Command/check                                                   | Actual final result                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm.cmd install --fetch-retries=0 --fetch-timeout=60000`       | PASS. Shared package built. Final Prisma update audited 641 packages and reported **0 vulnerabilities**.                                                                                                                                                                                                             |
| `npm.cmd audit --json --fetch-retries=0 --fetch-timeout=20000`  | Initial diagnostic found 3 high entries from one transitive dependency chain. Fixed through synchronized Prisma/client 7.10.1 update; final install audit returned 0. No forced audit fix.                                                                                                                           |
| `run verify` → `npm run typecheck`                              | PASS: strict checks for all workspaces and Playwright tooling.                                                                                                                                                                                                                                                       |
| `run verify` → `npm run lint`                                   | PASS: no errors or warnings.                                                                                                                                                                                                                                                                                         |
| `run verify` → `npm test`                                       | PASS: **36/36 unit tests** in 5 files: API 25, web 9, shared 2.                                                                                                                                                                                                                                                      |
| `run verify` → `npm run build`                                  | PASS: shared declarations/JS, compiled API and production web assets. Largest JS chunk 433.89 kB (134.51 kB gzip), overview 129.05 kB; no final chunk-size warning.                                                                                                                                                  |
| `run verify` → `npm run db:validate`                            | PASS: PostgreSQL schema valid without credentials; offline only.                                                                                                                                                                                                                                                     |
| `run test:e2e -- --max-failures=1` with Chrome                  | PASS: **10/10 tests**, 1.8 minutes. Real API/web startup, 360/768/1440px in both themes, keyboard/skip-link use, theme persistence, route refresh, API failure/retry, all routes in both themes, 320/640px reflow, no scan POSTs or browser page errors. Axe found no violations for the tested WCAG A/AA rule tags. |
| `run format:check`                                              | PASS: all matched authored files conform to Prettier.                                                                                                                                                                                                                                                                |
| `npm.cmd ls --depth=0`                                          | PASS: workspace links and dependency tree valid.                                                                                                                                                                                                                                                                     |
| `Invoke-RestMethod -Uri http://127.0.0.1:3001/api/health`       | PASS: real development API returned `{"status":"ok"}`.                                                                                                                                                                                                                                                               |
| `Invoke-WebRequest -Uri http://127.0.0.1:5173 -UseBasicParsing` | PASS: HTTP 200; browser tests additionally verified React rendering.                                                                                                                                                                                                                                                 |
| Compiled API smoke                                              | PASS: native production-mode Node 24 API returned HTTP 200, exact health JSON, no-store and a generated request ID.                                                                                                                                                                                                  |
| `run db:check`                                                  | Expected exit **1** for missing `DATABASE_URL`. No live connection attempted or claimed; credentials are an optional Phase 0 external-service prerequisite.                                                                                                                                                          |
| `git status --short`                                            | Starter is not a Git repository. No commit or clean Git status claimed.                                                                                                                                                                                                                                              |

The compiled smoke used `Start-Process -WindowStyle Hidden` with the cached Node executable, argument `apps/api/dist/server.js`, `NODE_ENV=production` and `PORT=3101`. It requested `http://127.0.0.1:3101/api/health`, asserted response/headers, then stopped exactly that owned API process in `finally`. Final listener inspection found no servers on 3001, 5173 or 3101. No persistent system environment settings were changed.

Defects found and fixed: malformed-URL refinements throwing, Node 25 native localStorage interfering with jsdom, decorative-text contrast, and the large initial bundle. The first unit pass failed on malformed CORS and the storage test harness; the final complete pass is 36/36. The first completed browser run had 7 contrast failures and 3 passes; after corrections the full rerun is 10/10. No application check failures remain.

Sandboxed registry requests initially failed with EACCES. Restricted browser startup failed because `tsx` could not read Windows user information (`uv_os_get_passwd` reported ENOMEM); approved native execution succeeded. Browser output included non-failing color/reduced-motion notices and an npm child-exit message during server teardown; the runner exited 0. ESLint 9 is retained for the JSX accessibility plugin's declared peer support; npm marks that major deprecated, so a coordinated lint-tool upgrade remains a tooling follow-up.

Visual review opened the 1440px light and 360px dark screenshots and checked wrapping, navigation, spacing, the disabled form and empty history. All six screenshots are in ignored `artifacts/phase0-{360,768,1440}-{light,dark}.png`. The 640px test models reflow at 200% of a 1280px viewport. Actual browser-zoom, screen-reader and forced-colors sessions were not performed; automated checks are not a conformance audit.

## 8. How to Run and Test This Phase

1. Install Node.js 24 LTS and npm natively on Windows. Open PowerShell at the project root. Use `npm.cmd`/`npx.cmd` so execution-policy restrictions do not require a system settings change.
2. Run `npm.cmd install`. Preserve the generated lockfile; use `npm.cmd ci` for subsequent clean installs.
3. If no `.env` exists, run `Copy-Item -LiteralPath .env.example -Destination .env`. No database is needed for this shell. The default API host/port is `127.0.0.1:3001`; the web origin is `127.0.0.1:5173`.
4. Run `npm.cmd run dev`. Alternatively, run `npm.cmd run dev:api` and `npm.cmd run dev:web` in separate terminals.
5. Visit `http://127.0.0.1:5173` for the public product website, then follow its CTA to `/app` for the dashboard. Expect a disabled form, empty history and **API online** only in the app. Toggle themes, navigate each page and reload history. Public examples are explicitly illustrative; neither experience submits a scan URL.
6. In another terminal, run `Invoke-RestMethod -Uri http://127.0.0.1:3001/api/health`. Expect `status: ok`. Stop the backend to observe **API unavailable**, restart it and use retry.
7. Run `npm.cmd run verify` and `npm.cmd run format:check` for compiler, lint, unit, build, schema and formatting gates.
8. Run `npx.cmd playwright install chromium`, then `npm.cmd run test:e2e`. If Google Chrome is already installed, use `$env:PLAYWRIGHT_CHANNEL = 'chrome'`, run the e2e command, then `Remove-Item Env:PLAYWRIGHT_CHANNEL` instead of downloading another browser.
9. To test the compiled API, run `npm.cmd run build`, then `npm.cmd run start:api`; request health again from another terminal.
10. Optional database configuration: create a Neon development project/branch, copy pooled/direct PostgreSQL connection URLs from its Connect dialog to private `DATABASE_URL`/`DIRECT_URL`, retain `sslmode=require`, then run `npm.cmd run db:validate` and `npm.cmd run db:check`. The latter needs actual credentials and network access. No tables are created.

Troubleshooting: use `.cmd` on PowerShell, allow npm registry access if restricted, check occupied ports, keep `PORT` and `API_PROXY_TARGET` in sync, and configure exact CORS origins. Invalid environment errors show variable names only. Never paste credentials into reports. If the shared package is missing after interrupted installation, run `npm.cmd run build --workspace @accesslens/shared`. Full instructions are in `README.md`.

## 9. Issues, Limitations, and Pending Work

- Neon credentials were not supplied. Actual connectivity, migrations and persistence are not verified; they are not Phase 0 gates.
- System Node remains 25.0.0; final gates passed on cached Node 24.22.0 LTS. Install Node 24 normally for ongoing development.
- ESLint 9 is deprecated upstream but retained for the accessibility plugin's supported peer range. Upgrade them together when compatible; the final install audit reports no known vulnerabilities.
- Scanner, progress, findings, screenshot inspector, remediation, comparison, exports, accounts and retention are intentionally outside Phase 0.
- Automated accessibility checks cannot replace manual screen reader, browser zoom, forced-colors and user testing.
- No Git repository exists in the supplied workspace, so no commit or clean Git diff can be reported.

## 10. Phase Completion Checklist

Based on the Phase 0 scope and gate in `Phases.md`:

- [x] Inspect repository, documentation and local runtime.
- [x] Verify npm-workspaces installation and shared contracts.
- [x] Verify React/Vite frontend and Express backend startup without Docker.
- [x] Verify strict TypeScript, lint and basic unit tests.
- [x] Verify Tailwind, shadcn/ui primitives, Motion, theme and accessible responsive shell.
- [x] Verify scan form is clearly disabled and submits nothing.
- [x] Verify `GET /api/health` against the running API.
- [x] Verify optional Prisma/Neon configuration offline; document live-connection limit.
- [x] Complete phase report and update Memory.md with actual results.
- [x] Keep Phase 1+ behavior unimplemented and preserve no-Docker restriction.

## 11. Next Phase Handoff

Do not begin Phase 1 until authorized. Its scope is Scan/Finding models and migrations, verified Neon access, queued-record intake, list/status routes, input validation, submission rate limits, trusted-host allowlist mode and persistence/security tests. Do not launch Chromium in an HTTP handler. Phase 2 adds the separate worker and verifies fixture findings plus network-boundary protections before arbitrary external scanning.

Foundation prerequisites are complete: workspaces, shared contracts, environment validation, API middleware, the shell and tests. **Phase 1 readiness: Not Ready for persistence verification until Neon credentials are configured.** Use an isolated Neon development/test branch. Keep pooled application and direct migration credentials distinct. Add the Prisma 7 PostgreSQL driver adapter and generate the client with the initial models. Reuse the safe error contract and validated request data.

Recommended next prompt after all Phase 0 gates pass: **“Read Memory.md, reports/report_phase0.md and all source requirements. Implement Phase 1 only: persisted scans and safe URL intake. Verify real Neon persistence and blocked-host tests. Keep scanning disabled; no Docker. Update memory and create reports/report_phase1.md.”**

## 12. Phase 0 Frontend Redesign — 2026-10-21

### Purpose and scope

The user requested a professional product website before the application dashboard. The original homepage immediately exposed a dense development sidebar and small dashboard typography, without explaining the product, its audience or the value of accessibility work. This redesign replaces that entry experience and refines the app within the existing Phase 0 architecture. No later scanning, persistence or account functionality is introduced. No Docker, new framework or additional dependency is used. **No API or database changes in this redesign.**

Authentication scope was explicitly clarified: **keep the Phase 0 local preview and prepare the layout for real authentication later**. `/app` is therefore not protected and is never represented as authenticated. An always-visible preview notice explains that accounts and live scanning are not enabled. There is no fake sign-in or simulated user session.

### What UI was replaced

- The dashboard-first `/` route is replaced by a complete public product website with its own header, content and footer.
- The old overview's promotional workflow cards and tiny dashboard type are replaced by a task-focused overview, readable scan card, refined empty history, practical getting-started checklist and manual-review reminder.
- The sidebar now belongs exclusively to `/app/*`. Its workspace identity, navigation, resource card, status header and footer were refined; a route back to the public website is available at every breakpoint.
- App typography, spacing, card borders, controls, empty states, settings and roadmap styling were rewritten around a consistent rhythm. Existing disabled-scan behavior, themes and health communication remain functional.

### New public sections and their purpose

| Section             | What it communicates                                                                                                                                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navbar              | Product identity, section navigation, theme preference and the real workspace destination; mobile uses an accessible disclosure menu.                                                                                        |
| Hero                | “See the barriers. Build beyond them.” Explains the intended accessibility workspace and its audience: developers, QA teams and agencies. Clear CTAs open `/app` or navigate to the workflow.                                |
| Product visual      | Interactive, explicitly illustrative issue inspector with three selectable examples: image alternatives, button names and link purpose. Shows the intended relationship between page context, explanation and code guidance. |
| Audience strip      | Identifies who the product is designed for without fabricated customers, logos or adoption figures.                                                                                                                          |
| Feature bento       | Planned visual inspection, practical guidance, comparison and development workflows. Uses varied card composition and purpose-built HTML/CSS illustrations.                                                                  |
| How it works        | Three steps—scan a permitted page, understand the impact, make a reviewed fix—clearly introduced as the workflow being built.                                                                                                |
| Accessibility value | Explains human impact, WCAG as a shared reference, and why manual keyboard/screen-reader/human checks still matter. No compliance certification claim.                                                                       |
| Final CTA           | Gives visitors a concrete next step into the actual preview.                                                                                                                                                                 |
| Footer              | Product, workflow, roadmap, workspace and W3C resource links. No dead pricing, account or legal links.                                                                                                                       |

The public visual is a code-native illustration rather than a screenshot claimed to show live results. It is labeled “Illustrative preview,” “Example finding” and “Example content, not live scan results.” The example hostname uses `.test`. Selecting an example only changes local React state; no health, scan, external-page or persistence request occurs. Displayed HTML/code is rendered as text, never executed. The tote/storefront artwork is HTML/CSS, not a downloaded or generated customer asset.

### How the public website and app are separated

| Route                                                          | Layout and behavior                                                                        |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `/`                                                            | Lazy-loaded `LandingPage`; public navbar/footer, no app sidebar or health query            |
| `/#product`, `/#features`, `/#how-it-works`, `/#accessibility` | Native public section navigation                                                           |
| `/app`                                                         | `AppShell` + overview, explicit local-preview notice, disabled scanner and real API health |
| `/app/history`, `/app/workspace`, `/app/guide`                 | App history, appearance/configuration information and roadmap                              |
| `/history`, `/workspace`, `/guide`                             | Replace-history redirects for compatibility with the original URLs                         |
| Unknown public/app paths                                       | Context-appropriate recovery: return to the website or to app overview                     |

React Router selects the experience. The existing query/theme/Motion providers are shared, but `ApiStatus` mounts only inside `AppShell`. Visiting the public website does not require the API to render or make background health requests. The shared theme preference persists between experiences. The future authentication boundary is `/app`; actual security must later be enforced through real sessions and server-side authorization, not just the layout.

The mobile public navigation is a native button with expanded state and a controlled menu. Escape closes it and restores focus. Selecting an anchor closes the menu and moves to the requested section. Preview choices use real buttons with pressed state and an announced detail region. The illustration never pretends to run a scan. Reduced-motion rules and visible focus apply throughout.

### Files and design decisions

| File                                                                                 | Change and purpose                                                                                                                |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/routes/landing.tsx`                                                    | New complete public page and responsive navigation.                                                                               |
| `apps/web/src/components/marketing/product-preview.tsx`                              | New interactive concept illustration with locally selected examples and safely rendered code.                                     |
| `apps/web/src/components/brand.tsx`                                                  | Shared product identity for both experiences.                                                                                     |
| `apps/web/src/app/app.tsx`                                                           | Public/app route separation, lazy page loading, compatibility redirects and separate unknown-route recovery.                      |
| `apps/web/src/components/app-shell.tsx`                                              | App-only navigation, preview notice and route back to the website.                                                                |
| `apps/web/src/routes/overview.tsx`, `history.tsx`, `features/scan/scan-url-form.tsx` | Focused dashboard, professional empty state, updated route links and honest disabled-scanning copy.                               |
| `apps/web/src/styles/globals.css`                                                    | Replaced compressed dashboard styling with readable app typography, refined spacing, responsive layout and reusable theme tokens. |
| `apps/web/src/styles/marketing.css`                                                  | New public design: strong type, restrained teal glow/grid, product frame, bento, dark workflow, CTA and responsive behavior.      |
| `apps/web/index.html`                                                                | Updated public-facing title and description.                                                                                      |
| `apps/web/src/test/app.test.tsx`                                                     | Updated app routes; added public isolation, example interaction, CTA handoff and legacy-route behavior coverage.                  |
| `tests/e2e/foundation.spec.ts`, `marketing.spec.ts`                                  | Adapted app regression and added public viewport/theme, navigation, API-isolation and reflow checks.                              |
| `Design.md`, `README.md`, `Memory.md`, this report                                   | Recorded the design extension, route model, auth decision, run instructions and verification.                                     |

The visual direction preserves AccessLens's navy/teal identity while using larger typography, deliberate whitespace, varied section layouts and subtle elevation. Shared CSS variables support both themes. A dark workflow section supplies contrast in the narrative without introducing unrelated colors. Page loading remains split: the new landing module is approximately 23.66 kB (6.54 kB gzip); the main JS chunk is 343.94 kB (105.39 kB gzip). The final web build has no chunk-size warning.

WCAG examples/reference copy was checked against the official [overview](https://www.w3.org/WAI/standards-guidelines/wcag/), [non-text content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html), [name/role/value](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html), and [link purpose](https://www.w3.org/WAI/WCAG22/Understanding/link-purpose-in-context.html) documentation.

### Redesign verification and how to review

Redesign status: **PASS**. Under the cached Node 24.22.0 runner, strict typecheck, lint, **39/39 unit tests** (API 25, frontend 12, shared 2), all builds, and offline Prisma schema validation passed. After the final mobile CSS refinement, the web build was rerun and passed. The final complete browser run passed **18/18 tests in 2.9 minutes**, including both experiences at 360/768/1440px in light/dark themes, app health/retry, public API isolation, interactive examples, mobile disclosure/Escape/anchors, keyboard/skip-link behavior, CTA handoff, legacy redirects, unknown-page recovery and 320/640px reflow. All tested axe rule tags reported no violations. Dependencies/backend/database schema were not changed.

The exact final browser command was the same Node/npm CLI context shown in section 7 with `run test:e2e -- --max-failures=1` and `PLAYWRIGHT_CHANNEL=chrome`. Browser checks reused the already-running local development servers; those processes were not stopped or reconfigured. Screenshot review covers the full public page, desktop first viewport, mobile headline/storefront and refined dashboard. Public screenshots are in ignored `artifacts/redesign-public-{360,768,1440}-{light,dark}.png`; dashboard screenshots retain the `phase0-{width}-{theme}.png` naming.

Environment-managed skills appeared in `.agents` during this session. A broad format check initially flagged their unrelated formatting. `.prettierignore` and `eslint.config.js` now exclude that read-only metadata directory, preserving its contents while keeping checks scoped to the project. Final `format:check` and `lint` both passed after this configuration change. Final visual measurement also confirmed that the mobile headline fits at 360px and 320px; desktop/full-page and mobile first-screen images were reviewed.

Run from the project root:

```powershell
npm.cmd run dev
# Public website: http://127.0.0.1:5173/
# Application preview: http://127.0.0.1:5173/app
npm.cmd run verify
npm.cmd run format:check
$env:PLAYWRIGHT_CHANNEL = 'chrome'
npm.cmd run test:e2e -- --max-failures=1
Remove-Item Env:PLAYWRIGHT_CHANNEL
```

Use the existing README setup if dependencies or Chrome are unavailable. In the public preview choose different example checks; the explanation/code changes without API traffic. Open the mobile menu, use its section links, press Escape to dismiss it, and follow a CTA to `/app`. Verify the app preview notice, disabled scanner, health status and return-to-website navigation. Existing API/Neon setup instructions remain unchanged.

Initial verification exposed an accessible-heading spacing issue and two test-timing issues: keyboard input before a lazy page mounted, and a 30-second budget for eight route/theme axe audits. The heading now includes explicit whitespace; keyboard tests wait for rendered content; the multi-page audit gets 60 seconds without removing assertions. Visual review also found an orphaned mobile headline word and overlap within the illustrative storefront; responsive type sizing and illustration flow were corrected.

Authentication and scanning remain deliberately unavailable under the user's confirmed scope. Neon credentials are still absent; live database connectivity remains unverified. Automated accessibility checks, screenshots and width/reflow tests do not replace a manual assistive-technology or full WCAG conformance audit. This redesign remains Phase 0; Phase 1 was not started.

## Phase 0 — UI/UX Redesign and Design System Upgrade

This section records the subsequent UI UX Pro Max + Motion refinement requested by the user. Earlier implementation and verification sections remain historical records. This is still Phase 0, with the existing React/Vite, Tailwind, Express, shared contracts, optional Neon configuration, and native Node setup. No Docker, scanner, authentication, backend endpoint, database model, or migration was introduced.

### Audit and design research

The preceding UI had a centered hero that delayed the product, a storefront illustration that distracted from auditing, small metadata, only four feature themes and three workflow steps, very little Motion usage, and no reusable dialog/tab/notification or future-page patterns. The upgrade addresses structure and interaction as well as visual styling.

The installed `.agents/skills/ui-ux-pro-max/SKILL.md` was read and its Python search tool was actually invoked before UI changes. Queries covered developer tools, accessibility testing, B2B SaaS landing pages, analytics dashboards, typography, palettes, technical styles, motion, React navigation, and shadcn dialogs/tabs. The verified design-system result recommended Minimalism & Swiss Style, a hero/features/CTA structure, Plus Jakarta Sans, semantic colors and restrained transitions. Developer-tool results emphasized direct navigation, documentation and code context; dashboard guidance informed drill-down patterns without inventing charts or data.

The generator persisted `design-system/accesslens/MASTER.md`. `RESEARCH.md` records actual queries, verified findings and limits; `pages/marketing.md` and `pages/workspace.md` document intentional overrides. Accessibility-testing and landing-specific searches plus one narrower retry each returned no exact match. We do not claim otherwise. Existing AccessLens teal was retained instead of adopting the generator's generic orange CTA palette. The [UI UX Pro Max repository](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) and [official Motion accessibility guidance](https://motion.dev/docs/react-accessibility) were consulted. No GSAP or second animation system was added.

### Applied design system

`Design.md` was updated before frontend implementation. The direction is “Signal & Structure”: technical typography, a compact split hero, an audit-focused preview, restrained surface layering, clear section rhythm, and precise controls. Plus Jakarta Sans provides display/page headings; Inter remains the body/UI face; JetBrains Mono identifies markup and selectors. Fonts are installed dependencies served by the existing frontend.

Light surfaces use white and cool slate; dark surfaces use navy/slate layers. Teal is the brand/action color, with a small warm accent for illustrative-preview labels. Semantic critical/serious/moderate/minor colors have both light and dark definitions, always accompanied by labels/icons. Metadata is at least 12px; controls target at least 44px. Shared tokens specify 4/8/12/16/24/32/48/64px spacing, 14px cards and 9px controls. Full palette and typography values are in Design.md and `styles/tokens.css`.

### Public product website

The public `/` remains independent of the app sidebar and makes no API requests. Its new structure is:

1. Sticky navigation: brand, features, workflow, accessibility standards, documentation, theme control and Open app. Mobile uses an expanded-state menu with Escape dismissal.
2. Split hero: “Find accessibility issues. Fix them with confidence.” A concrete explanation names developers, QA teams and agencies; CTAs open the app or explain the workflow. Phase 0 availability is visible.
3. Interactive audit concept: three selectable illustrative findings, explicitly example severity totals, affected selectors, visual element highlighting, original markup, suggested fixes, rule references, expandable context and working code copy feedback. No website is scanned and no reported result is represented as real.
4. Six capability blocks: browser-powered scanning, WCAG-informed detection, visual inspection, reviewed fix guidance, history/comparisons and developer reports. All are labeled planned.
5. Four-step future workflow: choose a URL, run an audit, review evidence, fix and repeat. A separate note identifies what works today.
6. Accessibility education: human impact, WCAG as a shared reference, automation's limits, and the need for keyboard, screen-reader and human review. No compliance guarantee.
7. Final preview CTA and complete footer with working product/documentation/resource links. No fabricated testimonials, customers, usage figures or performance claims.

### Workspace and route separation

The app starts at `/app`, with a persistent local-preview notice and API health that describes liveness only. There is no sign-in simulation or route protection. This boundary prepares future authentication layouts but does not enforce authorization.

| Route                | Current behavior                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| `/app`               | Refined overview, disabled URL form, empty recent scans, practical onboarding and manual-testing reminder       |
| `/app/new`           | Dedicated disabled scan setup, planned audit contents and expandable preparation questions                      |
| `/app/history`       | Semantic empty history table, locally scrollable on narrow screens; no invented records                         |
| `/app/findings`      | Keyboard-accessible tabs for findings, element inspection and fix suggestions, each with a specific empty state |
| `/app/scans/:scanId` | Honest empty scan-details layout; arbitrary IDs do not produce simulated reports                                |
| `/app/workspace`     | Appearance and connections/capabilities tabs; theme persistence still works                                     |
| `/app/guide`         | Existing Phase 0 roadmap and learning links preserved                                                           |

Desktop navigation includes overview, new scan, history, findings and workspace settings. Mobile keeps overview/new scan/history and a focus-managed dialog for secondary destinations. A separate preview-information dialog explains availability. Route changes focus main content; closing an information dialog restores its trigger, while navigation from the menu lets the destination own focus. Legacy URLs still redirect. Returning from findings to `/#product` brings the public inspector into view.

### Reusable components and motion

Owned Tailwind/shadcn-style buttons, cards and inputs remain. Radix primitives now underpin dialogs, tabs and tooltips. New shared components include semantic tables, persistent notifications, loading skeletons, status/severity badges, finding cards, code panels and expandable disclosures. Skeletons represent the real API request only. Code is escaped React text; copying uses the clipboard with success/error feedback, never executes markup or applies a fix.

Motion imports use `motion/react`. `LazyMotion` loads `domAnimation`, and `MotionConfig` follows the user's preference. Shared timing covers 120ms feedback, 160ms page/details/tab entry, 180ms dialog entry/120ms exit, 220ms one-time section movement, and 40ms hero/feature staggering. Motion supports nav/CTA hover feedback, hero and scroll entrances, finding changes, app routes, dialogs, the mobile public menu, tabs, disclosures, actual loading and notifications. State changes immediately; there are no fake progress bars, animated dimensions or decorative infinite loops.

`useReducedMotion` also removes opacity durations and stagger delays because MotionConfig alone does not remove every opacity transition. Essential marketing text is never hidden by a scroll reveal. Reduced-motion views show final states; the real loading skeleton becomes static.

Principal files: `routes/landing.tsx`, `components/marketing/product-preview.tsx`, `components/app-shell.tsx`, `app/app.tsx`, `routes/{scan,findings,scan-details,history,workspace,overview}.tsx`, `components/{finding-card,code-panel,disclosure}.tsx`, `components/ui/{dialog,tabs,table,tooltip,notification,status,button}.tsx`, `lib/motion.tsx`, `main.tsx`, and `styles/{tokens,ui,workspace,marketing,globals}.css`. Package/lock changes add the heading font and Radix primitives. API and shared-contract code are untouched.

### Accessibility, responsive review and verification

Semantic landmarks/headings, labeled fields, native disabled controls, visible focus, pressed/expanded/selected states, icon-plus-text severity, Radix dialog focus traps and keyboard tabs are implemented. The empty table has real headings/caption and a keyboard-accessible horizontal scroll region. Copy notices use a polite live region and remain until dismissed. Important information is visible outside tooltips. Theme choice persists across the public/app boundary.

Native Chrome screenshots were captured and opened for visual inspection of the full public page, first viewport, light/dark desktop, mobile, app overview, new scan, history, findings, settings and the mobile dialog. Review prompted fixes to CTA contrast (a global unlayered link reset had overridden Tailwind text utilities), cramped tab padding, small metadata, and the audit preview's visual context. It also exposed an empty-history paragraph clipped by the table's horizontal scrolling: the explanation now sits below the table and wraps within the card. A regression assertion checks the paragraph's actual bounds, beyond checking page overflow. Heading levels and copy/notification targets were also refined.

The initial jsdom run exposed its missing IntersectionObserver API; a narrow test-environment stub was added, while real viewport behavior remains browser-tested. Lazy imports sometimes exceeded Testing Library's default one-second wait on Windows, so its asynchronous query budget is five seconds without adding sleeps or removing assertions. The expanded reflow matrix gets a 90-second budget because it visits twenty real pages. Headline whitespace was moved between animated spans so both text content and the computed accessible name read naturally.

The initial larger build exposed a 560.50 kB main chunk. Loading `AppShell` separately from the public route reduced it to **383.90 kB (123.43 kB gzip)**; the app shell is 120.56 kB and the landing page 61.55 kB. The production build no longer issues a chunk-size warning. This is bundle evidence, not a claimed network-speed benchmark.

| Check                                                       | Actual result                                                         |
| ----------------------------------------------------------- | --------------------------------------------------------------------- |
| Strict TypeScript and tools config                          | PASS                                                                  |
| ESLint, hooks and JSX accessibility rules                   | PASS                                                                  |
| Unit tests                                                  | PASS: 25 API + 12 web + 2 shared = **39**                             |
| Shared/API/web production builds                            | PASS; no chunk-size warning after route splitting                     |
| Offline Prisma validation                                   | PASS; does not connect to Neon                                        |
| Complete native Chrome suite after app-shell splitting      | **22/22 PASS**, 5.0 minutes                                           |
| Focused heading/control accessibility follow-up             | **3/3 PASS**, 1.3 minutes                                             |
| Final history reflow and both-theme accessibility follow-up | **2/2 PASS**, 1.2 minutes; full paragraph bounds checked at 320/640px |
| Project formatting                                          | PASS; environment-owned skills remain excluded                        |

The full browser suite covers 360/768/1440px in both themes, 320/640px reflow, 375px phones, 812×375 landscape, 1024/1280px laptops and 1920px desktop. It checks the public/app boundary, no public API requests, disabled submissions, theme persistence, API error/retry, legacy/deep routes, skip links, destination focus, mobile menus, dialog trapping/Escape/restoration, tab arrows, disclosures, clipboard feedback/dismissal, rapid finding changes and reduced-motion final states. All executed axe checks report **zero violations for the tested WCAG A/AA tags**; no blanket conformance claim. Normal-motion interactions were exercised as well as reduced-motion views. A manual browser measurement also confirmed that the mobile Features anchor lands below the sticky header and receives focus.

Checks ran with the project-cached native Node 24.22.0 and installed Chrome 154. Exact commands use the Node/npm context in section 7 above, with `run verify`, `run format:check`, and `run test:e2e -- --max-failures=1` after setting `PLAYWRIGHT_CHANNEL=chrome`. Browser runs reused the already-running native development servers; those user processes were preserved. Screenshot helpers close their own browser in `finally`. Final visual artifacts are in ignored `artifacts/upgrade-*`; the full existing screenshot matrix is retained in `redesign-public-*` and `phase0-*`. Neon credentials and environment configuration were not changed.

### Limits and how to try it

Run `npm.cmd run dev`, open `http://127.0.0.1:5173/`, select different example findings, switch inspector tabs and copy an example. Explore `/app` and its menu; scanning remains disabled. Change theme, use keyboard arrows between tabs, and Escape out of dialogs. `README.md` contains native setup and check commands.

This work does not start Phase 1. No Neon credentials were supplied; live database connectivity remains unverified and offline schema validation is not a connectivity test. Actual browser zoom, assistive-technology testing, forced-colors testing, cross-browser testing and full WCAG conformance evaluation remain manual follow-ups. Illustrative fixes must be reviewed in context; this site does not certify accessibility.

## Phase 0 refinement — landscape inspector and graphite/cobalt palette

The user supplied a screenshot showing that the right-side audit preview was too tall and asked for a more considered color scheme. This follow-up refines the existing UI; the preceding implementation and verification records are retained as historical milestones.

The preview now reads horizontally: a compact title bar and a single URL/results toolbar sit above three columns—findings, selected-finding explanation, and the tabbed element/fix panel. Rule references and expandable context live beside the visual rather than below it. Desktop gives approximately 65% of the hero columns to the preview, and the content container expands to 1480px. The hero's heading scale is more balanced against the preview. Tablet uses full width and mobile stacks the same readable content. Nothing is cropped with a fixed height, and code/help can expand naturally.

Measured in native Chrome after fonts loaded: **848×508px at a 1440px viewport**, and **931×508px at 1920px**. The earlier 1440px preview was approximately 700×745px; this is wider and roughly one-third shorter. A regression assertion checks both themes at 1440px for a landscape aspect ratio above 1.5 and a default height below 540px. Phones intentionally prioritize natural reading order over a forced landscape ratio.

The color system changes from navy/cyan to **graphite and cobalt**. Dark mode uses #101114 canvas, #191B20 cards, #F0F1F5 text and #A5B4FF actions; light mode uses #F7F7F5 canvas, white cards, #22242C text and #3D52D5 actions. Neutral surfaces and borders establish hierarchy; one blue accent identifies actions, selection and focus. The illustrative label is neutral, leaving red/amber for severity and green for real API health. These shared tokens update the app as well as the marketing site. The preview glow was removed.

UI UX Pro Max was consulted again through actual local searches: `developer tools neutral blue --domain color -n 3` and `minimalism contrast hierarchy --domain style -n 2`. Results supported neutral technical surfaces, documentation link blue, clear hierarchy and restrained decoration. The graphite/cobalt palette is a documented project-specific decision informed by those results. `Design.md`, research provenance and marketing/workspace overrides now record this decision ahead of the previous teal direction.

Changed files include `components/marketing/product-preview.tsx`, `styles/{tokens,marketing,product-preview}.css`, the landing stylesheet import, the marketing browser geometry checks, Design.md, Memory.md and design-system research/overrides. Obsolete inspector CSS and breakpoint overrides were removed rather than layering conflicting revisions. The architecture, backend, health endpoint, local-preview boundary, reduced-motion behavior and Phase 0 scope are preserved. No Docker or new dependencies.

Actual desktop/mobile screenshots and code-fix views were opened for review, including 1280/1440/1920px desktop/laptop, the 1024px full-width tablet composition and the stacked phone preview in both themes. At 1024px the inspector measures 960×508px. Final images are in ignored `artifacts/landscape-{hero,inspector,fix}-*`. The complete regression suite also covers 320/360/375/640/768px widths, landscape, wide desktop, both themes and reduced motion.

| Verification                   | Actual result                                                                           |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| Native Chrome regression suite | **22/22 PASS**, 5.7 minutes                                                             |
| New geometry assertions        | PASS in both themes at 1440px; aspect ratio >1.5 and default height <540px              |
| Automated accessibility        | Zero axe violations for tested WCAG A/AA tags across public/app checks                  |
| Serial `verify`                | PASS: strict TypeScript, lint, **39 unit tests**, all builds, offline Prisma validation |
| Project formatting             | PASS                                                                                    |
| Production bundle              | Main JS 383.90 kB; landing JS 61.48 kB; landing CSS 15.65 kB; no size warning           |

The first concurrent run encountered two existing unit-test timeouts while Chrome/axe/capture work ran in parallel. The final unit/build verification ran serially and passed. No assertions or timeout budgets were relaxed. Native Node 24.22.0 and Chrome 154 were used; existing user development servers were preserved, and screenshot helpers closed their own browser processes. Manual assistive-technology/cross-browser/actual zoom verification and live Neon connectivity remain outside the executed checks, as previously documented. Phase 0 scanning/authentication remain deferred.

### Follow-up — remove the full-section outline

The border in the user's screenshot was the global keyboard-focus outline being applied to a noninteractive section anchor after navigation. A scoped marketing CSS rule now suppresses that section-sized outline while preserving destination focus and the existing focus styles on interactive controls. Native Chrome verified the section stays focused with `outline-style: none` and its link still receives a visible 3px keyboard-focus outline. Screenshot: `artifacts/section-outline-removed.png`. This CSS-only fix did not require new unit tests or a full regression run.
