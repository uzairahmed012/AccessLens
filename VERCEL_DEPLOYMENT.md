# Deploy AccessLens on Vercel

Use one Vercel project with the **Services** preset (currently Beta). Repository root: `./`. Both `apps/web` (Vite) and `apps/api` (Express) stay in the existing monorepo. No Docker is used.

## 1. Publish the deployment configuration

Commit/push the root `vercel.json`, `apps/api/src/vercel.ts`, and documentation changes to GitHub. Then return to the import screen and refresh detection using the circular-arrow button next to Copy prompt. Keep both services; do not choose Import single project.

## 2. Add environment variables

Enter these privately in the Vercel Environment Variables form. For the Phase 1 demo, use an isolated Neon development/test branch that already has the Phase 1 migration applied.

| Name                 | Value                                             |
| -------------------- | ------------------------------------------------- |
| `DATABASE_URL`       | Neon pooled URL with TLS                          |
| `DIRECT_URL`         | Matching Neon direct URL with TLS                 |
| `NODE_ENV`           | `production`                                      |
| `SCAN_ALLOWED_HOSTS` | `example.com`, or exact approved public hostnames |
| `LOG_LEVEL`          | `info`                                            |

Choose the deployment environments that should receive each value. Use separate database branches for Production and Preview if they need separate data. Vercel's Production environment describes deployment traffic; it does not automatically make a development database production-ready.

`CORS_ORIGINS` is optional on Vercel: the new API entrypoint trusts the exact platform-provided deployment and primary production origins. For extra custom aliases, set a comma-separated list of their exact HTTPS origins. No wildcard Vercel domain is trusted.

Do not import the entire local `.env`: `HOST`, `PORT`, `API_PROXY_TARGET`, and `DATABASE_TARGET_CONFIRMED` are local configuration. Never use `VITE_` names for database credentials. No migration is part of installation or deployment builds.

## 3. Deploy and check

Click Deploy once Vercel recognizes the root configuration. Check:

- `/`: public landing page.
- `/app/history`: direct navigation and page refresh work.
- `/api/health`: returns exactly `{ "status": "ok" }`.
- `/app/new`: an approved URL saves a queued job, opens its details and appears in history.
- A missing `/api/...` route returns an API error instead of the frontend HTML.

Jobs remain queued. There is no scanner worker, findings generation or authentication in Phase 1. Keep this a demo with isolated data; in-memory limits are per function instance and are not distributed production rate limits.

## If installation reports `tsc: command not found`

Make sure the deployed commit contains the updated `installCommand` for both services, including `--workspaces --include-workspace-root`. TypeScript is a root development dependency and must be installed before the root `prepare` hook builds the shared package. Push the fix to `main`; check the new deployment uses the new commit. If manually retrying, redeploy the latest commit without the previous build cache. The npm `cache-dir` warning alone does not cause this failure.

## Configuration details

Both service install commands explicitly select all workspaces and include the repository root (`npm ci --include=dev --workspaces --include-workspace-root`). This installs root build tools such as TypeScript even when npm is invoked from a service workspace. The shared workspace is built before either consumer; the API build explicitly regenerates Prisma so cached dependencies do not leave a stale generated client.

Top-level rewrites give `/api` and `/api/*` to the API before the frontend catch-all. The full request path is preserved, matching existing Express routes. The frontend has a service-scoped SPA fallback to `/index.html`; assets remain framework-managed. The API exports an Express app for Vercel without starting a listener. Native development continues to use `src/server.ts`.

`.env`, generated outputs and `.vercel/` metadata are ignored. Secrets belong only in Vercel settings. The database stays on Neon and is not uploaded with the repository.

References: [Vercel Services](https://vercel.com/docs/services), [service configuration](https://vercel.com/docs/services/config-reference), [routing](https://vercel.com/docs/services/routing), [environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables).
