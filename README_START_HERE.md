# AccessLens — Codex Starter Pack

## Goal
Build an actual accessibility scanner using browser automation, real reports and guided fixes. Not a static UI clone. This pack is scoped for phased implementation and no Docker.

## Start
1. Create an empty `accesslens` folder; copy these six Markdown files into its root.
2. Open the folder in Codex.
3. Paste `FIRST_CODEX_PROMPT.md` as the first task.
4. Have Codex finish Phase 0 and verify commands before requesting Phase 1.
5. `Memory.md` must be created by the coding agent after it starts actual coding and updated at end of every session.

## Local development approach
Use Node.js LTS and npm installed normally. PostgreSQL can be hosted in Neon; this requires an account and DATABASE_URL in local .env. Browser automation later requires locally installed Chromium via Playwright. No Docker image needed for DB.

## Key technical references
- https://www.w3.org/TR/WCAG22/
- https://playwright.dev/docs/accessibility-testing
- https://github.com/dequelabs/axe-core

## Critical product caveat
Automatic checks do not establish WCAG conformance. A public URL scanner can be dangerous without network isolation; until SSRF defenses have been properly implemented and tested, keep scans on a restricted allowlist of safe hosts.
