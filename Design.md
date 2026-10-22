# AccessLens — Design System

## Design goal

Make the product understandable at the public homepage, then provide a focused, consistent development workspace. The current refinement below takes precedence over historical directions later in this document.

## Phase 0 refinement — landscape inspector and graphite/cobalt palette

The user's screenshot shows the audit preview taking too much vertical space beside the hero. Replace the tall inspector with a landscape composition: compact title bar, combined URL/results toolbar, compact finding rail, and selected-finding context beside the tabbed element/fix panel. Keep the text readable and let expanded help/code grow naturally. Desktop gives more width to the preview; tablet uses the available full width; phones stack the same information without horizontal page scrolling. Do not hide content or use a fixed-height clipping container to make the preview shorter.

The updated color direction is **graphite + cobalt**: near-neutral charcoal rather than navy surfaces, warm off-white light mode, and a single blue action/focus accent. This gives severity colors their own meaning and separates content from actions. UI UX Pro Max's developer-tool, documentation palette and minimalism searches were consulted again; neutral hierarchy and link-blue informed this project-specific palette, rather than adopting the suggested green status/action accent. This section supersedes the earlier teal palette.

Section anchor targets retain programmatic focus after navigation but do not draw a full-section outline. Keep visible focus rings on interactive links, buttons, inputs and tabs.

| Role | Light | Dark |
| --- | --- | --- |
| Canvas / card / secondary surface | #F7F7F5 / #FFFFFF / #EEEFF3 | #101114 / #191B20 / #24272F |
| Text / secondary text | #22242C / #5F6470 | #F0F1F5 / #A9AEBB |
| Action / hover / on-action | #3D52D5 / #3042B2 / #FFFFFF | #A5B4FF / #C3CDFF / #15172B |
| Border / input border | #DDDFE6 / #8E94A3 | #343740 / #626978 |
| Selected surface / border | #EEF0FF / #C6CDF5 | #252B46 / #536096 |

Preview labels use neutral surfaces rather than amber. Red/amber remain reserved for finding severity; success stays green. Use the shared tokens across marketing and app, preserve visible focus and reduced-motion support, and verify actual contrast in both themes. No architecture, feature-phase, authentication, scanner, or Docker changes.

## Phase 0 — UI/UX Redesign and Design System Upgrade

This refinement uses actual UI UX Pro Max research persisted at `design-system/accesslens/MASTER.md`, with research provenance and page overrides alongside it. These choices supersede earlier styling where they conflict; no architecture change or Docker.

Audit: the centered hero delays the product, the storefront distracts from auditing, much metadata is too small, the six capabilities/four-step workflow are incomplete, motion is almost absent, and reusable dialog/tab/feedback/future-page patterns are missing.

Direction: **Signal & Structure**—compact editorial hero, audit-focused illustration, readable typography, layered surfaces and precise controls. Use Plus Jakarta Sans 600–700 for display/page titles; Inter 400–600 for body/UI; JetBrains Mono for code. Marketing body 16px/1.65; app 14–16px; labels ≥12px; display 40–64px and app titles 30–36px. Balanced headings, wrapping URLs, 4/8/12/16/24/32/48/64px spacing, 14px cards, 9–10px controls.

| Semantic role | Light | Dark |
| --- | --- | --- |
| Brand / hover | #126B86 / #0B526A | #53BDD3 / #7BCEDE |
| Secondary / text | #172334 | #EBF2FA |
| Accent / on-accent | #F5DEAA / #76500B | #3C301C / #F5DEAA |
| Canvas / surface / raised | #F6F8FB / #FFFFFF / #EDF4F7 | #0D1420 / #151E2D / #1C3040 |
| Muted text | #526277 | #A5B5C7 |
| Border / input | #DDE5EE / #98A8BA | #2A3A4B / #6C8098 |
| Critical text / background | #AB2940 / #FFF0F2 | #FFB3BF / #3A202A |
| Serious text / background | #955014 / #FFF4E9 | #FFD0A3 / #382B1F |
| Moderate text / background | #77600A / #FBF6DD | #E7D38C / #332F1E |
| Minor text / background | #246B83 / #EDF7FB | #A8DCEE / #1C303D |

Map primitive values to semantic CSS variables and component styles. Every severity has a label/icon. Focus uses a 3px brand ring plus offset; measure contrast in both themes rather than claiming conformance from token values.

Motion: feedback 120ms, page/content 160ms, dialog enter 180ms/exit 120ms, one-time section 220ms, stagger 40ms. Use `motion/react`, transform/opacity, immediate state updates, and reduced-motion final states without delay. No parallax, fake progress, count-up KPIs, animated dimensions or perpetual decoration.

Shared primitives cover buttons, cards, inputs, dialogs, tabs, tables, tooltips, empty states, notifications, skeletons, status, findings and code. Radix handles dialog/tab focus and keyboard behavior. The public site makes no API calls. `/app` remains a labeled local preview; future routes use explanatory empty states. Theme selection and copying example code are real local interactions, not scanner functionality.

Implementation map: semantic tokens live in `styles/tokens.css`, reusable component rules in `styles/ui.css`, the app refinements in `styles/workspace.css`, and the public composition in `styles/marketing.css`. The existing Tailwind theme maps the semantic tokens to utility classes. Fonts are installed packages and served locally by Vite. Link resets belong in the base CSS layer so button utilities retain their intended contrast.

The public hero pairs the product story with a selectable audit concept. The Element tab highlights the illustrative image, button, or link; Suggested fix shows original and proposed markup. All displayed results are explicitly illustrative. Six editorial feature blocks avoid repeating large promotional cards. Four steps distinguish the future audit loop from functionality available today. The accessibility section explains WCAG and the limits of automation.

Workspace routes: `/app` overview, `/app/new` disabled scan setup, `/app/history` semantic empty table, `/app/findings` tabs for findings/element inspection/fix guidance, `/app/scans/:scanId` empty report layout, `/app/workspace` appearance and connections tabs, `/app/guide` development documentation. Mobile keeps three primary links and uses a focus-managed navigation dialog for the rest. Settings remain at the compatibility workspace URL. No fake scan-detail record is linked from history.

Motion implementation: `LazyMotion` with `domAnimation`, `MotionConfig reducedMotion="user"`, and shared helpers in `lib/motion.tsx`. Essential marketing text stays visible during one-time transform reveals. Details and tabs enter over 160ms; semantic selection changes immediately. Dialogs enter over 180ms and exit over 120ms. Loading opacity motion only appears during the real API request. Notifications persist until dismissed. `useReducedMotion` removes opacity durations and delays as well as transform motion. Read [Motion accessibility guidance](https://motion.dev/docs/react-accessibility) when extending this system.

Controls have at least 44px targets; small metadata is at least 12px. Dialog Escape returns focus to the trigger; navigation from a dialog lets the destination main content own focus. Tables retain semantics and an independently focusable horizontal scroll region. Color supplements visible labels and severity icons. Automated axe checks and browser reflow tests are verification tools, not a claim of full WCAG conformance.

Empty-state headings use h2 when a page has no intervening section heading. Keep table empty-state explanations outside the horizontal scroll region so the full message wraps on phones. The app shell is lazy-loaded independently of the public site; the verified main JS chunk is 383.90 kB (123.43 kB gzip), without a build-size warning.

## Original design direction
A visually memorable, high-trust developer tool inspired by code editors and best-in-class technical observability dashboards, not a generic marketing template. The issue inspector is the hero feature.

## Visual concept
"Precision audit": charcoal/slate typography, icy neutral backgrounds, deep navy/teal accent, restrained coral severity markers; confident data density, disciplined 8px spacing. No purple gradient overload, no glassmorphism covering text.

## Tokens
- Light: background #F6F8FB, surface #FFFFFF, foreground #172334, muted #66758B, border #E1E7EF, primary #126B86, primary-hover #0B526A.
- Dark: background #0D1420, surface #151E2D, foreground #EBF2FA, muted #97A9BC, border #2A3A4B, primary #53BDD3.
- Status: critical #C83F53, serious #DB7A27, moderate #BF981C, minor #3E8EAD. Pair labels/icons with colors, not color alone; validate contrast.
- Fonts: Inter or Geist for UI; JetBrains Mono for code snippets / selectors. Fonts via normal package/web delivery, do not embed redistributed font files.
- Radius: cards 14px; buttons 9px; inputs 10px. Shadow low-elevation, precise 1px borders.

## Primary screens
1. Dashboard: a hero "Scan a website" URL form, recent scans, issue distribution mini-chart, recent improvements and manual-review reminder.
2. Active scan: scanner lifecycle with honest status text (queued/browser starting/analyzing/storing), progress not invented as fake percentages, cancel only if backend supports it.
3. Report: summary header (URL, timestamp, affected nodes, rules, engine version), severity filter, findings list; split view screenshot and issue inspection details on desktop, tab switcher on mobile.
4. Issue inspector: screenshot with selectable outlined node overlay; rule name, severity, exact selector, sanitized HTML code block, failure rationale, WCAG reference, human-reviewed fix, copy buttons.
5. Scan comparison: before/after totals, new/resolved/still-present categories with caveat for changing selectors.
6. Settings later: retention, scan limits, access controls.

## Interaction specification
- Use Motion for React (`motion/react`) for modest page transitions, drawer entrances and expandable findings, 140–220ms. Respect `prefers-reduced-motion` and never animate the screenshot highlight in a distracting way.
- Kanban is not relevant; no pointless charts. Prefer excellent tables, issue cards and precise annotation overlays.
- Complete responsive behavior at 360px, 768px and desktop. Support keyboard navigation through issue cards and highlighted elements with visible focus.
- Skeleton loaders for real async fetches; errors state reason and retry if safe; clear empty state "No automated issues found" with caveat about manual testing.
- Light/dark support through CSS variables, no hardcoded component theme overrides.

## Component inventory
AppShell, Header, ThemeToggle, ScanUrlForm, ScanStatus, ScanHistoryTable, SeverityBadge, WCAGTag, FindingList, FindingDetails, ScreenshotViewer, HighlightOverlay, FixCodeDiff, ComparisonPanel, ErrorNotice, EmptyState, CopyButton.

## UI acceptance
- All forms have programmatic labels and descriptions; meaningful heading order; focus trapping in dialogs; accessible to keyboard users; contrast tested; no inaccessible color-only status; data stays readable at 200% zoom.
- Keep screenshots and issue data real, not fabricated demos except explicitly labeled fixture showcase.

## Phase 0 redesign — public site and application separation

The user's redesign instruction supersedes the original dashboard-first homepage. The public root `/` is a product website; the sidebar and development workspace belong under `/app`. Keep the existing stack and no-Docker restriction.

- Public story: navbar, large typography-led hero, clearly labeled interactive concept preview, audience strip, feature bento, three-step workflow, WCAG/accessibility value section, final CTA and footer. Explain the product and its development status; do not invent customers, results, adoption figures or certifications.
- Direction: keep the navy/teal identity with generous section spacing, 33–82px responsive hero typography, precise cards and restrained radial glows. A dark workflow section creates hierarchy; other surfaces and text follow shared theme variables.
- Product visual: use HTML/CSS and React state; keep examples distinct from real findings and render code as text. No scan endpoint or remediation engine is introduced by the marketing illustration.
- Application: readable typography, focused overview, disabled scan form, useful empty states, persistent preview notice and an app-only health query. Keep navigation back to the public site available at every breakpoint.
- Authentication: the user explicitly selected a local preview. Do not add fake login, fake accounts, client-only protection or imply `/app` is authenticated. Reserve the route/layout boundary for future real authentication and server-side ownership enforcement.
- Accessibility: native mobile disclosure button with Escape dismissal/focus restoration, real section anchors, keyboard-operable example buttons with pressed state, reduced motion, shared light/dark preference and no overflow at 360px, 768px or desktop. Check 320px and zoom-equivalent reflow too.
## Phase 1 — real queued-job interactions (2026-10-22)

Keep the approved graphite/cobalt identity, landscape marketing inspector, typography, tokens and Motion system. This phase changes functionality within the existing layouts.

- The app form creates a persisted **queued job**; its button says “Create scan job” and “Saving job…” while pending. It never implies that an accessibility audit has begun.
- Keep the URL field labeled, preserve input after rejection, connect inline errors through `aria-describedby`/`aria-invalid`, announce pending and failure states, and prevent duplicate submission.
- Recent jobs and history read actual API records. Use the existing semantic table with a keyboard-accessible scroll region, wrapped URLs, visible text status, retryable failures, a useful empty state and a cursor-based Load more action.
- Job details display actual metadata and explicitly explain that queued jobs await a future engine. No fabricated scores, findings, completion progress or authentication.
- Public `/` remains independent of API requests; `/app/*` remains the clearly labeled local preview with authentication deferred. All historical Phase 0 specifications below remain context; disabled-form statements are superseded by this Phase 1 behavior.

