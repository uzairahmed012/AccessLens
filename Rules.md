# AccessLens — Non-negotiable Codex Rules

1. Read PRD, Architecture, Phases and Design before implementing a phase. Follow current phase only, and inspect existing files before editing.
2. **No Docker**: no Dockerfile/compose/containers or dependency on Docker for dev, testing or deployment instructions. React, API, worker run natively; Neon managed PostgreSQL is supported.
3. Use strict TypeScript, Zod request validation, Prisma migrations, server-side pagination, typed errors and structured redacted logs. Secrets only from environment variables; `.env.example` must contain placeholders.
4. Never call a user's submitted URL directly from the API process. Only a constrained worker may navigate; block SSRF and redirect/DNS rebinding bypasses. If network-level protections cannot be proven, implement restricted allowlist mode before enabling public external scans.
5. Never disable Chromium sandbox for convenience in an internet-facing scanner. Explicitly document local OS prerequisites and fail safely if browser fails.
6. Bound concurrency, requests, redirects, bytes, time and storage. Rate-limit submissions. Restrict browser download and data exfiltration paths. Scanners must not access internal services.
7. Always distinguish axe violations, passes, incomplete/manual-review and inapplicable checks. Do not invent "WCAG compliance score" or guarantee compliance.
8. All issue evidence (selectors/HTML), suggested code and URL strings are untrusted. Escape text in UI; do not execute scan content or unsafe HTML. Do not send sensitive HTML to LLMs by default.
9. AI-generated fixes are opt-in, advisory, and require developer review; no automatic edits to external sites, no fabricated source locations or generated patches based solely on rendered HTML.
10. Follow UI accessibility practices within AccessLens itself: semantic labels, visible focus, keyboard support, adequate contrast, reduced motion, high-contrast issue markers beyond color alone.
11. Do not fabricate scan progress, backend responses, database records, working integrations, or test results. Demo data must be clearly tagged as demo and not mixed with live reports.
12. Keep feature modules small and cohesive; reuse shared types. Avoid unrelated frameworks or dependency bloat. Pin versions using lockfile and evaluate compatibility.
13. For each phase: run available tests, lint, typecheck; summarize exact commands and results. Never claim unexecuted tests pass.
14. `Memory.md` is created only once implementation starts. Update it with real progress, decisions, blockers, commands and exact next action at end of each session.
15. Do not advance to the next phase automatically. Document unresolved issues in Memory.md. Preserve user's no-Docker preference.
