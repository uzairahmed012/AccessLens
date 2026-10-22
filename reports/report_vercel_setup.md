# AccessLens — Vercel Services setup

Date: 2026-10-23 (Asia/Karachi).

Status: **Local configuration checks PASS. Cloud deployment and cloud database connectivity PENDING user import/deployment.** This is deployment preparation for the existing Phase 1 app, not Phase 2 implementation or production-hardening completion.

## Implemented

- Root `vercel.json` uses current `services` configuration, with Vite at `/` and Express owning `/api` and `/api/*`. Services is currently Beta; select the Services preset and repository root `./` in Vercel.
- Service-scoped SPA rewrite preserves direct navigation/refresh on `/app/*`, with API routes selected before the frontend catch-all.
- `apps/api/src/vercel.ts` exports the existing Express application without starting a listener. Native development still uses `server.ts`.
- Exact platform-provided deployment/production origins are allowed alongside explicitly configured CORS origins. Other Vercel projects are not implicitly trusted.
- Each workspace has a `build:vercel` command. Shared contracts build before consumers; the API explicitly regenerates Prisma. `npm ci --include=dev --workspaces --include-workspace-root` explicitly installs workspace dependencies and root build tools even when invoked from a service directory with NODE_ENV set to production. No database migration is included.
- `.vercel/` metadata ignored; no credentials were changed or added to source. Added `VERCEL_DEPLOYMENT.md`, README instructions and Memory context.
- Added seven entrypoint regression cases. Missing database configuration is explicit in the tests; no database connection or submitted-site navigation occurs.

## Verification

- Current official Vercel configuration schema: PASS. The downloaded schema declares draft-04 but uses a numeric exclusiveMinimum in unrelated trigger definitions; validation used draft-07 metadata compatibility without changing configuration rules.
- Existing root production build: PASS; frontend main chunk remains 379.76 kB.
- Exact API service command `npm run build:vercel --workspace @accesslens/api`: PASS, including Prisma generation, shared build and API compilation.
- Exact web service command `npm run build:vercel --workspace @accesslens/web`: PASS.
- Compiled Vercel entrypoint imported without mocking: PASS, six HTTP/CORS checks covering health, three allowed origins, rejected unrelated origin and missing-storage 503. Database credentials explicitly disabled in this check.
- API unit suite: **115/115 PASS**, including seven new entrypoint cases. The new missing-storage unit fixture mocks database construction so it does not pay the unused Prisma runtime compilation cost; real compiled import is checked separately.
- Typecheck: PASS. ESLint: PASS. Formatting for all changed files: PASS. `git diff --check`: PASS.
- No Vercel account token, project link, remote build or deployment was used. User must publish the configuration, refresh the import screen, enter private variables and deploy before cloud results can be claimed.

## Issues resolved

Renaming the repository left three local npm workspace junctions pointing to the old `AccessLens_Codex_Starter` path. An offline npm install repaired the junctions without dependency upgrades; the lockfile has no dependency change. The first unit hook timed out while compiling an unused Prisma import; isolating storage in the missing-configuration unit fixture and separately checking compiled production imports resolved that harness problem without increasing timeouts.

## Next actions

Follow `VERCEL_DEPLOYMENT.md`: push the configuration commit to `main`, refresh the current Vercel import screen, keep Services/root `./`, add DATABASE_URL, DIRECT_URL, NODE_ENV=production, SCAN_ALLOWED_HOSTS and LOG_LEVEL privately, then deploy. Exact Vercel deployment/primary-production origins are automatic; CORS_ORIGINS is optional for additional aliases.

Use isolated Phase 1 demo data. Preview and Production should use separate branches when data isolation is needed. Jobs remain queued; no authentication, worker, real findings, distributed rate-limit store or production ownership controls are introduced here. Verify `/api/health`, `/app/history`, `/app/new` and SPA refresh after deployment. No Docker is used.

References: [Services](https://vercel.com/docs/services), [service configuration](https://vercel.com/docs/services/config-reference), [routing](https://vercel.com/docs/services/routing), [system variables](https://vercel.com/docs/environment-variables/system-environment-variables).

## Deployment failure follow-up — 2026-10-23

The first cloud deployment of commit `62933ed` reached root `prepare` and failed building the shared package: `sh: line 1: tsc: command not found` (exit 127). The preceding npm `cache-dir` warning was not the fatal error. TypeScript is declared in root devDependencies, but npm invoked in a workspace can filter the installation to that workspace and omit root tools. Earlier successful local builds used an existing dependency tree and did not test this condition.

Both services now install with `npm ci --include=dev --workspaces --include-workspace-root`. This selects all workspace dependencies and the root build dependencies before the existing prepare hook. No package versions, lockfile, secrets, application features or migrations changed.

Verification: a minimal isolated monorepo outside the project, using Node 24.22.0/npm 11.6.2 and a root-only TypeScript dependency, reproduced the missing executable with the old service-directory command. Repeating the installation with the corrected flags passed and ran TypeScript 5.9.3. The first diagnostic copy inside the repository could inherit ancestor executables and was unsuitable for proving isolation; its full installation was stopped. A full clean AccessLens installation or cloud build is not claimed as verified by this reproduction.

Additional local verification: both exact service build commands passed again: `npm run build:vercel --workspace @accesslens/api` (Prisma generation, shared build and API compilation) and `npm run build:vercel --workspace @accesslens/web` (shared build and Vite production bundle). Changed-file Prettier checks and `git diff --check` passed. Unit/browser suites were not rerun because this patch only changes install configuration and documentation.

Publish the fix to `main`, inspect the new deployment's commit and updated install command, and recheck the existing deployment smoke checklist. If manually retrying, select the latest commit and disable the previous build cache. Cloud deployment is still pending verification.

Reference: [npm workspace-root inclusion](https://docs.npmjs.com/cli/v11/commands/npm-ci/#include-workspace-root).

## Prisma preparation failure follow-up — 2026-10-23

The next cloud log confirms shared `tsc` succeeds, followed by `db:generate` failing in root `prepare` during the web service installation. The wrapper withheld the original exception, so the precise internal cloud cause is not established. The generic message is not evidence of incorrect database credentials. No cloud database connection was verified.

Root `prepare` now invokes a small native Node script. When VERCEL=1, it defers work to the existing service build commands: web builds shared/Vite; API generates Prisma and compiles shared/API. Local npm preparation retains the previous shared build followed by generation and stops on a failing step. Dependency install scripts remain enabled; no broad `--ignore-scripts` workaround, dependency upgrade, schema change, migration or credentials change was introduced.

The Prisma wrapper now prints fixed safe tooling/OS error codes, numeric exit status and Prisma P-codes when available. It continues to withhold raw CLI output and exception text that could contain connection details. Six focused redaction/diagnostic tests were added to root `npm test` through `test:tools`.

Verification completed:

- Dependency-free temporary copy outside the project: Vercel preparation exits 0 with no .env, TypeScript or Prisma available.
- Missing-Prisma temporary fixture: generation exits 1 with safe MODULE_NOT_FOUND guidance, no raw stack/connection diagnostics.
- Local `npm run prepare` with DATABASE_URL and DIRECT_URL explicitly disabled: PASS, shared compilation and Prisma generation.
- Both exact `build:vercel` service commands with VERCEL=1, NODE_ENV=production and database credentials disabled: PASS. Frontend main JS remains 379.76 kB.
- Six redaction tests: PASS. Changed-script ESLint: PASS.

Final verification: root `npm test` PASS: 115 API + 14 web + 2 shared + 6 tooling = **137 tests**. Changed-file Prettier and `git diff --check` PASS. No browser or live database suites were rerun for this build-lifecycle patch. Cloud deployment remains pending: publish the fix, ensure the new prepare deferral appears in install logs, then check the API service generation/build and deployed routes. No scanner, auth, Docker or database writes were added.
