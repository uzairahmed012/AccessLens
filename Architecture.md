# AccessLens — Architecture

## Technologies
- Monorepo with npm workspaces, TypeScript strict throughout.
- Web: React, Vite, React Router, Tailwind CSS, shadcn/ui, Motion for React, TanStack Query, Lucide.
- API: Node.js LTS, Express, Zod validation, Prisma, PostgreSQL (managed Neon compatible), pino, helmet, express-rate-limit.
- Scan engine: separate Node worker process using Playwright Chromium and @axe-core/playwright; browser binaries installed locally via `npx playwright install chromium`. No Docker.
- Initial task handling: database-backed scan queue with atomic claim/lease and dedicated worker process; future Redis/BullMQ only after MVP. Never perform long browser scans inside API HTTP handler.
- Tests: Vitest, Supertest, Playwright e2e, dedicated test-site fixtures.

## System workflow
1. Frontend POST /api/scans with URL; API parses and validates input, applies policy/rate limits, writes queued scan to DB.
2. Worker atomically leases queued record, validates hostname and target at the network boundary, boots Chromium with constrained settings, loads allowed page, runs axe, takes screenshot, extracts DOM bounding boxes for resolvable targets.
3. Worker stores normalized findings and screenshot; status and timestamps updated atomically.
4. Frontend polls GET /api/scans/:id with bounded interval while queued/running; displays genuine status/errors.
5. User opens report, selects issue, UI overlays bounding box in screenshot coordinate space; screenshot and viewport metadata ensure scaling is correct.
6. Fix engine maps supported axe rule IDs to reviewed example remediations; never feed raw arbitrary DOM to an AI by default.

## Recommended repository structure
```
accesslens/
  PRD.md  Architecture.md  Rules.md  Phases.md  Design.md
  Memory.md                 # created at first implementation session
  .env.example
  package.json
  apps/
    web/
      src/
        app/ routes/ components/ features/scan/ features/report/
        lib/ styles/ test/
    api/
      src/
        app.ts server.ts
        routes/ controllers/ services/ repositories/
        middleware/ security/ validation/ config/
        workers/ scanner/ fixes/ lib/
      prisma/
        schema.prisma migrations/
      tests/
  packages/
    shared/                  # shared Zod DTOs and TS types
  fixtures/
    inaccessible-site/ accessible-site/
  scripts/
    dev/ verify/
```

## Initial API contract
- POST /api/scans `{url: string}` -> `202 {id, status:"queued"}`.
- GET /api/scans/:id -> scan status, metadata and normalized finding summary (or safe error).
- GET /api/scans/:id/findings?impact=&page=&limit= -> filtered paginated findings.
- GET /api/scans/:id/screenshot -> authorized binary image with proper content type, no filesystem path leaked.
- GET /api/scans?limit=&cursor= -> most recent scans (development mode only; authenticated scope later).
- GET /api/scans/:id/compare/:previousId -> new/resolved/unchanged rule-target counts.
- GET /api/health -> `{status:"ok"}`; optionally `/api/ready` for DB connectivity.
- Typed errors: `VALIDATION_ERROR`, `URL_BLOCKED`, `DNS_UNSAFE`, `SCAN_TIMEOUT`, `NAVIGATION_FAILED`, `SCAN_FAILED`, `NOT_FOUND`, `RATE_LIMITED`.

## Scanning/SSRF implementation guardrails
Security validation must cover initial URL, redirects, DNS, and actual network connections. Plain URL regex, one-time DNS lookup or route interception alone are insufficient against rebinding or Chromium network behaviors. MVP may use allowlisted public test hosts until the engineer can implement and test network-level isolation robustly. Keep scanner disabled for arbitrary external URLs if unverified.
- Only http/https (prefer https); allow port 443/80 only in public mode.
- Forbid private/local/reserved IPs, IPv4-mapped IPv6, encoded forms, localhost aliases, URL credentials, alternate schemes and browser file access.
- Reject navigation and subresources to forbidden destinations, including redirects and service workers; set hard timeouts/limits.
- Browser runs with unprivileged permissions; never pass --no-sandbox in production; do not disable browser sandbox to simplify setup.
- Provide a special explicit test-only environment for localhost fixtures, never exposed to public API.

## Data, privacy and retention
- Prisma migrations checked into repository. Indices for scan status+createdAt, scanId+impact, scanId+ruleId. Scan writes idempotent via worker lease token.
- HTML evidence sanitized on ingestion/render; never use `dangerouslySetInnerHTML` with scanned content.
- Screenshots stored outside web server public directory; use controlled routes for access. Add retention/cleanup policy.
- Cap stored HTML/selector size, result counts, screenshot resolution and scans per client.

## Local setup (NO DOCKER)
- Node.js LTS and npm installed natively.
- PostgreSQL via Neon managed instance (DATABASE_URL) so no local server setup required; never commit credentials.
- Install browser locally using `npx playwright install chromium`.
- `npm install`, `npm run dev:web`, `npm run dev:api`, `npm run dev:worker` (scripts to implement), `npm test`.
- If managed DB connection unavailable, clearly report blocker; don't silently fake persistence. Unit tests can use mocks; integration tests should use a real isolated test DB.
