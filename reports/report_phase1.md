# AccessLens — Phase 1: Neon persistence and secure URL intake

## 1. Phase Overview

- Date: 2026-10-22, Asia/Karachi.
- Goal: save and retrieve real queued scan jobs through the existing React/Express/Prisma stack, with restricted URL intake.
- Status: **PASS** — implementation, real Neon migration/persistence, API restart, UI integration and browser regressions verified.
- Boundaries: no Docker, authentication, worker, target browser navigation, axe audits of submitted websites, generated findings, scores or fake progress.

The approved Phase 0 public website, graphite/cobalt palette, landscape inspector, fonts, responsive layouts, theme preferences and Motion behavior are retained. Historical Phase 0 results remain in `reports/report_phase0.md`.

## 2. What This Phase Implemented

- Prisma Scan/Finding models, lifecycle/impact enums, indexed relationships and an initial versioned SQL migration.
- Prisma 7 PostgreSQL adapter with pooled runtime access, direct migration access, certificate-verified TLS, bounded connection pools and timeouts.
- Shared Zod input, job, list, status and error contracts.
- Job creation, cursor-paginated history and single-job retrieval APIs.
- Standards-based URL normalization, exact configured-host approval, IP-literal rejection and fail-closed DNS checks.
- Bounded JSON, submission/read rate limits, safe errors, request correlation and no-store responses.
- Real form submission, saved-job details, recent jobs and history with accessible pending, empty, error, retry and pagination states.
- Guarded migration/check commands and opt-in integration tests using a disposable schema on the confirmed Neon development branch.

## 3. How the Implementation Works

The user enters an approved public website URL in the existing app form. The browser checks the field and submits JSON to Express. Express validates the shared request contract, parses the URL, verifies that its hostname is explicitly approved, and resolves its DNS addresses. Every returned address must be public. It then uses Prisma and the pooled Neon connection to insert a job with `queued` status.

The API returns the saved job and a detail location. React opens that job, reads its actual metadata, and invalidates history so recent jobs refresh. History reads a bounded page from Neon, newest first. A cursor records the last timestamp and UUID so equal timestamps do not duplicate or omit jobs. Restarting the API does not remove those rows.

The job stays queued. There is no scanner to pick it up in Phase 1. DNS resolution is an intake check; no HTTP request or browser visit to the submitted website occurs.

## 4. Files Created or Modified

| Files                                                                                 | Purpose                                                                |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `apps/api/prisma/schema.prisma`                                                       | Scan/Finding models, lifecycle/impact enums and indexes                |
| `apps/api/prisma/migrations/202610220001_phase1/migration.sql`, `migration_lock.toml` | Initial PostgreSQL migration history                                   |
| `apps/api/prisma.config.ts`                                                           | Direct-only migration connection; no pooled fallback                   |
| `apps/api/src/lib/database.ts`                                                        | Verified TLS and bounded Prisma PostgreSQL adapter                     |
| `apps/api/src/scans/repository.ts`                                                    | Persistence, DTO mapping and stable cursor pagination                  |
| `apps/api/src/scans/url-policy.ts`                                                    | URL, hostname, IP, allowlist and bounded DNS checks                    |
| `apps/api/src/routes/scans.ts`                                                        | Queued creation, list/detail, limits and safe storage failures         |
| `apps/api/src/{app,server}.ts`, `config/env.ts`                                       | Route wiring, POST CORS, allowlist config and database shutdown        |
| `packages/shared/src/index.ts`                                                        | Shared Zod contracts and inferred types                                |
| `apps/web/src/lib/api.ts`                                                             | Typed bounded HTTP client and safe API errors                          |
| `apps/web/src/features/scan/{scan-url-form,scan-history}.tsx`                         | Functional intake and reusable API-backed history                      |
| `apps/web/src/routes/{overview,history,scan-details}.tsx`                             | Actual saved-job UI                                                    |
| `apps/web/src/routes/{landing,guide,workspace}.tsx`, `components/app-shell.tsx`       | Accurate Phase 1 availability copy                                     |
| `apps/web/src/styles/workspace.css`                                                   | Error, metadata, long-URL and data-state styling using existing tokens |
| `apps/web/vite.config.ts`                                                             | Read proxy configuration without changing production NODE_ENV          |
| `apps/api/tests/{app,scans,url-policy}.test.ts`, web tests, `tests/e2e/*.spec.ts`     | API/security, UI and Phase 0 regression coverage                       |
| `scripts/database-{cli,environment}.mjs`, `scripts/test-database.mjs`                 | Guarded operations and isolated real integration checks                |
| `package.json`, API package manifest, `package-lock.json`                             | Adapter/driver dependencies, client generation and scripts             |
| `.env.example`, ESLint/Prettier configuration                                         | Non-secret setup and generated-client exclusions                       |
| `README.md`, `Memory.md`, this report                                                 | Setup, evidence and next-phase handoff                                 |

`Design.md` also records queued-job form, history and detail interaction requirements within the existing approved visual system.

The previous `scripts/database.mjs` was replaced by the new commands. The private root `.env` credentials were preserved; only non-secret development-target confirmation and a default `example.com` allowlist were appended when absent. `.env` and generated Prisma sources remain ignored. The starter has no initialized Git repository; migration files are supplied in the conventional versioned directory, without creating a repository or commit.

## 5. APIs and Database Changes

| Endpoint                              | Contract                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `GET /api/health`, `HEAD /api/health` | Existing liveness contract; independent of database readiness                                                 |
| `POST /api/scans`                     | Strict JSON `{ "url": "https://example.com/page#section" }`; returns **202**, `Location` and saved queued DTO |
| `GET /api/scans?limit=10&cursor=...`  | `{ "items": [...], "nextCursor": "..." or null }`; default limit 20, maximum 50                               |
| `GET /api/scans/:id`                  | Saved DTO; malformed UUID 400, missing job 404                                                                |

202 and lowercase status values deliberately preserve the explicit `Architecture.md` contract rather than introducing incompatible 201/uppercase variants.

Example creation response, illustrative contract only:

```json
{
  "id": "5cb0a6ac-3050-49bf-9c69-33f5be130001",
  "url": "https://example.com/page#section",
  "normalizedUrl": "https://example.com/page",
  "status": "queued",
  "createdAt": "2026-10-22T00:00:00.000Z",
  "updatedAt": "2026-10-22T00:00:00.000Z",
  "startedAt": null,
  "finishedAt": null,
  "errorCode": null,
  "errorSummary": null
}
```

Errors retain `{ error: { code, message, requestId } }` and `X-Request-ID`. Important statuses: 400 invalid body/query/ID, 403 forbidden target/origin, 404 missing job, 413 oversized JSON, 415 unsupported media type, 429 rate limit, 503 unconfigured intake/DNS/storage failure. Raw database errors and arbitrary stored error summaries are never returned.

**Scan:** UUID primary key; original/normalized URLs bounded to 2048 characters; lowercase PostgreSQL status enum; created/updated timestamps; nullable start/finish/error fields. New rows default to queued. Indexes cover status/createdAt and descending createdAt/UUID history ordering.

**Finding:** UUID primary key and required Scan foreign key, impact enum, rule ID, bounded descriptive/evidence text, WCAG/selector arrays and creation time. Indexes cover scanId/impact and scanId/ruleId. Deleting a Scan cascades its Findings. No finding records are populated by this phase, including integration tests. Worker-specific capture, leases and result metadata remain Phase 2 or later work.

**Neon:** runtime uses pooled `DATABASE_URL`; Prisma CLI uses only `DIRECT_URL`. Tooling checks matching endpoint, database and role, correct pooler/direct forms, Neon hostname and TLS before connection. The runtime explicitly verifies certificates, removes URL options that could override that choice, uses five connections per pool, a 10-second connection timeout, 30-second idle timeout, five-second statement timeout and 10-second driver query timeout. Shutdown disconnects Prisma.

The reviewed additive migration was applied to the user-confirmed isolated development branch with `migrate deploy`; `migrate status` succeeded. No `db push`, reset, production migration or production data cleanup was used. The explicit guard records operator confirmation; it does not independently discover a branch’s production designation.

## 6. UI/UX Implementation

The public `/` website remains separate and makes no API requests. Its example inspector remains labeled illustrative. `/app/*` is still explicitly a local development preview; no login or protection is implied.

The approved form now uses **Create scan job**, disables duplicate submission while saving, retains input on errors, connects error text to the field and announces pending/error states. Success opens the persisted job. Details show real URL, UUID, timestamps and state, with a clear queued/awaiting-engine explanation and no invented findings, score or progress bar.

History and recent jobs read the API. History exposes a keyboard-scrollable semantic table and cursor-based Load more action. Loading, storage failure/retry, empty history and missing details have distinct states. Long URLs and identifiers wrap within the established responsive layouts. Existing semantic tokens, typography, controls, focus behavior, light/dark themes and reduced-motion rules are retained.

## 7. Testing and Verification

Executed checks:

- `npm.cmd run verify`: PASS — TypeScript, lint, **108 API + 14 web + 2 shared = 124 unit tests**, all production builds and offline Prisma schema validation.
- `npm.cmd run db:check`: PASS — both pooled and direct certificate-verified connections and SELECT 1.
- `npm.cmd run db:migrate`: PASS — reviewed initial migration deployed after explicit user confirmation.
- `npm.cmd run db:status`: PASS — migration status current.
- `npm.cmd run test:database`: PASS — **10/10** real checks: direct connectivity; isolated migration; pooled Prisma access; queued writes/defaults; primary-key/length/status constraints; Finding foreign key with no artificial findings; HTTP creation with actual DNS; persistence after physical API restart; stable pagination including equal timestamps; missing-job and blocked-target behavior.
- `npm.cmd run test:e2e -- --max-failures=1` with native Chrome: PASS — **26/26**, 4.3 minutes. Public/app separation, keyboard/focus, clipboard, dialogs, both themes, reduced motion, responsive/reflow matrices, queued-job contracts, rejected intake, storage retry/cursor pagination and missing-job recovery. Zero axe violations for tested tags.
- `npm.cmd run test:e2e -- tests/e2e/scan-jobs.spec.ts -g 'populated history' --max-failures=1`: PASS — **1/1** additional populated-history desktop-to-375px resize regression with six job contract fixtures, 9.1 seconds. This additional case was added after the 26-test run.
- `npm.cmd run test:database -- --browser` with native Chrome: PASS — **11/11** real integration checks, including browser form → API → Neon, detail reload, actual history, mobile reflow and zero detail/history axe violations. Generated schema cleanup succeeded.
- Client secret check: PASS — **37** generated text assets checked against the actual private connection URLs/passwords; no match. Values were not printed.

Browser commands use PowerShell `$env:PLAYWRIGHT_CHANNEL='chrome'`. Verification used native Node **24.22.0**, npm **11.6.2**, installed Chrome **154**. Dependency installation reported zero audit vulnerabilities. **Final serial `verify` PASS; `format:check` PASS.** All 124 unit tests, type/lint checks, production builds and offline schema validation passed after the fixes described below.

The actual LTS npm invocation used in this Windows workspace was:

```powershell
$env:PATH = (Resolve-Path '.npm-cache\_npx\387698761821791d\node_modules\node\bin').Path + ';' + $env:PATH
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run verify
node 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' run format:check
```

Security regressions exercise malformed schemes, credentials, encoded hosts, numeric/octal/hex IPv4, IPv6/mapped addresses, private/local/link-local/metadata/multicast/documentation/benchmarking/transition ranges, IDNA approval, trailing dots, allowlist lookalikes/subdomains, mixed DNS answers, empty/failing DNS, lookup timeouts/capacity, body/query bounds, rate limits and safe database failures.

Failures were addressed rather than hidden: the IP library classified the IPv4 benchmarking range as unicast, so explicit conservative range blocks were added; the first frontend run hit Windows sandbox worker startup timeouts, so native approved verification was used; lint found the intentional control-character regex and browser callback globals, which were corrected. Introducing root `.env` exposed a pre-existing Vite configuration side effect that bundled development React; reading only proxy configuration without mutating NODE_ENV restored the production build. The corrected main chunk is **379.76 kB**, with no development React marker or 500 kB warning.

The initial real-browser harness attempts passed job creation/reload but needed an explicit browser context for axe and synchronization before the post-resize assertion. Both harness issues were fixed; the final browser/database run passed all 11 checks and cleaned up its schema. Actual desktop detail/history and mobile history screenshots were opened for visual review in ignored `artifacts/phase1-real-*`. The extra resize regression initially needed an `Array.from` conversion to satisfy the tools TypeScript configuration without DOM.Iterable; that diagnostic was fixed before the final checks.

`Design.md` was also updated to specify the now-functional queued-job interactions while preserving historical Phase 0 visual decisions.

One serial follow-up hit the five-second unit-test budget while cold-loading routes and simulating every URL keystroke. The submission tests now paste the URL, retaining pending/disabled/error/navigation and request-count assertions without increasing timeouts. Final rerun: all 124 unit tests pass. A read-only final storage check confirmed the public migration is applied, no generated test schemas remain, and no test jobs or Findings were left in application tables. The running local API returns 200 for both health and history.

## 8. How to Run and Test This Phase

1. Use native Node 24 LTS and PowerShell. Run `npm.cmd ci`; installation builds shared contracts and generates the client offline. Preserve existing `.env`.
2. In the existing `accesslens` Neon project, select an isolated non-production branch. Put its pooled URL in private `DATABASE_URL` and direct URL in `DIRECT_URL`, with TLS. Never use `VITE_` for secrets.
3. Run `npm.cmd run build`, then `npm.cmd run db:check` to verify both connections.
4. Verify the branch target and set `DATABASE_TARGET_CONFIRMED=development`. Run `npm.cmd run db:migrate` and `npm.cmd run db:status`. Never reset a shared/production database.
5. Configure exact comma-separated `SCAN_ALLOWED_HOSTS` without schemes, wildcards or ports. A local intake example is `example.com`; no target HTTP request is made. Empty disables intake.
6. Run `npm.cmd run dev`, or use separate terminals for `dev:api` and `dev:web`. Open `http://127.0.0.1:5173/app/new`.
7. Submit an approved URL, read its queued details, open history, restart the API and reload the job. Jobs remain queued indefinitely until a future worker exists.
8. Run `npm.cmd run verify`, `npm.cmd run format:check`, and `npm.cmd run test:e2e`. For installed Chrome set `$env:PLAYWRIGHT_CHANNEL='chrome'` first.
9. Run `npm.cmd run test:database` for isolated real database tests; add `-- --browser` for the actual browser-to-Neon workflow. The tests use new generated schemas and their own local API/Vite processes, then clean up only their generated schema/processes. They do not stop the user’s servers.

Troubleshooting: use `npm.cmd` if PowerShell blocks npm.ps1; regenerate Prisma if generated sources are missing; build before db:check; check matching URLs/TLS/network if storage fails; configure allowlist and restart API if intake is disabled. API health alone does not establish database readiness. Read-only operation errors withhold connection details. If a run cannot clean up, inspect only its `phase1_test_` schemas in the development branch, never drop public tables as a workaround.

## 9. Issues, Limitations, and Pending Work

- No worker: jobs intentionally remain queued; no target is fetched or audited.
- No authentication, tenant ownership, retention, cancellation, idempotency keys or public deployment hardening. Keep the service local/private.
- Rate-limit counters and lookup capacity are per process. Shared limits are needed before multi-instance/public use. A resolver that never settles retains its bounded slot until process restart.
- Intake DNS checks are not execution-time network isolation. Redirects, subresources, connections and DNS changes must be checked in Phase 2.
- Finding schema is prepared but evidence capture, sanitization, bounded arrays and worker lifecycle/lease policies must be finalized before a worker writes findings.
- Browser/unit fixtures are test-only; they do not substitute for the separate real Neon persistence checks.
- Manual screen-reader, actual browser zoom, forced-colors and disabled-user evaluation are not claimed by automated axe/reflow checks.
- No outstanding Phase 1 application defects were observed in the executed checks. Later-phase limitations above are intentional boundaries.

## 10. Phase Completion Checklist

Mapped to `Phases.md` Phase 1 and the supplied brief:

- [x] Existing architecture and approved visual design preserved; no Docker.
- [x] Scan/Finding models, constraints, indexes and migration history.
- [x] Neon pooled runtime and direct migration connectivity verified.
- [x] POST creates only real queued rows; list/detail return stored jobs.
- [x] Shared schema validation, bounded requests, safe errors and rate limits.
- [x] Configured trusted-host mode and blocked-host/address regression tests.
- [x] Actual persistence across physical API restart and stable pagination.
- [x] Form, recent jobs, history and details connected to API.
- [x] Final browser-to-Neon and complete Phase 0 regression verification.
- [x] Final report, Design/README guidance and Memory.md completed.
- [x] Stop before Phase 2; no scanner, fake findings or authentication introduced.

## 11. Next Phase Handoff

Phase 2 may add a separate native Playwright/axe worker only after explicitly authorized. It must safely claim queued jobs, enforce lifecycle/lease/concurrency/time limits, revalidate stored URLs and approved hosts immediately before execution, enforce network boundaries against redirects/subresources/rebinding and actual connections, and persist genuine results or safe failure codes. Use controlled fixtures with known failures and a clean reference. Keep arbitrary public scanning disabled until those controls are verified; never disable Chromium’s sandbox.

Re-use the Scan/Finding relationship and status vocabulary. Extend the schema with reviewed migrations for worker metadata/leases/evidence as needed, and specify sanitization, quotas and retention before storing rendered content. Do not treat this intake validator as permission to navigate a stored URL without fresh execution checks.

## 12. Security Assessment

Phase 1 is intentionally a restricted local intake service. It treats URLs as untrusted, validates before storage, rejects all literal destinations, enforces exact canonical approval, rejects unsafe/mixed DNS answers and performs no target navigation. DNS capacity, body length, per-IP request frequency, SQL result page size, connections and query times are bounded. Prisma parameterizes application queries; integration-only interpolated schema identifiers are generated internally and checked against a fixed prefix/hex pattern before create/drop.

TLS verification remains enabled; runtime and migration credentials stay server-side. Logs and API/CLI diagnostics suppress connection strings and arbitrary exceptions. Error DTOs whitelist safe fields; stored raw worker text is not exposed. No production test reset or unrelated table cleanup is performed. CORS and UI route separation are not authentication. Public deployment, full SSRF execution safety and WCAG conformance are not claimed.

## 13. Neon Skills Used

The existing installed `.agents/skills/neon/SKILL.md`, `neon-postgres/SKILL.md` and `neon-postgres-branches/SKILL.md` were located and consulted. No skill installation was needed; environment-owned skill files were preserved.

Applied recommendations: use the supplied existing database rather than provisioning a replacement; preserve Prisma; pooled application access/direct migrations; existing `.env` preservation; secure TLS; isolated development branch; migration testing away from production; protect credentials and use safe diagnostics.

The Neon CLI was unavailable and no Neon-specific MCP connector was configured. Direct supplied connections through Prisma/pg were sufficient; no organization enumeration, replacement project, claimable database or branch provisioning was performed. The user created/selected the isolated branch and explicitly confirmed the updated `.env` before any migration or write. No Docker, Next.js rewrite, authentication or deployment was added despite generic skill examples. The skills’ updater was not run because `.agents` is environment-owned/read-only; current official documentation and local pinned declarations were consulted instead.

References used to check implementation decisions: [Neon Prisma integration](https://neon.com/docs/guides/prisma), [Neon pooling](https://neon.com/docs/connect/connection-pooling), [Neon branching](https://neon.com/docs/introduction/branching), [Prisma 7 connections](https://www.prisma.io/docs/orm/v7/prisma-client/setup-and-configuration/databases-connections), [ipaddr.js upstream](https://github.com/whitequark/ipaddr.js), [express-rate-limit configuration](https://express-rate-limit.mintlify.app/reference/configuration), and [Vite environment and modes](https://vite.dev/guide/env-and-mode). Pinned Prisma 7.10.1 declarations and CLI help were checked rather than upgrading to the offered Prisma 8 release candidate.
