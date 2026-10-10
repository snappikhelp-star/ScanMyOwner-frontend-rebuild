# ScanMyOwner

A frontend demonstration of a vehicle QR contact tag that lets people preview contacting a vehicle owner privately.

## Run & Operate

- Start `artifacts/scanmyowner: web` in Replit Workflows — runs the website at `/`.
- Start `artifacts/api-server: API Server` — runs the API at `/api`.
- These managed workflows supply `PORT` and `BASE_PATH`; do not run the frontend dev command without them.
- The imported Canvas workflow is optional and is not needed to run the website.
- `pnpm install --frozen-lockfile` — install the existing workspace dependencies.
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `curl http://localhost:80/api/healthz` — API health check; expected response: `{"status":"ok"}`.
- No additional secrets or external services are required to run the current demo.
- The website does not initialize the unused browser Supabase client at startup. Database-backed QR lookup and activation require the API's Supabase configuration; they are not needed to load the marketing site.
- If an imported workflow reports `vite: not found` or missing `esbuild`, restore dependencies with `pnpm install --frozen-lockfile`, then restart the managed workflows.
- The unused database library requires `DATABASE_URL` if database-backed features are added later. No database was provisioned or migrated during import setup.

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- Frontend: React 19, Vite 7, Tailwind CSS 4, Wouter
- API: Express 5
- DB library: PostgreSQL + Drizzle ORM (not used by the current app)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/scanmyowner/` — website; pages in `src/App.tsx`, styles in `src/index.css`, brand images in `public/brand/`.
- `artifacts/api-server/` — Express server; currently exposes only `/api/healthz`.
- `artifacts/mockup-sandbox/` — imported optional canvas component previews.
- `lib/api-spec/`, `lib/api-client-react/`, `lib/api-zod/` — shared API contract and generated clients/validation.
- `lib/db/` — unused database library.
- Each artifact's `.replit-artifact/artifact.toml` defines managed services and proxy routing.

## Architecture decisions

- Import setup preserves the existing structure, stack, and demo behavior. Running the demo does not require implementing live backend features.
- The API and frontend use Replit's shared path-based proxy; no additional Vite proxy is needed.

## Product

- Marketing homepage, pricing, how-it-works, FAQ, and contact pages.
- Vehicle/tag customization and a sample tag page at `/t/demo123`.
- Login, checkout, tag lookup, and owner-contact requests are explicitly frontend previews. They do not authenticate users, charge buyers, save vehicle details, or send messages.

## Gotchas

- Run the app through its managed workflows so the required port and base-path configuration is supplied.
- Do not provision a database just to launch the frontend demo.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
