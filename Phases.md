# AccessLens — Incremental Implementation Phases

## Phase 0 — Monorepo, design foundation and runnable shell
- Inspect repository and local environment.
- Create npm-workspaces monorepo, React/Vite app, Express API, shared types, lint/typecheck/test tooling, `.env.example`, scripts, optional Neon Prisma connection configuration.
- Set up Tailwind, shadcn/ui, Motion, theme, accessible app shell, scan form **UI-only and clearly disabled/nonfunctional until API exists**.
- GET /api/health; backend and frontend start without Docker.
- Create Memory.md only after coding starts; document verified commands.
- Gate: npm install, typecheck, lint, basic unit tests, web/API start success. Stop.

## Phase 1 — Persisted scans and safe URL intake
- Prisma Scan/Finding models and migrations; Neon connectivity.
- POST /api/scans creates queued record, GET status/list routes, schema validation, rate limits, trusted host allowlist mode.
- Gate: validation and persistence tests, safe blocked-host tests; stop.

## Phase 2 — Real axe-core scanner worker
- Separate worker; Playwright Chromium and axe; bounded timeout; proper lifecycle and scan errors.
- SSRF mitigation tests including redirects, DNS changes and all forbidden network classes before arbitrary public URLs.
- Fixture site with known failures and clean reference, network boundary controls, database state persistence.
- Gate: fixtures produce expected violations; deliberately malicious targets blocked; stop.

## Phase 3 — Results dashboard
- Functional new scan form, real progress polling, filters, issue detail drawer, actionable evidence and rule help URLs.
- No fake compliance percentages. Display incomplete/manual review.
- Gate: UI tests + backend contract tests; stop.

## Phase 4 — Screenshot + element locator
- Capture bounded screenshot and viewport; resolve selectors safely; store rect coords and fallback if missing.
- Overlay clicked issue bounding box on scaled screenshot; keyboard operable.
- Gate: fixture matching of bounding rect and screenshot; stop.

## Phase 5 — Remediation guidance
- Curated before/after fix snippets for selected rules, copy button, caveats, trusted links.
- Unsupported rules show honest general guidance. Optional AI integration behind explicit opt-in and privacy warning, not required for completion.
- Gate: fix mapping snapshot/unit tests and UI tests; stop.

## Phase 6 — History, comparison and exports
- Re-scan history; fingerprint findings; new/resolved/still-present comparison (with selector drift warnings); JSON export and accessible print stylesheet.
- Gate: controlled fixture change creates expected delta; stop.

## Phase 7 — Hardening and portfolio launch
- Auth and user/project ownership if making public multi-user SaaS; otherwise keep external scan service in allowlist/demo mode.
- Security review, input limits, storage retention, worker resilience, observability, documentation, privacy notices, deployment without Docker, accessibility QA on AccessLens itself.
- Gate: end-to-end smoke, security regressions, a11y tests and deploy readiness; stop.

## Session discipline
Implement one phase per Codex instruction. At phase end: report files changed, commands run/results, acceptance checklist, blockers, next exact phase prompt, and Memory.md update. Never quietly skip gates.
