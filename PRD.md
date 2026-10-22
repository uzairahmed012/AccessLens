# AccessLens — Product Requirements Document

## 1. Product goal
AccessLens is a developer-facing web accessibility auditing application. A user submits an authorized website URL, launches an automated browser scan, inspects WCAG-related findings, locates affected elements visually, sees actionable repair guidance, and compares scans after implementing fixes.

**Product promise:** Scan. Understand. Fix. Do not claim certification or guaranteed WCAG compliance.

## 2. Users
- Freelance frontend developers auditing their own sites.
- Frontend teams checking pages before release.
- QA engineers tracking recurring a11y defects.
- Agencies providing clients with evidence-based reports.

## 3. Core user journeys
1. User enters an HTTPS URL, sees validation, runs a scan, and watches real scan progress.
2. User opens scan results grouped by impact (critical/serious/moderate/minor), rule, and element; views help links, selectors and sanitized HTML evidence.
3. User sees a screenshot with bounding boxes on detected affected DOM nodes when coordinates are available; can click an issue to focus the box and vice versa.
4. User sees deterministic, curated fix recommendations with before/after code examples for supported rules, and copies them.
5. User rescans the same page, compares rule occurrences between two runs, and exports a report.

## 4. MVP in scope
- Homepage/landing page; URL scanner form; scan detail page; recent scans list.
- URL validation, rate limiting, single-page browser scan.
- Playwright Chromium navigation with configurable bounded timeout; @axe-core/playwright results.
- Capture desktop screenshot; bounding rectangles for resolvable DOM targets; show "element not locatable" fallback where needed.
- Store scan status, sanitized issue details, screenshot reference, scan timing, error category in PostgreSQL.
- Findings filters and severity chips; WCAG tag display; links to authoritative help.
- Curated fixes for common rules: image-alt, label, button-name, link-name, color-contrast, aria-valid-attr. Show honest manual instructions for unsupported rules.
- Scan comparison and export JSON; printable HTML report later.
- Light/dark design, loading/empty/error states, keyboard accessible app UI.
- Minimal anonymous/development user flow in initial phases. Auth and accounts are post-MVP.

## 5. Out of scope for MVP
- Arbitrary authentication/session injection into scanned sites; crawling entire domains; automated source-code rewriting; auto-commit PRs; billing; scheduled scans; compliance certification; browser extension.
- Generative AI fixes until rule-based suggestions and security are proven.
- Running untrusted user JavaScript or arbitrary remote scripts outside the sandboxed browser.

## 6. Data model (conceptual)
- Scan: id, normalizedUrl, status (queued/running/completed/failed), startedAt, finishedAt, checkedAt, durationMs, totalViolations, totalAffectedNodes, errorCode, screenshotPath, viewport, engineVersion.
- Finding: id, scanId, ruleId, impact, description, help, helpUrl, wcagTags[], targetSelectors[], sanitizedHtml, failureSummary, boundingBox?; can store one record per affected node for highlighting.
- ScanComparison: derived from two scans, with rule+target fingerprint to label new/resolved/remaining; acknowledge selectors may drift.

## 7. Security, privacy and product limitations
- Scanning a user-provided URL creates SSRF risk. Before *any* navigation, reject localhost, link-local, private, reserved, multicast, and metadata IP addresses; reject non-HTTP(S), URL credentials, nonstandard ports, IP literal destinations initially, DNS names resolving to prohibited IPs, and redirects to prohibited targets. DNS rebinding mitigation must be fail-closed at connection time; if robust enforcement is not possible, restrict MVP to allowlisted demo hosts only.
- Restrict requests, redirects, time, bandwidth, concurrency, pages and browser process permissions. Isolate browser workers; no arbitrary file downloads or local filesystem reads. No website login credentials collected.
- Do not disclose page source, screenshot or issue evidence publicly without explicit design for authorization. Redact secrets in logs.
- Do not treat automated output as full WCAG conformance evaluation. Manual checks remain essential; no fake percentage of "compliance."
- Allow only publicly accessible pages with permission to test; respect usage limits and avoid aggressive crawling.

## 8. Acceptance criteria for first usable release
- An allowed demo fixture site with intentional violations produces verified axe rule findings and at least one highlighted element.
- An accessible fixture yields no detected violations for the subset tested (not "fully compliant").
- Invalid, denied, internal/private, redirected-to-private, timed-out, and unreachable URLs return safe readable failure statuses; scanners cannot reach internal services.
- Results persist and survive API restart; reloading the report renders from database.
- User can filter findings, open fix instructions, and run another scan.
- Automated backend tests, scanner integration tests against local test fixtures under explicitly trusted test-only mode, UI tests, typecheck and lint pass.

## 9. Success metrics
- Allowed scan success rate; median scan duration; actionable finding ratio; highlight location coverage; repeat-scan comparison accuracy on fixtures; scanner security test pass rate.

## 10. Source standards
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Playwright a11y guide: https://playwright.dev/docs/accessibility-testing
- axe-core rules: https://github.com/dequelabs/axe-core
